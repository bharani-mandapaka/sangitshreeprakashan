// Restores a backup file downloaded from Admin -> System -> "Download backup".
//
//   node scripts/restore-backup.mjs <backup.json>            preview only (changes nothing)
//   node scripts/restore-backup.mjs <backup.json> --apply    write the rows back
//
// It only ADDS or OVERWRITES rows by id (an "upsert"); it never deletes anything, so rows
// created after the backup was taken are left alone. Reads NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY from the environment or from .env.local, and never prints them.
// See BACKUP-AND-RESTORE.md.

import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const [file, flag] = process.argv.slice(2);
const apply = flag === '--apply';

if (!file || !existsSync(file)) {
  console.error('Usage: node scripts/restore-backup.mjs <backup.json> [--apply]');
  process.exit(1);
}

// Minimal .env.local reader (only fills in values that are not already set).
if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (set them or run from the project folder with .env.local).');
  process.exit(1);
}

const backup = JSON.parse(readFileSync(file, 'utf8'));
if (backup.app !== 'sangit-shree-prakashan' || typeof backup.tables !== 'object') {
  console.error('This does not look like a Sangit Shree Prakashan backup file.');
  process.exit(1);
}

// Parents before children, so foreign keys are satisfied.
const ORDER = ['books', 'orders', 'order_items', 'notification_rules', 'saved_addresses', 'wishlist'];
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

console.log(`Backup from ${backup.createdAt}`);
console.log(apply ? 'MODE: APPLY (writing to the database)\n' : 'MODE: PREVIEW (nothing will be changed; add --apply to restore)\n');

let failed = false;
for (const table of ORDER) {
  const rows = backup.tables[table];
  if (!Array.isArray(rows)) { console.log(`${table.padEnd(20)} not in this backup`); continue; }

  const { count, error: countError } = await db.from(table).select('id', { count: 'exact', head: true });
  const existing = countError ? `unreadable (${countError.message})` : `${count} now`;
  console.log(`${table.padEnd(20)} ${String(rows.length).padStart(6)} in backup, ${existing}`);
  if (!apply || rows.length === 0) continue;

  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await db.from(table).upsert(rows.slice(i, i + 500), { onConflict: 'id' });
    if (error) {
      console.error(`  FAILED on ${table}: ${error.message}`);
      failed = true;
      break;
    }
  }
}

console.log(failed ? '\nFinished with errors, see above.' : apply ? '\nDone.' : '\nPreview finished. Nothing was changed.');
// Not process.exit(): on Windows it can abort while connections are still closing.
process.exitCode = failed ? 1 : 0;
