// Builds data/pincodes.json — the compact PIN-code list the checkout validates against —
// from the Government of India's "All India Pincode Directory" CSV (Department of Posts,
// via data.gov.in, Government Open Data License - India).
//
// Refresh about once a year (India Post adds PINs):
//   1. Download the latest "All India Pincode Directory till last month" CSV from data.gov.in
//   2. node scripts/build-pincodes.mjs "C:\path\to\that-file.csv"
//   3. Commit the regenerated data/pincodes.json
//
// Output shape (kept small — it ships inside the server code, never to the browser):
//   { source, builtAt, count, states: [name…], districts: [name…],
//     pins: { "208001": [[stateIdx…], [districtIdx…]] , … } }

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: node scripts/build-pincodes.mjs <path-to-All-India-Pincode-Directory.csv>');
  process.exit(1);
}

// Small CSV reader that copes with quoted fields containing commas.
function parseCsv(text) {
  const rows = [];
  let row = [], cur = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else quoted = false; }
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

const SMALL = new Set(['and', 'of']);
function titleCase(s) {
  return s.toLowerCase().split(/\s+/).filter(Boolean)
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.replace(/(^|[-(/])([a-z])/g, (m, p, ch) => p + ch.toUpperCase())))
    .join(' ');
}
const cleanState = (s) => titleCase(s.trim().replace(/^the\s+/i, ''));
const isBlank = (s) => !s || /^(na|n\/a|null|-)?$/i.test(s.trim());

const rows = parseCsv(readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, ''));
const head = rows[0].map((h) => h.trim().toLowerCase());
const col = (name) => {
  const i = head.indexOf(name);
  if (i < 0) throw new Error(`Column "${name}" not found. Columns are: ${head.join(', ')}`);
  return i;
};
const iPin = col('pincode'), iState = col('statename'), iDistrict = col('district');

const states = [], districts = [];
const stateIdx = new Map(), districtIdx = new Map();
const idx = (list, map, v) => { if (!map.has(v)) { map.set(v, list.length); list.push(v); } return map.get(v); };

const byPin = new Map(); // pin -> { s: Map<stateIdx, postOffices>, d: Map<districtIdx, postOffices> }
let rowCount = 0;
for (const r of rows.slice(1)) {
  const pin = (r[iPin] ?? '').trim();
  if (!/^[1-9]\d{5}$/.test(pin)) continue;
  rowCount++;
  if (!byPin.has(pin)) byPin.set(pin, { s: new Map(), d: new Map() });
  const entry = byPin.get(pin);
  const bump = (m, k) => m.set(k, (m.get(k) ?? 0) + 1);
  if (!isBlank(r[iState])) bump(entry.s, idx(states, stateIdx, cleanState(r[iState])));
  if (!isBlank(r[iDistrict])) bump(entry.d, idx(districts, districtIdx, titleCase(r[iDistrict].trim())));
}

const pins = {};
for (const pin of [...byPin.keys()].sort()) {
  const { s, d } = byPin.get(pin);
  // Most common first: the checkout fills City/State from the first entry of each list.
  const byCount = (m) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([k]) => k);
  pins[pin] = [byCount(s), byCount(d).slice(0, 3)];
}

const out = {
  source: 'All India Pincode Directory — Department of Posts, via data.gov.in (Government Open Data License - India)',
  builtAt: new Date().toISOString().slice(0, 10),
  count: byPin.size,
  states,
  districts,
  pins,
};

const target = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'pincodes.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(out) + '\n');

const noState = [...byPin.values()].filter((e) => e.s.size === 0).length;
const multi = [...byPin.values()].filter((e) => e.s.size > 1).length;
console.log(`Read ${rowCount} post-office rows.`);
console.log(`Wrote ${byPin.size} unique PINs to ${target}`);
console.log(`  ${states.length} states/UTs, ${districts.length} districts; ${multi} PINs span more than one state; ${noState} PINs have no state in the source.`);
