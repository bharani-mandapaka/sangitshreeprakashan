import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Create Account', template: '%s | Sangit Shree Prakashan' },
  description: 'Create a Sangit Shree Prakashan account to save your wishlist and track orders.',
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
