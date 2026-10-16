import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getSupabaseServer } from '@/lib/supabase';
import { normalizePhone, phoneToSyntheticEmail, derivePasswordForPhone } from '@/lib/phone-auth';

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawPhone = body?.phone;
  const otp = body?.otp;
  const mode = body?.mode === 'signup' ? 'signup' : 'login';
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';

  if (typeof rawPhone !== 'string' || typeof otp !== 'string') {
    return NextResponse.json({ error: 'Phone number and code are required.' }, { status: 400 });
  }

  if (mode === 'signup' && !name) {
    return NextResponse.json({ error: 'Full name is required to create an account.' }, { status: 400 });
  }

  const phone = normalizePhone(rawPhone);
  if (!phone) {
    return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: record } = await admin
    .from('phone_otps')
    .select('id, otp, expires_at, attempts')
    .eq('phone', phone)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!record) {
    return NextResponse.json({ error: 'No code was requested for this number. Request a new one.' }, { status: 400 });
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await admin.from('phone_otps').delete().eq('id', record.id);
    return NextResponse.json({ error: 'That code has expired. Request a new one.' }, { status: 400 });
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await admin.from('phone_otps').delete().eq('id', record.id);
    return NextResponse.json({ error: 'Too many incorrect attempts. Request a new code.' }, { status: 400 });
  }

  if (record.otp !== otp) {
    await admin.from('phone_otps').update({ attempts: record.attempts + 1 }).eq('id', record.id);
    return NextResponse.json({ error: 'Incorrect code. Try again.' }, { status: 400 });
  }

  // Correct — this code is now spent.
  await admin.from('phone_otps').delete().eq('id', record.id);

  const syntheticEmail = phoneToSyntheticEmail(phone);
  const derivedPassword = derivePasswordForPhone(phone);

  // Try signing in as an existing phone account first.
  const anon = getSupabaseServer();
  const signInResult = await anon.auth.signInWithPassword({
    email: syntheticEmail,
    password: derivedPassword,
  });

  let session = signInResult.data.session;
  const accountExists = !!session;

  if (mode === 'login' && !accountExists) {
    return NextResponse.json(
      { error: 'No account found with this number. Create one first — tap "Sign up" below.' },
      { status: 404 },
    );
  }

  if (mode === 'signup' && accountExists) {
    return NextResponse.json(
      { error: 'An account already exists with this number. Login instead — tap "Login" below.' },
      { status: 409 },
    );
  }

  if (!session) {
    // mode === 'signup' and no existing account — create one, then sign in.
    const { error: createError } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      password: derivedPassword,
      email_confirm: true,
      user_metadata: {
        phone,
        full_name: name || null,
        real_email: email || null,
      },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    const secondSignIn = await anon.auth.signInWithPassword({
      email: syntheticEmail,
      password: derivedPassword,
    });

    if (secondSignIn.error || !secondSignIn.data.session) {
      return NextResponse.json(
        { error: secondSignIn.error?.message ?? 'Account created but sign-in failed. Try again.' },
        { status: 500 },
      );
    }
    session = secondSignIn.data.session;
  }

  return NextResponse.json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
}
