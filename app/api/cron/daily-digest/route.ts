import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { fireNotifications } from '@/lib/notifications-sender';

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets Authorization: Bearer <CRON_SECRET>)
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Service-role client: `orders` RLS only lets a signed-in customer see their
  // own rows, so the anon key would always return zero orders here.
  const supabase = getSupabaseAdmin();

  // Today's orders (midnight UTC → now)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('subtotal, status')
    .gte('created_at', today.toISOString())
    .neq('status', 'cancelled');

  // Don't send a digest claiming "0 orders" when the query actually failed.
  if (error) {
    console.error('[cron/daily-digest] orders query failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ordersCount = orders?.length ?? 0;
  const revenue     = (orders ?? []).reduce((s, o) => s + Number(o.subtotal), 0);

  const vars: Record<string, string> = {
    date:         today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    orders_count: String(ordersCount),
    revenue:      `₹${revenue.toLocaleString('en-IN')}`,
    // analytics (visits, clicks) are client-side only — not available server-side
    visitors:     'N/A',
    cart_adds:    'N/A',
    top_book:     'N/A',
  };

  const result = await fireNotifications('daily_digest', vars);
  console.log('[cron/daily-digest]', result);
  return NextResponse.json({ ok: true, ...result });
}
