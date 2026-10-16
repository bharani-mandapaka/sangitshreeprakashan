'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import CartDrawer from '@/components/CartDrawer';
import AuthListener from '@/components/AuthListener';

/**
 * Renders the public-facing site chrome (Navbar, Footer, WhatsApp button, Cart drawer)
 * only on non-admin routes. Admin pages have their own shell in app/admin/layout.tsx.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin  = pathname.startsWith('/admin');

  return (
    <>
      <AuthListener />
      {!isAdmin && <Navbar />}
      {children}
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppButton />}
      {!isAdmin && <CartDrawer />}
    </>
  );
}
