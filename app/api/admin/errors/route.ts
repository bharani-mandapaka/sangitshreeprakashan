import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest } from '@/lib/admin-auth';
import { countOpenErrors } from '@/lib/error-log';

// Reads and manages error_logs (see error-logs.sql) for Admin -> System. The table has
// RLS on with no public policy, so it is only reachable here with the service-role key,
// and every handler checks the signed admin session cookie first.

const unauthorized = () => NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
const failure = (err: unknown, fallback: string) =>
  NextResponse.json({ error: err instanceof Error ? err.message : fallback }, { status: 500 });

// ?summary=1 -> just the counts for the sidebar badge; otherwise the 200 most recent errors.
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();

  if (req.nextUrl.searchParams.get('summary')) {
    return NextResponse.json(await countOpenErrors());
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('error_logs')
      .select('*')
      .order('resolved', { ascending: true })
      .order('last_seen', { ascending: false })
      .limit(200);
    if (error) {
      // Table not created yet: the page shows a how-to-enable note instead of an error.
      const missing = error.code === 'PGRST205' || /error_logs/.test(error.message);
      return NextResponse.json({ errors: [], tableMissing: missing, error: missing ? undefined : error.message }, { status: missing ? 200 : 500 });
    }
    return NextResponse.json({ errors: data ?? [], tableMissing: false });
  } catch (err) {
    return failure(err, 'Failed to load errors.');
  }
}

// { id, resolved } marks one error resolved / open again.
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = await req.json().catch(() => null);
  if (typeof body?.id !== 'number' || typeof body?.resolved !== 'boolean') {
    return NextResponse.json({ error: 'id and resolved are required.' }, { status: 400 });
  }
  try {
    const { error } = await getSupabaseAdmin().from('error_logs').update({ resolved: body.resolved }).eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return failure(err, 'Failed to update the error.');
  }
}

// Removes every error already marked resolved. Open ones are never deleted from here.
export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const { error } = await getSupabaseAdmin().from('error_logs').delete().eq('resolved', true);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return failure(err, 'Failed to clear resolved errors.');
  }
}
