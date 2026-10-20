// Real-PIN-code check for checkout, backed by India Post's public lookup
// (https://api.postalpincode.in). Used by /api/pincode (called by the checkout form
// as the customer types) and by /api/checkout/create-order (re-check before payment).
//
// Design rule: a lookup that fails for any reason (service down, slow, odd answer)
// comes back as "unknown" and must NEVER block a sale. Only a definite "no records
// found" counts as invalid — and even then the form lets the customer confirm.

export type PincodeLookup =
  | { status: 'valid'; state: string; districts: string[] }
  | { status: 'invalid' }
  | { status: 'unknown' };

export const PINCODE_FORMAT = /^[1-9]\d{5}$/;

const DAY_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: PincodeLookup }>();

function mostCommon(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = '';
  let bestCount = 0;
  counts.forEach((count, v) => {
    if (count > bestCount) { best = v; bestCount = count; }
  });
  return best;
}

export async function lookupPincode(code: string): Promise<PincodeLookup> {
  if (!PINCODE_FORMAT.test(code)) return { status: 'invalid' };

  const hit = cache.get(code);
  if (hit && Date.now() - hit.at < DAY_MS) return hit.value;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) return { status: 'unknown' };

    const entry = (await res.json())?.[0];
    let value: PincodeLookup = { status: 'unknown' };

    if (entry?.Status === 'Success' && Array.isArray(entry.PostOffice) && entry.PostOffice.length > 0) {
      const offices = entry.PostOffice as { State?: string; District?: string }[];
      const state = mostCommon(offices.map((o) => o.State ?? '').filter(Boolean));
      const districts = Array.from(new Set(offices.map((o) => o.District ?? '').filter(Boolean))).slice(0, 3);
      if (state) value = { status: 'valid', state, districts };
    } else if (entry?.Status === 'Error' && /no records/i.test(String(entry.Message ?? ''))) {
      value = { status: 'invalid' };
    }

    if (value.status !== 'unknown') cache.set(code, { at: Date.now(), value });
    return value;
  } catch {
    return { status: 'unknown' };
  } finally {
    clearTimeout(timer);
  }
}

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
