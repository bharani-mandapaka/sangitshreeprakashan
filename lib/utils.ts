import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateOrderId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SSP-';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ── Contact Details ────────────────────────────────────────────────────────────
export const CONTACT = {
  address:    'Shop No. 116, Nagar Nigam Market, Vikas Nagar, Gurudev Zoo Rd., In front of: Manorma Marriage Palace, Kanpur – 208002, Uttar Pradesh, India',
  addressShort: 'Kanpur – 208002, Uttar Pradesh, India',
  phone1:     '+91 740-845-2828',
  phone2:     '+91 933-611-2507',
  phone1Raw:  '+917408452828',
  phone2Raw:  '+919336112507',
  email1:     'sangitshreeprakashan@gmail.com',
  email2:     'info@sangitshreeprakashan.com',
  website:    'https://sangitshreeprakashan.com',
};

// ── WhatsApp ───────────────────────────────────────────────────────────────────
export const WHATSAPP_NUMBER  = '917408452828';
export const WHATSAPP_MESSAGE = encodeURIComponent(
  'Hello! I visited sangitshreeprakashan.com and would like to enquire about your books.',
);
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;
