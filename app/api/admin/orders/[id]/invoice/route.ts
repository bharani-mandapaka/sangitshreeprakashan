import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest } from '@/lib/admin-auth';

// Backs the admin "Print Invoice" page (app/admin/orders/[id]/invoice/page.tsx).
// Same service-role + admin-cookie pattern as every other admin route — see
// app/api/admin/orders/route.ts for the reasoning (orders SELECT is RLS-scoped
// to the owning customer, so the admin panel has no way to read arbitrary
// orders except through this server-only key).
//
// invoice_number is assigned lazily, here, the first time anyone actually
// prints an order's invoice — not at order-creation time — so the sequence
// (orders_invoice_number_seq, see supabase/schema.sql) only advances for
// orders someone actually needed a document for. Once set, it's never
// reassigned.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { id } = params;

  const { data: order, error: fetchError } = await admin
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  if (order.invoice_number == null) {
    const { data: nextNumber, error: rpcError } = await admin.rpc('next_invoice_number');
    if (rpcError) {
      return NextResponse.json({ error: `Failed to assign an invoice number: ${rpcError.message}` }, { status: 500 });
    }
    const { error: updateError } = await admin
      .from('orders')
      .update({ invoice_number: nextNumber })
      .eq('id', id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    order.invoice_number = nextNumber;
  }

  return NextResponse.json({ order });
}
