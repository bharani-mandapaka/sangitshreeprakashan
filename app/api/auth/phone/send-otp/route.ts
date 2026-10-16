import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { normalizePhone, generateOtp } from '@/lib/phone-auth';

const OTP_TTL_MS = 5 * 60 * 1000;      // codes are valid for 5 minutes
const RESEND_COOLDOWN_MS = 30 * 1000;  // don't let the same phone spam requests

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawPhone = body?.phone;
  if (typeof rawPhone !== 'string') {
    return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
  }

  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Cooldown check against the most recent code for this number.
  const { data: recent } = await admin
    .from('phone_otps')
    .select('created_at')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recent && Date.now() - new Date(recent.created_at).getTime() < RESEND_COOLDOWN_MS) {
    return NextResponse.json(
      { error: 'Please wait a few seconds before requesting another code.' },
      { status: 429 },
    );
  }

  // Clear any older codes for this number, then issue a fresh one.
  await admin.from('phone_otps').delete().eq('phone', phone);

  const otp = generateOtp();
  const { error } = await admin.from('phone_otps').insert({
    phone,
    otp,
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── MOCK ─────────────────────────────────────────────────────────────────
  // We return the code directly instead of sending a real SMS, matching the
  // existing mock OTP pattern in the admin users page. Swap this block for a
  // real SMS provider call (Twilio/MSG91/etc.) once one is set up — nothing
  // else in this flow needs to change: the client just stops being shown the
  // code and instead waits for a real text message.
  return NextResponse.json({ phone, otp, mock: true });
}
