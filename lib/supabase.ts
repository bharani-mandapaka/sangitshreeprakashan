import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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
