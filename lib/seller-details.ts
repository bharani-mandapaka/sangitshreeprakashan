import { CONTACT } from '@/lib/utils';

// Letterhead details for the admin "Print Invoice" (Bill of Supply) feature —
// see app/admin/orders/[id]/invoice/page.tsx. Deliberately reuses the same
// CONTACT constant already used site-wide (footer, contact page, WhatsApp
// link) rather than re-typing the address/phone here, so there's one source
// of truth and no risk of the invoice drifting out of sync with the rest of
// the site.
export const SELLER = {
  name:    'Sangit Shree Prakashan',
  address: CONTACT.address,
  phone:   CONTACT.phone1,
};
