import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { normalizePhone, generateOtp } from '@/lib/phone-auth';
import { isWhatsAppOtpConfigured, sendWhatsAppOtp } from '@/lib/whatsapp-otp';

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

  // Prefer a real WhatsApp send when configured — works in any environment,
  // production included, since it actually delivers the code rather than
  // exposing it. Falls back to the on-screen mock (unset creds, unapproved
  // template, Meta API error, etc.) so the login/signup flow never fully
  // breaks just because WhatsApp delivery did.
  if (isWhatsAppOtpConfigured()) {
    try {
      await sendWhatsAppOtp(phone, otp);
      return NextResponse.json({ phone, mock: false });
    } catch (err) {
      console.error('[send-otp] WhatsApp send failed, falling back to on-screen code:', err);
    }
  }

  // ── MOCK (blocked in real production) ───────────────────────────────────
  // No WhatsApp configured (or the send above failed), so outside real
  // production we return the code directly for on-screen display — same
  // pattern as the admin users page mock. This must NEVER happen in
  // production: the OTP is the only thing standing between "know someone's
  // phone number" and "log in as them", so returning it to whoever asked
  // for it would let anyone take over (or create) any account just by
  // knowing the number. In production, fail closed instead.
  //
  // `NODE_ENV` alone isn't enough to tell dev/test apart from real
  // production here: Vercel sets NODE_ENV=production for Preview
  // deployments too (it's a `next build` artifact, not environment-specific),
  // which would fail-close preview URLs as well and block reviewers from
  // testing phone login there. VERCEL_ENV is what actually distinguishes
  // "preview" from "production" on Vercel; fall back to NODE_ENV off Vercel
  // (e.g. local `next start`).
  const isRealProduction = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === 'production'
    : process.env.NODE_ENV === 'production';

  if (!isRealProduction) {
    return NextResponse.json({ phone, otp, mock: true });
  }

  return NextResponse.json(
    { error: 'OTP delivery is not available right now. Please try again later.' },
    { status: 503 },
  );
}
