import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

function interpolate(template: string, vars: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `[${key}]`);
}

async function sendWhatsAppMessage(to: string, body: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token         = process.env.WHATSAPP_TOKEN;
  if (!phoneNumberId || !token) return { skipped: true };
  const clean = to.replace(/\D/g, '');
  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp', recipient_type: 'individual', to: clean,
      type: 'text', text: { preview_url: false, body },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`);
  return { ok: true };
}

// Sample vars that cover every template placeholder
const TEST_VARS: Record<string, string> = {
  order_id:         'TEST-001',
  order_date:       new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
  customer_name:    'Test Customer',
  customer_email:   'test@example.com',
  customer_phone:   '+919999999999',
  items_list:       '• Raag Parichay Part 1 × 2  —  ₹1,100\n• Swar Vadan Shiksha × 1  —  ₹570',
  shipping_address: '123 Test Street, Kanpur, Uttar Pradesh — 208001',
  order_total:      '₹1,670',
  payment_method:   'cod',
  date:             new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
  orders_count:     '3',
  revenue:          '₹4,890',
  visitors:         'N/A',
  cart_adds:        'N/A',
  top_book:         'Raag Parichay Part 1',
  week_start:       '1 Jan',
  week_end:         '7 Jan',
  returning_rate:   'N/A',
  cart_items:       'Raag Parichay Part 1',
  cart_total:       '₹550',
  abandoned_at:     new Date().toLocaleTimeString('en-IN'),
};

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { ruleId } = await req.json();
  if (!ruleId) return NextResponse.json({ error: 'ruleId required' }, { status: 400 });

  // Fetch the specific rule
  const { data: rule, error: fetchErr } = await supabase
    .from('notification_rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (fetchErr || !rule) {
    return NextResponse.json({ error: fetchErr?.message ?? 'Rule not found' }, { status: 404 });
  }

  const results: string[] = [];

  // ── Email ──────────────────────────────────────────────────────────────────
  if ((rule.channel === 'email' || rule.channel === 'both') && rule.recipients?.length > 0) {
    const subject = interpolate(rule.subject, TEST_VARS);
    const body    = interpolate(rule.body,    TEST_VARS);
    const resolvedTo = (rule.recipients as string[])
      .map((r: string) => interpolate(r, TEST_VARS))
      .filter((r: string) => r && !r.includes('[') && r.includes('@'));

    for (const to of resolvedTo) {
      try {
        await resend.emails.send({
          from:    'Sangit Shree Prakashan <orders@sangitshreeprakashan.com>',
          to,
          subject: `[TEST] ${subject}`,
          html: `
<div style="background:#fff3cd;padding:12px 16px;border-left:4px solid #ffc107;font-family:monospace;font-size:13px;margin-bottom:16px;">
  ⚠️ This is a <strong>test notification</strong> sent from the admin panel. No real order was placed.
</div>
<pre style="white-space:pre-wrap;font-family:monospace;font-size:13px;line-height:1.8;color:#444;background:#f9f9f9;padding:16px;border-radius:6px;">${body}</pre>`,
        });
        results.push(`✓ Email sent to ${to}`);
      } catch (err) {
        results.push(`✗ Email to ${to} failed: ${String(err)}`);
      }
    }
    if (resolvedTo.length === 0) results.push('✗ Email: no valid recipients (all placeholders unresolved)');
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────────
  if ((rule.channel === 'whatsapp' || rule.channel === 'both') && rule.whatsapp_numbers?.length > 0) {
    const message = interpolate(rule.whatsapp_message, TEST_VARS);
    const resolvedPhones = (rule.whatsapp_numbers as string[])
      .map((p: string) => interpolate(p, TEST_VARS))
      .filter((p: string) => p && !p.includes('['));

    for (const phone of resolvedPhones) {
      try {
        const r = await sendWhatsAppMessage(phone, `[TEST] ${message}`);
        if ((r as { skipped?: boolean }).skipped) results.push(`⚠ WhatsApp to ${phone}: env vars not set, skipped`);
        else results.push(`✓ WhatsApp sent to ${phone}`);
      } catch (err) {
        results.push(`✗ WhatsApp to ${phone} failed: ${String(err)}`);
      }
    }
    if (resolvedPhones.length === 0) results.push('✗ WhatsApp: no valid numbers');
  }

  // Log the test
  await supabase.from('notification_logs').insert({
    rule_id:    rule.id,
    rule_name:  `[TEST] ${rule.name}`,
    trigger:    rule.trigger,
    channel:    rule.channel,
    recipients: [...(rule.recipients ?? []), ...(rule.whatsapp_numbers ?? [])],
    status:     results.every((r) => r.startsWith('✓') || r.startsWith('⚠')) ? 'sent' : 'failed',
    error:      results.filter((r) => r.startsWith('✗')).join('; ') || null,
  });

  return NextResponse.json({ results });
}
