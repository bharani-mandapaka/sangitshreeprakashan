'use client';

import { usePathname } from 'next/navigation';
import { LazyMotion, domAnimation } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import CartDrawer from '@/components/CartDrawer';
import AuthListener from '@/components/AuthListener';
import AnalyticsTracker from '@/components/AnalyticsTracker';

/**
 * Renders the public-facing site chrome (Navbar, Footer, WhatsApp button, Cart drawer)
 * only on non-admin routes. Admin pages have their own shell in app/admin/layout.tsx.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin  = pathname.startsWith('/admin');

  // The site's animations are all the basics (fade, slide, hover, tap, in-view, exit), so it
  // uses framer-motion's smaller `m` components with `domAnimation` instead of the full
  // `motion` ones (drag and layout animations, which nothing here uses). `strict` makes any
  // future use of a full `motion.*` component fail loudly instead of quietly re-adding the weight.
  return (
    <LazyMotion features={domAnimation} strict>
      <AuthListener />
      <AnalyticsTracker />
      {!isAdmin && <Navbar />}
      {children}
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppButton />}
      {!isAdmin && <CartDrawer />}
    </LazyMotion>
  );
}
