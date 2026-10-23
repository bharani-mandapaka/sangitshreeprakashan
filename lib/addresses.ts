import { getSupabase } from './supabase';

// Saved delivery addresses for a signed-in customer (table: saved_addresses, see
// saved-addresses.sql). Row-level security scopes every query to the owner, the
// same way the wishlist works — so these run with the customer's own session.

export const MAX_SAVED_ADDRESSES = 5;

export interface SavedAddress {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  address_line1: string;
  address_city: string;
  address_state: string;
  address_pincode: string;
  is_default: boolean;
  created_at: string;
}

export type NewAddress = Omit<SavedAddress, 'id' | 'created_at' | 'is_default'>;

/** Same place, ignoring case and spacing: used to avoid saving the same address twice. */
export function sameAddress(
  a: { address_line1: string; address_pincode: string },
  b: { address_line1: string; address_pincode: string },
): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  return norm(a.address_line1) === norm(b.address_line1) && a.address_pincode.trim() === b.address_pincode.trim();
}

export async function getSavedAddresses(userId: string): Promise<SavedAddress[]> {
  const { data, error } = await getSupabase()
    .from('saved_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    // Most likely the table hasn't been created yet — the feature simply stays empty.
    console.error('[addresses] fetch error:', error.message);
    return [];
  }
  return (data ?? []) as SavedAddress[];
}

export async function insertAddress(userId: string, address: NewAddress, makeDefault: boolean) {
  const { data, error } = await getSupabase()
    .from('saved_addresses')
    .insert({ ...address, user_id: userId, is_default: makeDefault })
    .select('*')
    .single();
  if (error) console.error('[addresses] save error:', error.message);
  return { address: (data as SavedAddress | null) ?? null, error: error?.message ?? null };
}

export async function deleteAddress(userId: string, id: string) {
  const { error } = await getSupabase().from('saved_addresses').delete().eq('user_id', userId).eq('id', id);
  if (error) console.error('[addresses] delete error:', error.message);
  return { error: error?.message ?? null };
}

/** Makes one address the default (the others are cleared first: only one default is allowed). */
export async function setDefaultAddress(userId: string, id: string) {
  const db = getSupabase();
  const cleared = await db.from('saved_addresses').update({ is_default: false }).eq('user_id', userId).eq('is_default', true);
  if (cleared.error) { console.error('[addresses] default error:', cleared.error.message); return { error: cleared.error.message }; }
  const { error } = await db.from('saved_addresses').update({ is_default: true }).eq('user_id', userId).eq('id', id);
  if (error) console.error('[addresses] default error:', error.message);
  return { error: error?.message ?? null };
}
