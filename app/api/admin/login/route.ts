import { NextRequest, NextResponse } from 'next/server';
import { createAdminSessionToken, ADMIN_COOKIE_NAME } from '@/lib/admin-auth';
import { checkLimit, recordHit, getClientIp, tooManyRequests } from '@/lib/rate-limit';

// The admin password is one shared secret, so wrong guesses are capped per visitor:
// only *failed* attempts count, so a real admin who types it right is never slowed down.
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: 'Admin login is not configured on the server.' }, { status: 500 });
  }

  const limitKey = `admin-login:${getClientIp(req)}`;
  const limit = await checkLimit(limitKey, MAX_FAILED_ATTEMPTS, ATTEMPT_WINDOW_MS);
  if (limit.limited) return tooManyRequests('incorrect attempts', limit.retryAfterSec);

  if (typeof password !== 'string' || password !== expected) {
    await recordHit(limitKey);
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
