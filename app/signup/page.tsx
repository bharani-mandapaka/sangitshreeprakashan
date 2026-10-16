'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PhoneAuthForm from '@/components/PhoneAuthForm';

function SignupPageContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/profile';
  return <PhoneAuthForm mode="signup" next={next} />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark pt-20 lg:pt-24" />}>
      <SignupPageContent />
    </Suspense>
  );
}
