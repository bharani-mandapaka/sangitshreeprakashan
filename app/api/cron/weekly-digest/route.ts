import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fireNotifications } from '@/lib/notifications-sender';

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
    console.error('[cron/weekly-digest] orders query failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ordersCount = orders?.length ?? 0;
  const revenue     = (orders ?? []).reduce((s, o) => s + Number(o.subtotal), 0);

  const vars: Record<string, string> = {
    week_start:     weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    week_end:       new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    orders_count:   String(ordersCount),
    revenue:        `₹${revenue.toLocaleString('en-IN')}`,
    visitors:       'N/A',
    top_book:       'N/A',
    returning_rate: 'N/A',
  };

  const result = await fireNotifications('weekly_digest', vars);
  console.log('[cron/weekly-digest]', result);
  return NextResponse.json({ ok: true, ...result });
}
