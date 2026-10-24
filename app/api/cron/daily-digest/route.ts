import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fireNotifications } from '@/lib/notifications-sender';
import { logError, countOpenErrors } from '@/lib/error-log';
import { getAnalyticsSummary, prettySlug } from '@/lib/analytics-server';

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets Authorization: Bearer <CRON_SECRET>)
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Service-role client: `orders` RLS only lets a signed-in customer see their
  // own rows, so the anon key would always return zero orders here.
  const supabase = getSupabaseAdmin();

  // Yesterday's orders: the whole previous day in India time (00:00 → 00:00 IST).
  // This cron runs at 02:00 UTC (7:30 AM IST), so counting "today" from midnight UTC, as it
  // used to, only covered the first two hours of the day and reported almost nothing.
  const todayIst = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
  const windowEnd   = new Date(`${todayIst}T00:00:00+05:30`);
  const windowStart = new Date(windowEnd.getTime() - 24 * 60 * 60 * 1000);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('subtotal, status')
    .gte('created_at', windowStart.toISOString())
    .lt('created_at', windowEnd.toISOString())
    .neq('status', 'cancelled');

  // Don't send a digest claiming "0 orders" when the query actually failed.
  if (error) {
    await logError('cron/daily-digest', `Orders query failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ordersCount = orders?.length ?? 0;
  const revenue     = (orders ?? []).reduce((s, o) => s + Number(o.subtotal), 0);

  const analytics = await getAnalyticsSummary(2);   // [yesterday, today]
  const yesterday = analytics.tableMissing ? null : analytics.daily[0];

  const vars: Record<string, string> = {
    date:         windowStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }),
    orders_count: String(ordersCount),
    revenue:      `₹${revenue.toLocaleString('en-IN')}`,
    // Visitor numbers are for YESTERDAY (a full day): this runs early in the morning, when
    // "today" has barely started. N/A until analytics.sql has been run.
    visitors:     yesterday ? String(yesterday.visitors) : 'N/A',
    cart_adds:    yesterday ? String(yesterday.cartAdds) : 'N/A',
    top_book:     yesterday ? prettySlug(yesterday.topBook) : 'N/A',
    // Unresolved errors in Admin -> System; only shows up if the digest template includes {{open_errors}}.
    open_errors:  String((await countOpenErrors()).open),
  };

  const result = await fireNotifications('daily_digest', vars);
  console.log('[cron/daily-digest]', result);
  return NextResponse.json({ ok: true, ...result });
}
