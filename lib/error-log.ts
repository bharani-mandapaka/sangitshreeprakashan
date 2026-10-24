import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Records server and browser errors in Supabase (table: error_logs, see error-logs.sql)
// so they can be reviewed in Admin -> System. Vercel's own function logs are kept only
// briefly, so before this a failed checkout was gone by the time anyone looked.
//
// logError never throws and never blocks the caller for long: a problem with the log
// itself must not turn into a second failure for the customer. It always also writes to
// console.error, so nothing is lost if the table doesn't exist yet.

export type ErrorSeverity = 'critical' | 'error' | 'warning';

/** How long an identical open error is grouped into one row instead of a new one. */
const GROUP_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Stop adding new non-critical rows beyond this many unresolved ones (flood guard). */
const MAX_OPEN_ROWS = 500;
const MAX_MESSAGE_LENGTH = 500;
const MAX_DETAILS_LENGTH = 4000;

export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message || err.name;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const e = err as { message?: unknown; error?: unknown };
    if (typeof e.message === 'string') return e.message;
    if (typeof e.error === 'string') return e.error;
    try { return JSON.stringify(err); } catch { /* fall through */ }
  }
  return String(err);
}

/** Keeps details JSON-safe and small enough not to bloat the table. */
function cleanDetails(details: Record<string, unknown> | undefined): Record<string, unknown> | null {
  if (!details) return null;
  try {
    const json = JSON.stringify(details);
    if (json.length <= MAX_DETAILS_LENGTH) return JSON.parse(json);
    return { truncated: true, preview: json.slice(0, MAX_DETAILS_LENGTH) };
  } catch {
    return { unserialisable: true };
  }
}

/** Unresolved errors, for the admin badge and the digests. Returns 0 if the table isn't there yet. */
export async function countOpenErrors(): Promise<{ open: number; critical: number }> {
  try {
    const db = getSupabaseAdmin();
    const [open, critical] = await Promise.all([
      db.from('error_logs').select('id', { count: 'exact', head: true }).eq('resolved', false),
      db.from('error_logs').select('id', { count: 'exact', head: true }).eq('resolved', false).eq('severity', 'critical'),
    ]);
    if (open.error || critical.error) return { open: 0, critical: 0 };
    return { open: open.count ?? 0, critical: critical.count ?? 0 };
  } catch {
    return { open: 0, critical: 0 };
  }
}

export async function logError(
  source: string,
  err: unknown,
  opts: { severity?: ErrorSeverity; details?: Record<string, unknown> } = {},
): Promise<void> {
  const severity = opts.severity ?? 'error';
  const message = describeError(err).slice(0, MAX_MESSAGE_LENGTH);
  console.error(`[${source}]`, severity === 'critical' ? 'CRITICAL:' : '', message, opts.details ?? '');

  try {
    const db = getSupabaseAdmin();
    const details = cleanDetails(opts.details);
    const now = new Date().toISOString();

    // Critical entries are never grouped: each one is a customer who needs help, and the
    // details (payment id, order id) differ every time.
    if (severity !== 'critical') {
      const since = new Date(Date.now() - GROUP_WINDOW_MS).toISOString();
      const { data: existing } = await db
        .from('error_logs')
        .select('id, occurrences')
        .eq('source', source)
        .eq('message', message)
        .eq('resolved', false)
        .gte('last_seen', since)
        .order('last_seen', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        await db
          .from('error_logs')
          .update({ occurrences: (existing.occurrences as number) + 1, last_seen: now, ...(details ? { details } : {}) })
          .eq('id', existing.id);
        return;
      }

      const { count } = await db
        .from('error_logs')
        .select('id', { count: 'exact', head: true })
        .eq('resolved', false);
      if ((count ?? 0) >= MAX_OPEN_ROWS) return;
    }

    const { error } = await db.from('error_logs').insert({ source, severity, message, details });
    if (error) throw new Error(error.message);
  } catch (storeErr) {
    // Most likely the table hasn't been created yet, or Supabase is down.
    console.error('[error-log] could not store the error:', describeError(storeErr));
  }
}
