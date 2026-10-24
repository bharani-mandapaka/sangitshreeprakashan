import { createHash, createHmac } from 'crypto';
import type { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Server side of the shop's own analytics (table: analytics_events, see analytics.sql).
// Anonymous by design: no cookies, no stored IP addresses. A "visitor" is a one-way hash
// of IP + browser + a salt that changes every day, so the same person looks like a new
// visitor each day and nobody can be identified or followed from the data.

export type AnalyticsEventType = 'page_view' | 'add_to_cart' | 'checkout_start';
export const EVENT_TYPES: AnalyticsEventType[] = ['page_view', 'add_to_cart', 'checkout_start'];

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|uptime|curl|wget|python|axios|node-fetch/i;
const RETENTION_DAYS = 90;
const DEDUPE_WINDOW_MS = 30 * 1000;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

/** The visitor's IP as Vercel saw it; only ever used as an input to the daily hash. */
function clientIp(req: NextRequest): string {
  return (req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown').trim();
}

/** Day string in India time, so "today" matches the shop's day. */
export function istDay(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

export function visitorHash(req: NextRequest, now = new Date()): string {
  // The salt rotates daily and is derived from a server secret, so the hash can't be
  // recomputed (and a visitor looked up) by anyone without it.
  const secret = process.env.ADMIN_SESSION_SECRET || 'ssp-analytics';
  const daySalt = createHmac('sha256', secret).update(`analytics-day:${istDay(now)}`).digest('hex');
  return createHash('sha256')
    .update(`${daySalt}|${clientIp(req)}|${req.headers.get('user-agent') ?? ''}`)
    .digest('hex')
    .slice(0, 32);
}

/** Records one event. Never throws: analytics must never break a page. Returns false if skipped/failed. */
export async function recordEvent(
  req: NextRequest,
  event: { type: AnalyticsEventType; path: string; bookSlug?: string | null },
): Promise<boolean> {
  try {
    const db = getSupabaseAdmin();
    const visitor = visitorHash(req);

    // The same visitor reloading or double-firing within 30 s counts once.
    const since = new Date(Date.now() - DEDUPE_WINDOW_MS).toISOString();
    const { count, error: dupError } = await db
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('visitor', visitor)
      .eq('type', event.type)
      .eq('path', event.path)
      .gte('created_at', since);
    if (dupError) return false;                 // table missing or Supabase down: record nothing
    if ((count ?? 0) > 0) return false;

    const { error } = await db.from('analytics_events').insert({
      type: event.type,
      path: event.path,
      book_slug: event.bookSlug ?? null,
      visitor,
    });
    if (error) return false;

    // Housekeeping: now and then, drop events older than the retention period.
    if (Math.random() < 0.01) {
      await db.from('analytics_events').delete().lt('created_at', new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString());
    }
    return true;
  } catch {
    return false;
  }
}

/** 'swar-vadan-part-1' -> 'Swar Vadan Part 1' (for messages). */
export function prettySlug(slug: string | null | undefined): string {
  return slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'N/A';
}

export interface AnalyticsSummary {
  days: number;
  since: string;
  totals: { pageViews: number; visitors: number; cartAdds: number; checkoutStarts: number };
  daily: { date: string; pageViews: number; visitors: number; cartAdds: number; topBook: string | null }[];
  topBooks: { slug: string; views: number }[];
  /** True when the period had more events than we read (the numbers are then a floor, not exact). */
  truncated: boolean;
  tableMissing: boolean;
}

const PAGE = 1000;
const MAX_ROWS = 20000;

/** Aggregates the last `days` days (including today, India time). Never throws. */
export async function getAnalyticsSummary(days: number): Promise<AnalyticsSummary> {
  const now = new Date();
  // Start of the first day, India time (UTC+5:30, no daylight saving).
  const startDay = new Date(now.getTime() - (days - 1) * 86400000);
  const sinceIso = new Date(`${istDay(startDay)}T00:00:00+05:30`).toISOString();

  const empty: AnalyticsSummary = {
    days, since: sinceIso,
    totals: { pageViews: 0, visitors: 0, cartAdds: 0, checkoutStarts: 0 },
    daily: [], topBooks: [], truncated: false, tableMissing: false,
  };

  // Every day in the range appears in the chart, even with zero visits.
  const byDay = new Map<string, { pageViews: number; visitors: Set<string>; cartAdds: number; books: Record<string, number> }>();
  for (let i = 0; i < days; i++) {
    byDay.set(istDay(new Date(startDay.getTime() + i * 86400000)), { pageViews: 0, visitors: new Set(), cartAdds: 0, books: {} });
  }
  const bookViews: Record<string, number> = {};
  const totals = { pageViews: 0, visitors: 0, cartAdds: 0, checkoutStarts: 0 };
  let truncated = false;

  try {
    const db = getSupabaseAdmin();
    for (let from = 0; ; from += PAGE) {
      if (from >= MAX_ROWS) { truncated = true; break; }
      const { data, error } = await db
        .from('analytics_events')
        .select('type, book_slug, visitor, created_at')
        .gte('created_at', sinceIso)
        .order('id', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) return { ...empty, daily: Array.from(byDay.keys()).map((date) => ({ date, pageViews: 0, visitors: 0, cartAdds: 0, topBook: null })), tableMissing: true };

      for (const e of data ?? []) {
        const day = byDay.get(istDay(new Date(e.created_at as string)));
        if (e.type === 'page_view') {
          totals.pageViews++;
          if (day) { day.pageViews++; day.visitors.add(e.visitor as string); }
          if (e.book_slug) {
            bookViews[e.book_slug as string] = (bookViews[e.book_slug as string] ?? 0) + 1;
            if (day) day.books[e.book_slug as string] = (day.books[e.book_slug as string] ?? 0) + 1;
          }
        } else if (e.type === 'add_to_cart') {
          totals.cartAdds++;
          if (day) day.cartAdds++;
        } else if (e.type === 'checkout_start') totals.checkoutStarts++;
      }
      if (!data || data.length < PAGE) break;
    }
  } catch {
    return { ...empty, tableMissing: true };
  }

  const daily = Array.from(byDay.entries()).map(([date, d]) => ({
    date,
    pageViews: d.pageViews,
    visitors: d.visitors.size,
    cartAdds: d.cartAdds,
    topBook: Object.entries(d.books).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
  }));
  totals.visitors = daily.reduce((sum, d) => sum + d.visitors, 0);   // unique per day, added up
  const topBooks = Object.entries(bookViews)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([slug, views]) => ({ slug, views }));

  return { days, since: sinceIso, totals, daily, topBooks, truncated, tableMissing: false };
}
