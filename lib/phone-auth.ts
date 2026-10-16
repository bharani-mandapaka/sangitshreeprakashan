import { createHmac, randomInt } from 'crypto';

// Server-only helpers for phone-number sign-up/login. Customers never see or
// set a password — Supabase still authenticates with email+password under the
// hood (the only auth method that needs no provider configuration), but the
// "email" is a synthetic address derived from the phone number, and the
// "password" is deterministically derived from it too, so we never have to
// store a credential of our own. Only this server-side code ever computes
// either value.

/**
 * Normalizes a user-entered Indian mobile number to a canonical
 * "+91XXXXXXXXXX" form. Accepts "9876543210", "09876543210",
 * "+919876543210", or "919876543210". Returns null if it doesn't look like a
 * valid 10-digit Indian mobile number.
 */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  if (digits.length !== 10 || !/^[6-9]/.test(digits)) return null;
  return `+91${digits}`;
}

/** Deterministic, non-secret-looking local-part for the synthetic auth email. */
export function phoneToSyntheticEmail(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  return `phone-${digits}@ssp-phone-auth.internal`;
}

/**
 * Derives a stable "password" for a phone number from a server-only secret.
 * Recomputing this is how we sign a returning phone account back in without
 * ever storing a password anywhere ourselves — Supabase only ever sees and
 * stores the bcrypt hash of this derived value.
 */
export function derivePasswordForPhone(phone: string): string {
  const secret = process.env.PHONE_AUTH_SECRET;
  if (!secret) {
    throw new Error('PHONE_AUTH_SECRET is not set — cannot derive a phone account password.');
  }
  return createHmac('sha256', secret).update(phone).digest('hex');
}

/** Six-digit numeric OTP, e.g. "042817". */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}
