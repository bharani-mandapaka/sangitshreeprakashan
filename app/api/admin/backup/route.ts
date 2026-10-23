import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest } from '@/lib/admin-auth';

// A downloadable copy of the shop's own data (orders, books, notification rules, saved
// addresses, wishlists) as one JSON file, so there is a copy outside Supabase if
// something goes wrong. It is admin-only and contains customer names, phone numbers and
// addresses, so it is sent with no-store and should be kept somewhere private.
//
// Not included: customer login accounts (they live in Supabase Auth, which the data API
// can't export) and one-time codes / rate-limit counters (throwaway data).
// See BACKUP-AND-RESTORE.md for how to restore from this file.

const TABLES = ['books', 'orders', 'order_items', 'notification_rules', 'saved_addresses', 'wishlist'] as const;
const PAGE = 1000; // Supabase returns at most 1000 rows per request

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  try {
    const db = getSupabaseAdmin();
    const tables: Record<string, unknown[]> = {};
    const skipped: Record<string, string> = {};

    for (const table of TABLES) {
      const rows: unknown[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await db.from(table).select('*').order('id', { ascending: true }).range(from, from + PAGE - 1);
        if (error) {
          // A table that doesn't exist yet (e.g. saved_addresses on an older database) is
          // skipped and noted in the file, but a real failure must not produce a "backup".
          if (error.code === 'PGRST205') { skipped[table] = 'table does not exist'; break; }
          return NextResponse.json({ error: `Backup stopped: could not read ${table} (${error.message}).` }, { status: 500 });
        }
        rows.push(...(data ?? []));
        if (!data || data.length < PAGE) break;
      }
      if (!(table in skipped)) tables[table] = rows;
    }

    const counts = Object.fromEntries(Object.entries(tables).map(([t, r]) => [t, r.length]));
    const stamp = new Date().toISOString();
    const file = { app: 'sangit-shree-prakashan', createdAt: stamp, counts, skipped, tables };

    return new NextResponse(JSON.stringify(file, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="ssp-backup-${stamp.slice(0, 10)}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Backup failed.' }, { status: 500 });
  }
}
