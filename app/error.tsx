'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { reportClientError } from '@/lib/report-client-error';

// Shown inside the normal site layout when something on a page crashes, instead of
// Next's bare default error page. The crash is also reported to Admin -> System.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-24">
      <div className="max-w-md text-center">
        <p className="font-cinzel text-gold text-xs uppercase tracking-widest mb-3">Something went wrong</p>
        <h1 className="font-cinzel text-cream text-2xl font-bold mb-3">We couldn’t load this page</h1>
        <p className="text-cream/60 text-sm mb-8">
          It’s on our side, and we’ve been told about it. Please try again, or go back to the shop.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Try again
          </button>
          <Link
            href="/books"
            className="border border-gold/30 hover:border-gold text-cream hover:text-gold font-cinzel px-6 py-3 rounded-xl transition-all"
          >
            Browse books
          </Link>
        </div>
      </div>
    </div>
  );
}
