import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with Sangit Shree Prakashan, Kanpur. Shop No. 116, Nagar Nigam Market, Vikas Nagar. Call, email or WhatsApp us for book enquiries and bulk orders.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}