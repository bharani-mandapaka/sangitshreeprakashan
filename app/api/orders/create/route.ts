import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { fireNotifications } from '@/lib/notifications-sender';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  // Only used to verify the caller's bearer token below — a plain anon-key
  // client is fine for that, it's just checking a JWT's signature.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  // The actual inserts use the service-role client instead. insert_orders and
  // insert_order_items used to be `with check (true)` so the anon-key client
  // could write here — but that meant anyone could also POST straight to
  // Supabase's PostgREST API with the public anon key and forge orders into
  // another customer's history, bypassing this route (and its userId
  // verification above) entirely. Those permissive policies are now dropped;
  // only the service-role key can insert into these tables at all.
  const admin = getSupabaseAdmin();
  const resend = new Resend(process.env.RESEND_API_KEY);

  const body = await req.json();
  const { id, createdAt, customer, billingAddress, items, subtotal, paymentMethod } = body;

  // ── 0. Resolve the signed-in user from the request's own bearer token ──────
  // We never trust a userId sent in the body — the client-supplied value is
  // discarded (see checkout/page.tsx, which no longer sends one) and instead
  // we verify the session's access_token ourselves. Guests simply send no
  // Authorization header, which resolves to a null user_id below.
  let userId: string | null = null;
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length);
    const { data: { user: verifiedUser } } = await supabase.auth.getUser(token);
    userId = verifiedUser?.id ?? null;
  }

  // ── 1. Save order to Supabase ───────────────────────────────────────────────
  const { error: orderError } = await admin.from('orders').insert({
    id,
    created_at:      createdAt,
    status:          'confirmed',
    customer_name:   customer.name,
    customer_email:  customer.email,
    customer_phone:  customer.phone,
    address_line1:   billingAddress.line1,
    address_city:    billingAddress.city,
    address_state:   billingAddress.state,
    address_pincode: billingAddress.pincode,
    subtotal,
    payment_method:  paymentMethod,
    user_id:         userId ?? null, // null for guest checkout (no account)
  });

  if (orderError) {
    console.error('[orders/create] order insert error:', orderError);
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // ── 2. Save order items to Supabase ─────────────────────────────────────────
  const orderItems = items.map((item: {
    bookId: string; sku: string; titleEnglish: string; titleHindi: string; qty: number; price: number;
  }) => ({
    order_id:      id,
    book_id:       item.bookId,
    sku:           item.sku,
    title_english: item.titleEnglish,
    title_hindi:   item.titleHindi,
    qty:           item.qty,
    price:         item.price,
  }));

  const { error: itemsError } = await admin.from('order_items').insert(orderItems);
  if (itemsError) console.error('[orders/create] items insert error:', itemsError);

  // ── 3. Build shared variables ───────────────────────────────────────────────
  const dateStr = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const itemsListPlain = items
    .map((i: { titleEnglish: string; qty: number; price: number }) =>
      `• ${i.titleEnglish} × ${i.qty}  —  ₹${(i.price * i.qty).toLocaleString('en-IN')}`,
    )
    .join('\n');

  const itemRows = items.map((i: { titleEnglish: string; qty: number; price: number }) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #C9A84C22;color:#F5ECD7;">${i.titleEnglish}</td>
      <td style="padding:8px 0;border-bottom:1px solid #C9A84C22;color:#F5ECD7AA;text-align:center;">×${i.qty}</td>
      <td style="padding:8px 0;border-bottom:1px solid #C9A84C22;color:#C9A84C;text-align:right;font-weight:bold;">
        ₹${(i.price * i.qty).toLocaleString('en-IN')}
      </td>
    </tr>`).join('');

  // Vars for admin notification templates
  const notifVars: Record<string, string> = {
    order_id:         id,
    order_date:       dateStr,
    customer_name:    customer.name,
    customer_email:   customer.email,
    customer_phone:   customer.phone,
    items_list:       itemsListPlain,
    shipping_address: `${billingAddress.line1}, ${billingAddress.city}, ${billingAddress.state} — ${billingAddress.pincode}`,
    order_total:      `₹${subtotal.toLocaleString('en-IN')}`,
    payment_method:   paymentMethod,
  };

  // ── 4. Send customer email + fire admin notifications (parallel) ─────────────
  await Promise.allSettled([

    // Customer confirmation email
    resend.emails.send({
      from:    'Sangit Shree Prakashan <orders@sangitshreeprakashan.com>',
      to:      customer.email,
      subject: `Order Confirmed — ${id} | Sangit Shree Prakashan`,
      html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#040000;font-family:Georgia,serif;">
<div style="max-width:600px;margin:0 auto;background:#040000;padding:40px 32px;">

  <!-- Header -->
  <div style="border-bottom:1px solid #C9A84C33;padding-bottom:24px;margin-bottom:32px;">
    <h1 style="margin:0;color:#C9A84C;font-size:22px;letter-spacing:2px;font-weight:normal;">
      SANGIT SHREE PRAKASHAN
    </h1>
    <p style="margin:4px 0 0;color:#F5ECD755;font-size:12px;letter-spacing:1px;">
      KANPUR, UTTAR PRADESH
    </p>
  </div>

  <!-- Greeting -->
  <h2 style="color:#F5ECD7;font-size:20px;margin:0 0 8px;">Order Confirmed</h2>
  <p style="color:#F5ECD7AA;font-size:14px;margin:0 0 24px;">
    Dear ${customer.name}, thank you for your order. Your books will be dispatched within 2–4 business days.
  </p>

  <!-- Order meta -->
  <div style="background:#0A0000;border:1px solid #C9A84C22;border-radius:12px;padding:20px;margin-bottom:20px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="color:#F5ECD755;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:4px 0;">Order ID</td>
        <td style="color:#C9A84C;font-weight:bold;text-align:right;padding:4px 0;">${id}</td>
      </tr>
      <tr>
        <td style="color:#F5ECD755;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:4px 0;">Date</td>
        <td style="color:#F5ECD7;text-align:right;padding:4px 0;">${dateStr}</td>
      </tr>
      <tr>
        <td style="color:#F5ECD755;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:4px 0;">Payment</td>
        <td style="color:#F5ECD7;text-align:right;padding:4px 0;text-transform:capitalize;">${paymentMethod}</td>
      </tr>
    </table>
  </div>

  <!-- Items -->
  <div style="background:#0A0000;border:1px solid #C9A84C22;border-radius:12px;padding:20px;margin-bottom:20px;">
    <p style="color:#C9A84C;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 12px;">Items Ordered</p>
    <table style="width:100%;border-collapse:collapse;">
      ${itemRows}
      <tr>
        <td colspan="2" style="padding:12px 0 0;color:#F5ECD755;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Total</td>
        <td style="padding:12px 0 0;color:#C9A84C;font-size:18px;font-weight:bold;text-align:right;">
          ₹${subtotal.toLocaleString('en-IN')}
        </td>
      </tr>
    </table>
  </div>

  <!-- Shipping address -->
  <div style="background:#0A0000;border:1px solid #C9A84C22;border-radius:12px;padding:20px;margin-bottom:32px;">
    <p style="color:#C9A84C;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Shipping To</p>
    <p style="color:#F5ECD7;margin:0;line-height:1.6;">
      ${customer.name}<br>
      ${billingAddress.line1}<br>
      ${billingAddress.city}, ${billingAddress.state} — ${billingAddress.pincode}
    </p>
  </div>

  <!-- Footer -->
  <p style="color:#F5ECD733;font-size:11px;line-height:1.6;margin:0;">
    For queries or cancellations, reply to this email or contact us at<br>
    sangitshreeprakashan@gmail.com · Kanpur, UP 208002
  </p>

</div>
</body>
</html>`,
    }).catch((err) => console.error('[orders/create] customer email error:', err)),

    // Admin notifications (order_placed rules from Supabase)
    fireNotifications('order_placed', notifVars)
      .catch((err) => console.error('[orders/create] admin notification error:', err)),
  ]);

  return NextResponse.json({ success: true, orderId: id });
}
