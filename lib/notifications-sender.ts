/**
 * Server-side notification sender.
 * Reads active rules from Supabase, interpolates templates,
 * sends via Resend (email) and Meta Cloud API (WhatsApp), logs results.
 *
 * Import only in API routes / server code — never in client components.
 */
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
const resend = new Resend(process.env.RESEND_API_KEY);

// ── Template interpolation ─────────────────────────────────────────────────────
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `[${key}]`);
}

// ── WhatsApp send (Meta Cloud API) ─────────────────────────────────────────────
async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token         = process.env.WHATSAPP_TOKEN;

  if (!phoneNumberId || !token) {
    // Silently skip until WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_TOKEN are set in env vars
    return;
  }

  // Strip all non-digits; Meta expects international format without +
  const clean = to.replace(/\D/g, '');

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type:    'individual',
        to:                clean,
        type:              'text',
        text:              { preview_url: false, body },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WhatsApp API ${res.status}: ${text}`);
  }
}

// ── Admin email HTML wrapper ───────────────────────────────────────────────────
function buildAdminEmailHtml(subject: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Georgia,serif;">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
  <div style="background:#040000;padding:20px 24px;">
    <h1 style="margin:0;color:#C9A84C;font-size:14px;letter-spacing:2px;font-weight:normal;">
      SANGIT SHREE PRAKASHAN
    </h1>
    <p style="margin:4px 0 0;color:#ffffff55;font-size:11px;letter-spacing:1px;">ADMIN NOTIFICATION</p>
  </div>
  <div style="padding:28px 24px;">
    <h2 style="margin:0 0 16px;color:#222;font-size:16px;">${subject}</h2>
    <pre style="white-space:pre-wrap;font-family:monospace;font-size:13px;line-height:1.8;color:#444;margin:0;background:#f9f9f9;padding:16px;border-radius:6px;border-left:3px solid #C9A84C;">${body}</pre>
  </div>
  <div style="background:#f5f5f5;padding:12px 24px;border-top:1px solid #e0e0e0;">
    <p style="margin:0;color:#999;font-size:11px;">
      Sangit Shree Prakashan · Kanpur, UP · sangitshreeprakashan.com
    </p>
  </div>
</div>
</body>
</html>`;
}

// ── Main export ────────────────────────────────────────────────────────────────
export async function fireNotifications(
  trigger: string,
  vars: Record<string, string>,
): Promise<{ sent: number; failed: number; partial: number }> {

  const { data: rules, error } = await supabase
    .from('notification_rules')
    .select('*')
    .eq('trigger', trigger)
    .eq('active', true);

  if (error || !rules?.length) return { sent: 0, failed: 0, partial: 0 };

  let sent = 0, failed = 0, partial = 0;

  for (const rule of rules) {
    let emailError: string | undefined;
    let waError:    string | undefined;

    // ── Email ──────────────────────────────────────────────────────────────────
    if (
      (rule.channel === 'email' || rule.channel === 'both') &&
      (rule.recipients as string[])?.length > 0
    ) {
      try {
        const subject = interpolate(rule.subject, vars);
        const body    = interpolate(rule.body,    vars);
        // Resolve dynamic placeholders e.g. {{customer_email}}, then drop any
        // that remain unresolved (shown as [key] after interpolation).
        const resolvedTo = (rule.recipients as string[])
          .map((r) => interpolate(r, vars))
          .filter((r) => r && !r.includes('[') && r.includes('@'));
        for (const to of resolvedTo) {
          await resend.emails.send({
            from:    'Sangit Shree Prakashan <orders@sangitshreeprakashan.com>',
            to,
            subject,
            html:    buildAdminEmailHtml(subject, body),
          });
        }
      } catch (err) {
        emailError = String(err);
        console.error(`[notifications] email failed for rule ${rule.id}:`, err);
      }
    }

    // ── WhatsApp ───────────────────────────────────────────────────────────────
    if (
      (rule.channel === 'whatsapp' || rule.channel === 'both') &&
      (rule.whatsapp_numbers as string[])?.length > 0
    ) {
      try {
        const message = interpolate(rule.whatsapp_message, vars);
        // Resolve dynamic placeholders e.g. {{customer_phone}}, drop unresolved.
        const resolvedPhones = (rule.whatsapp_numbers as string[])
          .map((p) => interpolate(p, vars))
          .filter((p) => p && !p.includes('['));
        for (const phone of resolvedPhones) {
          await sendWhatsAppMessage(phone, message);
        }
      } catch (err) {
        waError = String(err);
        console.error(`[notifications] whatsapp failed for rule ${rule.id}:`, err);
      }
    }

    // ── Determine overall status ───────────────────────────────────────────────
    const hasEmail = rule.channel === 'email'    || rule.channel === 'both';
    const hasWA    = rule.channel === 'whatsapp' || rule.channel === 'both';
    const emailFailed = hasEmail && !!emailError;
    const waFailed    = hasWA    && !!waError;

    let status: 'sent' | 'failed' | 'partial';
    if (!emailFailed && !waFailed)                        status = 'sent';
    else if (emailFailed && (!hasWA || waFailed))         status = 'failed';
    else                                                  status = 'partial';

    if (status === 'sent')         sent++;
    else if (status === 'failed')  failed++;
    else                           partial++;

    // ── Log ───────────────────────────────────────────────────────────────────
    await supabase.from('notification_logs').insert({
      rule_id:    rule.id,
      rule_name:  rule.name,
      trigger,
      channel:    rule.channel,
      recipients: [
        ...((rule.recipients       as string[]) ?? []),
        ...((rule.whatsapp_numbers as string[]) ?? []),
      ],
      status,
      error: [emailError, waError].filter(Boolean).join(' | ') || null,
    });
  }

  return { sent, failed, partial };
}
