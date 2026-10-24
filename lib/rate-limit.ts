import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Counts recent attempts per key (table: rate_limit_hits, see rate-limits.sql) so a
// visitor can't guess the admin password or trigger unlimited paid WhatsApp messages.
//
// The count lives in Supabase because the site runs on serverless instances that don't
// share memory. If the table isn't there (not created yet) or Supabase errors, this falls
// back to a per-instance in-memory counter: weaker, but it never blocks real customers
// because of our own infrastructure problem.

export interface LimitResult {
  limited: boolean;
  retryAfterSec: number;
}

const NOT_LIMITED: LimitResult = { limited: false, retryAfterSec: 0 };

/** Fallback store, used only when the database is unavailable. */
const memory = new Map<string, number[]>();
let warned = false;

function warnOnce(message: string) {
  if (warned) return;
  warned = true;
  console.error(`[rate-limit] ${message} — falling back to in-memory counting (run rate-limits.sql).`);
}

/** The visitor's IP as Vercel saw it. Without it (local dev) everyone shares one bucket. */
export function getClientIp(req: NextRequest): string {
  const real = req.headers.get('x-real-ip');
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0];
  return (real || forwarded || 'unknown').trim() || 'unknown';
}

function resultFor(hits: number[], limit: number, windowMs: number, now: number): LimitResult {
  if (hits.length < limit) return NOT_LIMITED;
  // Free again once the hit that put us at the limit ages out of the window.
  const blockingHit = hits[hits.length - limit];
  return { limited: true, retryAfterSec: Math.max(1, Math.ceil((blockingHit + windowMs - now) / 1000)) };
}

function recentFromMemory(key: string, windowMs: number, now: number): number[] {
  const recent = (memory.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length > 0) memory.set(key, recent);
  else memory.delete(key);
  return recent;
}

/** Is this key already at its limit? Does not count anything. */
export async function checkLimit(key: string, limit: number, windowMs: number): Promise<LimitResult> {
  const now = Date.now();
  try {
    const since = new Date(now - windowMs).toISOString();
    const { data, error } = await getSupabaseAdmin()
      .from('rate_limit_hits')
      .select('created_at')
      .eq('key', key)
      .gte('created_at', since)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    const hits = (data ?? []).map((r) => new Date(r.created_at as string).getTime());
    return resultFor(hits, limit, windowMs, now);
  } catch (err) {
    warnOnce(err instanceof Error ? err.message : 'database unavailable');
    return resultFor(recentFromMemory(key, windowMs, now), limit, windowMs, now);
  }
}

/** Counts one attempt against this key. */
export async function recordHit(key: string): Promise<void> {
  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from('rate_limit_hits').insert({ key });
    if (error) throw new Error(error.message);
    // Housekeeping: now and then, drop rows older than a day (no window here is longer).
    if (Math.random() < 0.02) {
      await db.from('rate_limit_hits').delete().lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    }
  } catch (err) {
    warnOnce(err instanceof Error ? err.message : 'database unavailable');
    const now = Date.now();
    memory.set(key, [...(memory.get(key) ?? []), now]);
  }
}

/** Checks the limit and, if there is room, counts this attempt. For "every attempt counts" cases. */
export async function limitAndRecord(key: string, limit: number, windowMs: number): Promise<LimitResult> {
  const result = await checkLimit(key, limit, windowMs);
  if (!result.limited) await recordHit(key);
  return result;
}

/** "a minute" / "5 minutes" / "2 hours", rounded up so we never say "0". */
export function waitText(seconds: number): string {
  if (seconds <= 60) return 'a minute';
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.ceil(minutes / 60);
  return hours === 1 ? 'an hour' : `${hours} hours`;
}

export function tooManyRequests(what: string, retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: `Too many ${what}. Please try again in ${waitText(retryAfterSec)}.` },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
  );
}
