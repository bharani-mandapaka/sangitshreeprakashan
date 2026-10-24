'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/track';

/**
 * Records one anonymous page view each time the customer opens a page on the public site
 * (not admin pages). Renders nothing. See lib/analytics-server.ts for what is and isn't stored.
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && !pathname.startsWith('/admin')) trackEvent('page_view', { path: pathname });
  }, [pathname]);

  return null;
}
