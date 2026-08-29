import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Reset Password', template: '%s | Sangit Shree Prakashan' },
  description: 'Reset your Sangit Shree Prakashan account password.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
