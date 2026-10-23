'use client';

/** Tells the server a page crashed in this browser (see app/api/client-error/route.ts). Never throws. */
export function reportClientError(error: Error & { digest?: string }) {
  try {
    void fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message || error.name || 'Unknown error',
        digest: error.digest,
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* reporting must never cause a second crash */
  }
}
