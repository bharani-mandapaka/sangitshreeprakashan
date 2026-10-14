-- ============================================================
-- Returns: run ONCE in the Supabase SQL Editor on the live database
-- (Dashboard -> SQL Editor -> New query). Safe to re-run.
-- Adds the "returned" order status, the returned_at timestamp, the
-- "order_returned" notification trigger and the customer notification rule.
-- Run this BEFORE anyone marks an order "Returned" in the admin panel.
-- ============================================================

alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending','confirmed','shipped','delivered','returned','cancelled'));

alter table orders add column if not exists returned_at timestamptz;

alter table notification_rules drop constraint if exists notification_rules_trigger_check;
alter table notification_rules add constraint notification_rules_trigger_check
  check (trigger in ('order_placed','order_shipped','order_delivered','order_returned','daily_digest','weekly_digest','cart_abandoned'));

insert into notification_rules (id, name, description, trigger, channel, recipients, subject, body, whatsapp_numbers, whatsapp_message, active, audience)
values (
  'order-returned-customer',
  'Returned Book Received (Customer)',
  'Sent to the customer when an admin marks their returned order as received.',
  'order_returned',
  'both',
  array['{{customer_email}}'],
  'We''ve Received Your Returned Book — {{order_id}} | Sangit Shree Prakashan',
  E'Dear {{customer_name}},\n\nWe have received the book(s) you returned for order {{order_id}} on {{returned_at}}.\n\nReturned\n--------\n{{items_list}}\n\nOur team will check them and get in touch shortly about your replacement or refund, as set out in our Shipping, Cancellation & Returns policy. If you have any questions, please reach us at {{support_email}} or {{support_phone}}.\n\nThank you for your patience.\n\nWarm regards,\nSangit Shree Prakashan',
  array['{{customer_phone}}'],
  E'*We''ve received your returned book* 📦\n\n*Order ID:* {{order_id}}\nReceived on {{returned_at}}.\n\nWe''ll check it and contact you shortly about your replacement or refund.\n\nNeed help? Write to us at {{support_email}} or call {{support_phone}}.',
  true,
  'customer'
)
on conflict (id) do nothing;
