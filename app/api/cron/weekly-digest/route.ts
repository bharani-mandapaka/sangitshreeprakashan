import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fireNotifications } from '@/lib/notifications-sender';
import { logError, countOpenErrors } from '@/lib/error-log';
import { getAnalyticsSummary, prettySlug } from '@/lib/analytics-server';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Service-role client: `orders` RLS only lets a signed-in customer see their
  // own rows, so the anon key would always return zero orders here.
  const supabase = getSupabaseAdmin();

  // Last 7 days of orders
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  weekStart.setUTCHours(0, 0, 0, 0);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('subtotal, status')
    .gte('created_at', weekStart.toISOString())
    .neq('status', 'cancelled');

  // Don't send a digest claiming "0 orders" when the query actually failed.
  if (error) {
    await logError('cron/weekly-digest', `Orders query failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ordersCount = orders?.length ?? 0;
  const revenue     = (orders ?? []).reduce((s, o) => s + Number(o.subtotal), 0);

  const analytics = await getAnalyticsSummary(7);

  const vars: Record<string, string> = {
    week_start:    weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    week_end:       new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    orders_count:   String(ordersCount),
    revenue:        `₹${revenue.toLocaleString('en-IN')}`,
    // Visitors are unique per day, added up over the 7 days. N/A until analytics.sql has been run.
    visitors:       analytics.tableMissing ? 'N/A' : String(analytics.totals.visitors),
    top_book:       analytics.tableMissing ? 'N/A' : prettySlug(analytics.topBooks[0]?.slug),
    returning_rate: 'N/A',
    // Unresolved errors in Admin -> System; only shows up if the digest template includes {{open_errors}}.
    open_errors:    String((await countOpenErrors()).open),
  };

  const result = await fireNotifications('weekly_digest', vars);
  console.log('[cron/weekly-digest]', result);
  return NextResponse.json({ ok: true, ...result });
}
