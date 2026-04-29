import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fireNotifications } from '@/lib/notifications-sender';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Last 7 days of orders
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 7);
  weekStart.setUTCHours(0, 0, 0, 0);

  const { data: orders } = await supabase
    .from('orders')
    .select('subtotal, status')
    .gte('created_at', weekStart.toISOString())
    .neq('status', 'cancelled');

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
