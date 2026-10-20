// Server-side PIN-code lookup against the bundled official directory
// (data/pincodes.json, built by scripts/build-pincodes.mjs from the Department of
// Posts' All India Pincode Directory). No network call, so it's instant and can't
// be taken down by an outside service. Import this only from server code (API
// routes) — the file is ~400 KB and must not end up in the browser bundle.

import directory from '@/data/pincodes.json';
import { PINCODE_FORMAT, type PincodeLookup } from '@/lib/pincode';

interface Directory {
  count: number;
  builtAt: string;
  states: string[];
  districts: string[];
  pins: Record<string, [number[], number[]]>;
}
const data = directory as unknown as Directory;

export function lookupPincode(code: string): PincodeLookup {
  if (!PINCODE_FORMAT.test(code)) return { status: 'invalid' };
  const entry = data.pins[code];
  if (!entry) return { status: 'invalid' };

  const states = entry[0].map((i) => data.states[i]);
  const districts = entry[1].map((i) => data.districts[i]);
  return { status: 'valid', state: states[0] ?? '', states, districts };
}

export const PINCODE_DIRECTORY_INFO = { count: data.count, builtAt: data.builtAt };
