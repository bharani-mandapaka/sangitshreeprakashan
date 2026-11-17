'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, Search, User } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';

const navLinks = [
  { href: '/',        label: 'Home' },
  { href: '/books',   label: 'Books' },
  { href: '/about',   label: 'About' },
  { href: '/contact', label: 'Contact' },
];

// Round dark glass button with a thin gold ring: the icon stays visible over a bright photo.
const iconBtn =
  'w-10 h-10 items-center justify-center flex rounded-full bg-dark/65 backdrop-blur-md border border-gold/50 text-white hover:text-gold hover:border-gold transition-colors';

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Cart persists to localStorage, which doesn't exist on the server — the
  // server always renders an empty cart, but the client rehydrates from
  // localStorage right away and may have items already. Rendering the badge
  // before we know we're past hydration causes a server/client mismatch
  // ("Hydration failed") whenever a returning visitor already has items in
  // their cart. Gating it behind a mounted flag (false until this effect
  // runs, which only happens post-hydration) keeps the first client render
  // identical to the server's, then lets the real count show a tick later.
  const [mounted, setMounted] = useState(false);
  // Selecting the itemCount getter itself (a stable function reference) means
  // Zustand never sees a changed value and never re-renders this component
  // when the cart is mutated elsewhere (e.g. a book card's "Add" button) —
  // selecting the derived number instead makes that state change visible.
  const itemCount  = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const toggleCart = useCartStore((s) => s.toggleCart);
  const user       = useAuthStore((s) => s.user);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMounted(true); }, []);

  const pathname = usePathname();
  const hideName = pathname === '/' && !scrolled;

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-dark/95 backdrop-blur-md border-b border-gold/10 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 transition-transform group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Sangit Shree Prakashan Logo"
                  fill
                  sizes="48px"
                  className="object-contain drop-shadow-[0_0_6px_rgba(201,162,39,0.5)]"
                  priority
                />
              </div>
              {/* On the home page the banner already shows the name, so this stays hidden until the
                  visitor scrolls past it. Hidden with opacity, not removed, so the links don't shift. */}
              <div
                className={`hidden sm:block transition-opacity duration-500 ${hideName ? 'opacity-0' : 'opacity-100'}`}
                aria-hidden={hideName}
              >
                <p className="font-cinzel text-gold font-black text-sm lg:text-base leading-tight">
                  Sangit Shree Prakashan
                </p>
                <p className="font-devanagari text-cream/50 text-[10px] leading-tight">
                  संगीत श्री प्रकाशन
                </p>
              </div>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`font-cinzel text-[12px] font-normal uppercase tracking-[0.16em] relative group [text-shadow:0_1px_4px_rgba(0,0,0,0.9)] transition-colors hover:text-gold ${
                      active ? 'text-gold' : 'text-white'
                    }`}
                  >
                    {link.label}
                    <span className={`absolute -bottom-1.5 left-0 h-0.5 bg-gold transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                  </Link>
                );
              })}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/books"
                className={`hidden md:flex ${iconBtn}`}
                title="Search books"
                aria-label="Search books"
              >
                <Search size={18} strokeWidth={2.2} />
              </Link>

              <Link
                href={user ? '/profile' : '/login'}
                className={iconBtn}
                title={user ? 'My Profile' : 'Login'}
                aria-label={user ? 'My Profile' : 'Login'}
              >
                <User size={18} strokeWidth={2.2} />
              </Link>

              <button
                onClick={toggleCart}
                className={`relative ${iconBtn}`}
                title="Cart"
                aria-label="Cart"
              >
                <ShoppingCart size={18} strokeWidth={2.2} />
                {mounted && itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-gold text-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
              </button>

              <button
                className={`md:hidden ${iconBtn}`}
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 bg-dark/98 backdrop-blur-xl border-b border-gold/10 md:hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-cinzel text-lg text-cream/80 hover:text-gold transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="divider-gold" />
              <Link
                href="/books"
                className="flex items-center gap-2 text-cream/60 hover:text-gold transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <Search size={16} /> Search Books
              </Link>
              <Link
                href={user ? '/profile' : '/login'}
                className="flex items-center gap-2 text-cream/60 hover:text-gold transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <User size={16} /> {user ? 'My Profile' : 'Login'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
