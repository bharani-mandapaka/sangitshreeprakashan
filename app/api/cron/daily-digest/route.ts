import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fireNotifications } from '@/lib/notifications-sender';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets Authorization: Bearer <CRON_SECRET>)
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Today's orders (midnight UTC → now)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { data: orders } = await supabase
    .from('orders')
    .select('subtotal, status')
    .gte('created_at', today.toISOString())
    .neq('status', 'cancelled');

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
