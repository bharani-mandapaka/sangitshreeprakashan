import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'All Books',
    template: '%s | Sangit Shree Prakashan',
  },
  description:
    'Browse our complete collection of 30+ Hindustani Classical Music books — instrumental, vocal, raag theory, kathak, CBSE and research titles.',
  openGraph: {
    title: 'All Books | Sangit Shree Prakashan',
    description: 'Browse 30+ Hindustani Classical Music books across all categories.',
    type: 'website',
  },
};

export default function BooksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}