import type { Metadata } from 'next';
import { Cinzel, Inter, Noto_Serif_Devanagari } from 'next/font/google';
import './globals.css';
import SiteShell from '@/components/SiteShell';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-cinzel',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const devanagari = Noto_Serif_Devanagari({
  subsets: ['devanagari'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-devanagari',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Sangit Shree Prakashan | Hindustani Classical Music Books',
    template: '%s | Sangit Shree Prakashan',
  },
  description:
    'Publisher and distributor of Hindustani Classical Music books. Kanpur, Uttar Pradesh, India. Specialising in Swar Vadan, Bhatkhande Notation, Raag Theory, Kathak and more.',
  keywords: [
    'Hindustani classical music books',
    'sangit books',
    'swar vadan',
    'bhatkhande notation',
    'raag theory',
    'kathak books',
    'music publisher India',
    'sangit prakashan',
  ],
  openGraph: {
    title: 'Sangit Shree Prakashan',
    description: 'Publisher of Hindustani Classical Music Books, Kanpur, India',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${inter.variable} ${devanagari.variable}`}>
      <body className="bg-dark text-cream antialiased">
        <SiteShell>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
