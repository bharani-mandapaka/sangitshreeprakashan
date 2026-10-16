/**
 * WhatsApp OTP delivery via Meta Cloud API.
 *
 * OTP codes are business-initiated messages sent to a customer who hasn't
 * necessarily messaged first, so they fall outside WhatsApp's 24-hour
 * customer-service window — Meta requires these to go through a pre-approved
 * message template (type: "template"), not the free-form "text" messages
 * lib/notifications-sender.ts sends for order updates. Meta has a dedicated
 * "Authentication" template category built for exactly this, which (when
 * created via their guided template flow) ships with a "Copy code" button
 * component — hence the extra `button` block below, alongside the required
 * `body` block that carries the code itself.
 *
 * The template must be created and approved in Meta's WhatsApp Manager
 * before this will work; its name/language must match
 * WHATSAPP_OTP_TEMPLATE_NAME / WHATSAPP_OTP_TEMPLATE_LANG exactly. If your
 * approved template has no button component, set
 * WHATSAPP_OTP_TEMPLATE_HAS_BUTTON=false.
 */

const DEFAULT_TEMPLATE_NAME = 'otp_login';
const DEFAULT_LANGUAGE_CODE = 'en';

export function isWhatsAppOtpConfigured(): boolean {
  return !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TOKEN);
}

export async function sendWhatsAppOtp(phone: string, otp: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || DEFAULT_TEMPLATE_NAME;
  const languageCode = process.env.WHATSAPP_OTP_TEMPLATE_LANG || DEFAULT_LANGUAGE_CODE;
  const hasButton = process.env.WHATSAPP_OTP_TEMPLATE_HAS_BUTTON !== 'false';

  if (!phoneNumberId || !token) {
    throw new Error('WhatsApp is not configured (WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_TOKEN missing).');
  }

  // Strip all non-digits; Meta expects international format without "+".
  const clean = phone.replace(/\D/g, '');

  const components: Record<string, unknown>[] = [
    { type: 'body', parameters: [{ type: 'text', text: otp }] },
  ];
  if (hasButton) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: otp }],
    });
  }

  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: clean,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WhatsApp OTP send failed (${res.status}): ${text}`);
  }
}
