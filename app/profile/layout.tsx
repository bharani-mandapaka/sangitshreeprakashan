import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Your Sangit Shree Prakashan account — wishlist and order history.',
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
