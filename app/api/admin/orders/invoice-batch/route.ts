import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest } from '@/lib/admin-auth';

// Backs the "Print Selected" bulk-invoice flow (app/admin/orders/page.tsx
// checkboxes -> app/admin/orders/print-batch/page.tsx). Same shape as
// app/api/admin/orders/[id]/invoice/route.ts, just for many orders at once —
// see that file for why this needs the service-role key and admin-cookie
// check at all.
//
// invoice_number is assigned lazily per order, same rule as the single-order
// route: only orders that don't already have one get the sequence advanced,
// and only once someone actually asks to print them.
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const idsParam = req.nextUrl.searchParams.get('ids') ?? '';
  const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);

  if (ids.length === 0) {
    return NextResponse.json({ error: 'No order ids were provided.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: orders, error: fetchError } = await admin
    .from('orders')
    .select('*, order_items(*)')
    .in('id', ids);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!orders || orders.length === 0) {
    return NextResponse.json({ error: 'None of the selected orders were found.' }, { status: 404 });
  }

  // Assign invoice numbers one at a time (sequentially, not in parallel) so
  // that printing several orders together still hands out numbers in a
  // sensible, non-interleaved order rather than racing.
  for (const order of orders) {
    if (order.invoice_number == null) {
      const { data: nextNumber, error: rpcError } = await admin.rpc('next_invoice_number');
      if (rpcError) {
        return NextResponse.json(
          { error: `Failed to assign an invoice number for order ${order.id}: ${rpcError.message}` },
          { status: 500 },
        );
      }
      const { error: updateError } = await admin
        .from('orders')
        .update({ invoice_number: nextNumber })
        .eq('id', order.id);
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      order.invoice_number = nextNumber;
    }
  }

  // Preserve the order the caller asked for (the order the admin selected
  // them in / sorted the table by) rather than whatever order Postgres's
  // `.in()` happens to return them in.
  const byId = new Map(orders.map((o) => [o.id, o]));
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean);

  return NextResponse.json({ orders: ordered });
}
