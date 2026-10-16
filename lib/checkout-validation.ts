// Shared by the checkout form (app/checkout/page.tsx) and the create-order route
// (app/api/checkout/create-order/route.ts) so both enforce the same rules. It
// must run before payment starts: rejecting details after the customer has paid
// would leave them charged with no order.
//
// Kept free of server-only imports so it can be bundled into the browser.

export interface CheckoutDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export type CheckoutErrors = Partial<Record<keyof CheckoutDetails, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PINCODE_RE = /^[1-9]\d{5}$/;

// Same rule lib/phone-auth.ts uses for login: a 10-digit Indian mobile starting
// 6–9, with an optional +91 / 91 / 0 prefix. Duplicated rather than imported
// because that file also holds server-only crypto code.
export function normalizeIndianMobile(raw: string): string | null {
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  if (digits.length !== 10 || !/^[6-9]/.test(digits)) return null;
  return `+91${digits}`;
}

// True if the text has at least one character that isn't a digit, space or ASCII punctuation —
// i.e. a letter in any script (Latin, Devanagari, …). Avoids the /u regex flag the tsconfig target lacks.
const hasLetter = (s: string) => /[^\d\s\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/.test(s);

const asText = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Returns per-field error messages (empty object when valid) and the cleaned values to save. */
export function validateCheckoutDetails(input: Partial<Record<keyof CheckoutDetails, unknown>>): {
  errors: CheckoutErrors;
  clean: CheckoutDetails;
} {
  const errors: CheckoutErrors = {};

  const name = asText(input.name).replace(/\s+/g, ' ');
  if (name.length < 2 || !hasLetter(name)) errors.name = 'Enter your full name.';
  else if (name.length > 100) errors.name = 'Name is too long (100 characters at most).';

  const email = asText(input.email);
  if (!EMAIL_RE.test(email) || email.length > 254) errors.email = 'Enter a valid email address, like name@example.com.';

  const phoneRaw = asText(input.phone);
  const phone = normalizeIndianMobile(phoneRaw);
  if (!phone) errors.phone = 'Enter a valid 10-digit Indian mobile number, like 98765 43210.';

  const address = asText(input.address).replace(/\s+/g, ' ');
  if (address.length < 5) errors.address = 'Enter your full address (house/flat number, street, area).';
  else if (address.length > 300) errors.address = 'Address is too long (300 characters at most).';

  const city = asText(input.city).replace(/\s+/g, ' ');
  if (city.length < 2 || !hasLetter(city)) errors.city = 'Enter your city.';
  else if (city.length > 60) errors.city = 'City name is too long.';

  const state = asText(input.state).replace(/\s+/g, ' ');
  if (state.length < 2 || !hasLetter(state)) errors.state = 'Enter your state.';
  else if (state.length > 60) errors.state = 'State name is too long.';

  const pincode = asText(input.pincode);
  if (!PINCODE_RE.test(pincode)) errors.pincode = 'Enter a valid 6-digit PIN code.';

  return {
    errors,
    clean: { name, email, phone: phone ?? phoneRaw, address, city, state, pincode },
  };
}
