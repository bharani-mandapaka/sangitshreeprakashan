import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Login', template: '%s | Sangit Shree Prakashan' },
  description: 'Login to your Sangit Shree Prakashan account.',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
