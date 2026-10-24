'use client';

// Sends an anonymous analytics event to /api/track. Fire-and-forget: never throws and never
// waits, so tracking can't slow down or break anything the customer is doing.
// Nothing is stored in the browser (no cookie, no local storage); see lib/analytics-server.ts.

export function trackEvent(type: 'page_view' | 'add_to_cart' | 'checkout_start', data: { path?: string; bookSlug?: string } = {}) {
  try {
    if (typeof window === 'undefined') return;
    const body = JSON.stringify({ type, path: data.path ?? window.location.pathname, bookSlug: data.bookSlug });
    // sendBeacon survives the page closing; fall back to fetch if it's unavailable or refuses.
    if (navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))) return;
    void fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch {
    /* ignore */
  }
}
