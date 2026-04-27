import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationTrigger =
  | 'order_placed'
  | 'daily_digest'
  | 'weekly_digest'
  | 'cart_abandoned';

export interface NotificationRule {
  id: string;
  name: string;
  description: string;    // original natural-language input
  trigger: NotificationTrigger;
  recipients: string[];
  subject: string;
  body: string;
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

// ── Template generators ────────────────────────────────────────────────────────
export const TEMPLATES: Record<NotificationTrigger, { subject: string; body: string }> = {
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
Sangit Shree Prakashan Notification System`,
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

// ── NLP parser ────────────────────────────────────────────────────────────────
export function parseDescription(desc: string): {
  trigger: NotificationTrigger;
  name: string;
  subject: string;
  body: string;
  detectedEmails: string[];
} {
  const lower = desc.toLowerCase();

  // Extract emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const detectedEmails = desc.match(emailRegex) ?? [];

  // Detect trigger
  let trigger: NotificationTrigger = 'order_placed';
  if (lower.includes('weekly'))         trigger = 'weekly_digest';
  else if (lower.includes('daily'))     trigger = 'daily_digest';
  else if (lower.includes('abandon') || lower.includes('cart'))
                                        trigger = 'cart_abandoned';
  else if (lower.includes('order'))     trigger = 'order_placed';

  const triggerLabels: Record<NotificationTrigger, string> = {
    order_placed:   'Order Placed',
    daily_digest:   'Daily Digest',
    weekly_digest:  'Weekly Digest',
    cart_abandoned: 'Abandoned Cart',
  };

  const name = `${triggerLabels[trigger]} Notification`;
  const { subject, body } = TEMPLATES[trigger];

  return { trigger, name, subject, body, detectedEmails };
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
