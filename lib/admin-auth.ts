import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

// Stateless signed admin session cookie — no session table needed. The cookie
// value is "<expiryMs>.<hmacSignature>"; the signature covers the expiry so
// it can't be tampered with or extended without knowing ADMIN_SESSION_SECRET.
// This replaces the old localStorage-only gate (app/admin/layout.tsx used to
// just compare a hardcoded password client-side, which protected nothing —
// anyone could read the password straight out of the JS bundle). The admin
// password itself now lives server-only in ADMIN_PASSWORD and is checked in
// app/api/admin/login/route.ts, never shipped to the browser.

export const ADMIN_COOKIE_NAME = 'ssp_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set — cannot sign/verify admin sessions.');
  return secret;
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('hex');
}

/** Builds a new signed cookie value, valid for SESSION_TTL_MS from now. */
export function createAdminSessionToken(): string {
  const expiry = String(Date.now() + SESSION_TTL_MS);
  return `${expiry}.${sign(expiry)}`;
}

/** Verifies a cookie value's signature and expiry. */
export function isValidAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [expiry, signature] = token.split('.');
  if (!expiry || !signature) return false;
  if (Date.now() > Number(expiry)) return false;

  const expected = sign(expiry);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Convenience check for API routes: is this request from a logged-in admin? */
export function isAdminRequest(req: NextRequest): boolean {
  return isValidAdminSessionToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value);
}
