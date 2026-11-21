import { createHmac, timingSafeEqual } from 'crypto';

// A private link code for one order's invoice, so a customer who paid without an account
// (a guest) can still download it. The code is "<expiryMs>.<hmac>"; the signature covers
// the order id and the expiry, so it only opens that one order and can't be extended or
// reused for another order. It reuses ADMIN_SESSION_SECRET with its own prefix so a code can
// never double as an admin session cookie. Nothing is stored: there is no table to run.

const LINK_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function sign(orderId: string, expiry: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set — cannot sign invoice links.');
  return createHmac('sha256', secret).update(`invoice-link:${orderId}:${expiry}`).digest('hex');
}

/** Returns a code for this order's invoice, or null when signing isn't possible (never throws). */
export function createInvoiceLinkToken(orderId: string): string | null {
  try {
    const expiry = String(Date.now() + LINK_TTL_MS);
    return `${expiry}.${sign(orderId, expiry)}`;
  } catch {
    return null;
  }
}

/** True only when the code was made for exactly this order and hasn't expired. */
export function isValidInvoiceLinkToken(orderId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const [expiry, signature] = token.split('.');
  if (!expiry || !signature || Date.now() > Number(expiry)) return false;
  try {
    const expected = Buffer.from(sign(orderId, expiry));
    const given = Buffer.from(signature);
    return expected.length === given.length && timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}
