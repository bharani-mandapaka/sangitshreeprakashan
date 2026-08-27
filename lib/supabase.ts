import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Lazily instantiated so `next build` can import this module (e.g. while
// prerendering the admin pages) without the NEXT_PUBLIC_SUPABASE_* env vars
// being present at build time. The client is created on first use at runtime.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}

// ── Types matching the Supabase schema ─────────────────────────────────────────
export interface DbOrder {
  id: string;
  created_at: string;
  status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_city: string;
  address_state: string;
  address_pincode: string;
  subtotal: number;
  payment_method: string;
  user_id: string | null;
  order_items: DbOrderItem[];
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  book_id: string;
  sku: string;
  title_english: string;
  title_hindi: string;
  qty: number;
  price: number;
}

export interface DbNotificationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  channel: string;
  recipients: string[];
  subject: string;
  body: string;
  whatsapp_numbers: string[];
  whatsapp_message: string;
  active: boolean;
  created_at: string;
}

export interface DbNotificationLog {
  id: string;
  rule_id: string | null;
  rule_name: string;
  trigger: string;
  channel: string;
  recipients: string[];
  status: string;   // 'sent' | 'failed' | 'partial'
  error: string | null;
  sent_at: string;
}
