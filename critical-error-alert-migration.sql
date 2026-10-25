-- ============================================================
-- Critical-error alerts: run ONCE in the Supabase SQL Editor on the live database
-- (Dashboard -> SQL Editor -> New query). Safe to re-run.
-- Lets the site WhatsApp / email the admin when something critical happens, such as a
-- customer who paid but whose order wasn't saved.
--   1. allows the new notification trigger "critical_error"
--   2. adds a ready-made rule for it, SWITCHED OFF and with NO recipients, so nothing is
--      sent until you open Admin -> Notifications, add the people (and WhatsApp numbers)
--      to "Critical Error Alert (Admin)" and switch it on.
-- The site works without this: critical errors are still listed in Admin -> System.
-- ============================================================

alter table notification_rules drop constraint if exists notification_rules_trigger_check;
alter table notification_rules add constraint notification_rules_trigger_check
  check (trigger in ('order_placed','order_shipped','order_delivered','order_returned','daily_digest','weekly_digest','cart_abandoned','critical_error'));

insert into notification_rules (id, name, description, trigger, channel, recipients, subject, body, whatsapp_numbers, whatsapp_message, active, audience)
values (
  'critical-error-admin',
  'Critical Error Alert (Admin)',
  'Sent to the admin when a critical error is logged (for example a customer paid but the order was not saved). Add recipients, then switch on.',
  'critical_error',
  'both',
  array[]::text[],
  'URGENT: {{source}} problem on Sangit Shree Prakashan',
  E'Dear Admin,\n\nSomething needs your attention on the website.\n\nWHAT HAPPENED\n-------------\n{{message}}\n\nWhere : {{source}}\nWhen  : {{time}}\n\nDETAILS (who to help, what to check)\n------------------------------------\n{{details}}\n\nOpen Admin > System to see it and mark it resolved:\nhttps://sangit-shree-prakashan.vercel.app/admin/system\n\nRegards,\nSangit Shree Prakashan',
  array[]::text[],
  E'*⚠ Needs attention*\n{{message}}\n\n*Where:* {{source}}\n*When:* {{time}}\n\n{{details}}\n\nOpen: https://sangit-shree-prakashan.vercel.app/admin/system',
  false,
  'admin'
)
on conflict (id) do nothing;
