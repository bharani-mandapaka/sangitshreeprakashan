import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a Sangit Shree Prakashan account to save your wishlist and track orders.',
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
