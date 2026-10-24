'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/report-client-error';

// Last resort: only used when the root layout itself crashes, so it can't rely on the
// site's styles or components and brings its own <html> and <body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#040000', color: '#f5efe0', fontFamily: 'Georgia, serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, textAlign: 'center' }}>
          <div style={{ maxWidth: 420 }}>
            <p style={{ color: '#C9A84C', letterSpacing: 2, fontSize: 12, textTransform: 'uppercase' }}>Something went wrong</p>
            <h1 style={{ fontSize: 24 }}>We couldn’t load the site</h1>
            <p style={{ opacity: 0.6, fontSize: 14 }}>It’s on our side, and we’ve been told about it. Please try again in a moment.</p>
            <button
              onClick={reset}
              style={{ marginTop: 16, background: '#C9A84C', color: '#040000', border: 0, borderRadius: 12, padding: '12px 24px', fontWeight: 700, cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
