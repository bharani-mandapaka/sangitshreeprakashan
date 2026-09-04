import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationTrigger =
  | 'order_placed'
  | 'order_shipped'
  | 'order_delivered'
  | 'daily_digest'
  | 'weekly_digest'
  | 'cart_abandoned';

export type NotificationChannel = 'email' | 'whatsapp' | 'both';

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  // Email
  recipients: string[];
  subject: string;
  body: string;
  // WhatsApp
  whatsappNumbers: string[];
  whatsappMessage: string;
  active: boolean;
  createdAt: string;
}

interface NotificationsStore {
  rules: NotificationRule[];
  addRule:    (rule: NotificationRule) => void;
  updateRule: (id: string, patch: Partial<NotificationRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
}

// ── Email templates ────────────────────────────────────────────────────────────
export const EMAIL_TEMPLATES: Record<NotificationTrigger, { subject: string; body: string }> = {
  order_placed: {
    subject: 'New Order Received: {{order_id}}',
    body: `Dear Admin,

A new order has been placed on Sangit Shree Prakashan.

ORDER DETAILS
-------------
Order ID    : {{order_id}}
Date        : {{order_date}}
Customer    : {{customer_name}}
Email       : {{customer_email}}
Phone       : {{customer_phone}}

ITEMS ORDERED
-------------
{{items_list}}

SHIPPING ADDRESS
----------------
{{shipping_address}}

ORDER TOTAL : {{order_total}}
Payment     : {{payment_method}}

Please log in to the admin panel to update the order status.

Regards,
Sangit Shree Prakashan`,
  },
  order_shipped: {
    subject: 'Order Shipped: {{order_id}}',
    body: `Dear Admin,

An order has been marked as shipped on Sangit Shree Prakashan.

ORDER DETAILS
-------------
Order ID        : {{order_id}}
Customer        : {{customer_name}}
Tracking ID     : {{tracking_id}}
Courier         : {{courier_service}}

Regards,
Sangit Shree Prakashan`,
  },
  order_delivered: {
    subject: 'Order Delivered: {{order_id}}',
    body: `Dear Admin,

An order has been marked as delivered on Sangit Shree Prakashan.

ORDER DETAILS
-------------
Order ID        : {{order_id}}
Customer        : {{customer_name}}
Delivered At    : {{delivered_at}}

Regards,
Sangit Shree Prakashan`,
  },
  daily_digest: {
    subject: 'Daily Sales Digest - {{date}}',
    body: `Good morning,

Here is your daily summary for {{date}}.

SUMMARY
-------
New Orders     : {{orders_count}}
Revenue        : {{revenue}}
Unique Visitors: {{visitors}}
Cart Adds      : {{cart_adds}}

TOP BOOK TODAY : {{top_book}}

View full report at your admin dashboard.

Regards,
Sangit Shree Prakashan`,
  },
  weekly_digest: {
    subject: 'Weekly Report - Week of {{week_start}}',
    body: `Hello,

Here is your weekly performance summary.

WEEK OF {{week_start}} to {{week_end}}
--------------------------------------
Total Orders   : {{orders_count}}
Total Revenue  : {{revenue}}
New Visitors   : {{visitors}}
Top Book       : {{top_book}}
Returning Rate : {{returning_rate}}%

View full analytics at your admin dashboard.

Regards,
Sangit Shree Prakashan`,
  },
  cart_abandoned: {
    subject: 'Abandoned Cart Alert',
    body: `Hi Admin,

A visitor added items to their cart but did not complete the purchase.

CART DETAILS
------------
Items        : {{cart_items}}
Total Value  : {{cart_total}}
Time         : {{abandoned_at}}

Consider following up if contact info is available.

Regards,
Sangit Shree Prakashan`,
  },
};

// ── WhatsApp templates (uses *bold* and _italic_ markdown) ─────────────────────
export const WHATSAPP_TEMPLATES: Record<NotificationTrigger, string> = {
  order_placed: `*New Order Alert* 🛒
*Order ID:* {{order_id}}
*Date:* {{order_date}}

*Customer:* {{customer_name}}
*Phone:* {{customer_phone}}
*Email:* {{customer_email}}

*Items Ordered:*
{{items_list}}

*Ship To:*
{{shipping_address}}

*Total:* {{order_total}}
*Payment:* {{payment_method}}

View order: https://sangit-shree-prakashan.vercel.app/admin/orders`,

  order_shipped: `*Order Shipped* 📦
*Order ID:* {{order_id}}
*Customer:* {{customer_name}}
*Tracking ID:* {{tracking_id}}
*Courier:* {{courier_service}}

View order: https://sangit-shree-prakashan.vercel.app/admin/orders`,

  order_delivered: `*Order Delivered* ✅
*Order ID:* {{order_id}}
*Customer:* {{customer_name}}
*Delivered At:* {{delivered_at}}

View order: https://sangit-shree-prakashan.vercel.app/admin/orders`,

  daily_digest: `*Daily Sales Report - {{date}}*

*Orders:* {{orders_count}}
*Revenue:* {{revenue}}
*Visitors:* {{visitors}}
*Cart Adds:* {{cart_adds}}

*Top Book:* {{top_book}}

View full report: https://sangit-shree-prakashan.vercel.app/admin`,

  weekly_digest: `*Weekly Summary*
_Week of {{week_start}} to {{week_end}}_

*Total Orders:* {{orders_count}}
*Total Revenue:* {{revenue}}
*New Visitors:* {{visitors}}
*Top Book:* {{top_book}}
*Returning Rate:* {{returning_rate}}%

View analytics: https://sangit-shree-prakashan.vercel.app/admin`,

  cart_abandoned: `*Abandoned Cart Alert*

*Items:* {{cart_items}}
*Value:* {{cart_total}}
*Time:* {{abandoned_at}}

A visitor left without completing their purchase.`,
};

// ── NLP parser ────────────────────────────────────────────────────────────────
export function parseDescription(desc: string): {
  trigger:          NotificationTrigger;
  channel:          NotificationChannel;
  name:             string;
  subject:          string;
  body:             string;
  whatsappMessage:  string;
  detectedEmails:   string[];
  detectedPhones:   string[];
} {
  const lower = desc.toLowerCase();

  // Extract emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const detectedEmails = desc.match(emailRegex) ?? [];

  // Extract phone numbers (Indian format: +91XXXXXXXXXX or 10-digit)
  const phoneRegex = /(?:\+91[-\s]?)?[6-9]\d{9}/g;
  const detectedPhones = (desc.match(phoneRegex) ?? []).map((p) => p.replace(/\s/g, ''));

  // Detect trigger
  let trigger: NotificationTrigger = 'order_placed';
  if (lower.includes('weekly'))                             trigger = 'weekly_digest';
  else if (lower.includes('daily'))                        trigger = 'daily_digest';
  else if (lower.includes('abandon') || (lower.includes('cart') && !lower.includes('order')))
                                                           trigger = 'cart_abandoned';
  else if (lower.includes('deliver'))                      trigger = 'order_delivered';
  else if (lower.includes('ship') || lower.includes('dispatch')) trigger = 'order_shipped';
  else if (lower.includes('order'))                        trigger = 'order_placed';

  // Detect channel
  const wantsWhatsapp = lower.includes('whatsapp') || lower.includes('whats app') || lower.includes('wa ') || lower.includes('wa.');
  const wantsEmail    = lower.includes('email') || lower.includes('mail') || detectedEmails.length > 0;
  let channel: NotificationChannel = 'email';
  if (wantsWhatsapp && wantsEmail) channel = 'both';
  else if (wantsWhatsapp)          channel = 'whatsapp';

  const triggerLabels: Record<NotificationTrigger, string> = {
    order_placed:    'Order Placed',
    order_shipped:   'Order Shipped',
    order_delivered: 'Order Delivered',
    daily_digest:    'Daily Digest',
    weekly_digest:   'Weekly Digest',
    cart_abandoned:  'Abandoned Cart',
  };
  const channelLabels: Record<NotificationChannel, string> = {
    email:     'Email',
    whatsapp:  'WhatsApp',
    both:      'Email + WhatsApp',
  };

  const name            = `${triggerLabels[trigger]} (${channelLabels[channel]})`;
  const { subject, body } = EMAIL_TEMPLATES[trigger];
  const whatsappMessage   = WHATSAPP_TEMPLATES[trigger];

  return { trigger, channel, name, subject, body, whatsappMessage, detectedEmails, detectedPhones };
}

export const useNotificationsStore = create<NotificationsStore>()(
  persist(
    (set) => ({
      rules: [],
      addRule: (rule) =>
        set((s) => ({ rules: [...s.rules, rule] })),
      updateRule: (id, patch) =>
        set((s) => ({
          rules: s.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteRule: (id) =>
        set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),
      toggleRule: (id) =>
        set((s) => ({
          rules: s.rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
        })),
    }),
    { name: 'ssp-notifications' }
  )
);
