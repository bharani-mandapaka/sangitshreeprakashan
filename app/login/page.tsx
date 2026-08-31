'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PhoneAuthForm from '@/components/PhoneAuthForm';

function LoginPageContent() {
  const searchParams = useSearchParams();
  // Where to send the user after a successful sign-in — e.g. the book detail
  // page they clicked the wishlist heart from, via /login?next=/books/foo.
  // Falls back to the profile page for a plain, direct visit to /login.
  const next = searchParams.get('next') || '/profile';
  return <PhoneAuthForm mode="login" next={next} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark pt-20 lg:pt-24" />}>
      <LoginPageContent />
    </Suspense>
  );
}
