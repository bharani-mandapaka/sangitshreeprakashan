import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Set New Password', template: '%s | Sangit Shree Prakashan' },
  description: 'Set a new password for your Sangit Shree Prakashan account.',
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
