// Shared PIN-code helpers — safe to import in the browser (no data, no network).
// The actual lookup lives in lib/pincode-lookup.ts (server only), which reads the
// bundled official directory in data/pincodes.json.

export type PincodeLookup =
  // `states` lists every state the PIN's post offices are in: a few PINs straddle a
  // border (e.g. 396230 in Gujarat and Dadra & Nagar Haveli), and ~100 PINs have no
  // state in the source (then `states` is empty and no state check is made).
  | { status: 'valid'; state: string; states: string[]; districts: string[] }
  | { status: 'invalid' }
  // Kept so the browser can treat "the lookup route didn't answer" as a case that
  // never blocks a sale; the bundled directory itself always gives a definite answer.
  | { status: 'unknown' };

export const PINCODE_FORMAT = /^[1-9]\d{5}$/;

const STATE_ALIASES: Record<string, string> = {
  orissa: 'odisha',
  uttaranchal: 'uttarakhand',
  pondicherry: 'puducherry',
};

function normalizeState(s: string): string {
  const n = s
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\b(the|of|nct|union|territory|state)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return STATE_ALIASES[n] ?? n;
}

/** Lenient on purpose (Delhi vs "NCT of Delhi", Orissa vs Odisha): only clearly different states mismatch. */
export function statesMatch(entered: string, official: string): boolean {
  const a = normalizeState(entered);
  const b = normalizeState(official);
  if (!a || !b) return true;
  return a === b || a.includes(b) || b.includes(a);
}
