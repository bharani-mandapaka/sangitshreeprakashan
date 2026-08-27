'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu, X, Search, User } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';

const navLinks = [
  { href: '/',        label: 'Home' },
  { href: '/books',   label: 'Books' },
  { href: '/about',   label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const itemCount  = useCartStore((s) => s.itemCount);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const user       = useAuthStore((s) => s.user);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

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
                  className="object-contain drop-shadow-[0_0_6px_rgba(201,162,39,0.5)]"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <p className="font-cinzel text-gold font-bold text-sm lg:text-base leading-tight">
                  Sangit Shree Prakashan
                </p>
                <p className="font-devanagari text-cream/50 text-[10px] leading-tight">
                  संगीत श्री प्रकाशन
                </p>
              </div>
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-cinzel text-sm text-cream/80 hover:text-gold transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/books"
                className="hidden md:flex items-center gap-1.5 text-cream/60 hover:text-gold transition-colors"
                title="Search books"
              >
                <Search size={18} />
              </Link>

              <Link
                href={user ? '/profile' : '/login'}
                className="p-2 text-cream/80 hover:text-gold transition-colors"
                title={user ? 'My Profile' : 'Sign In'}
              >
                <User size={20} />
              </Link>

              <button
                onClick={toggleCart}
                className="relative p-2 text-cream/80 hover:text-gold transition-colors"
                title="Cart"
              >
                <ShoppingCart size={20} />
                {itemCount() > 0 && (
                  <motion.span
                    key={itemCount()}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-gold text-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  >
                    {itemCount() > 9 ? '9+' : itemCount()}
                  </motion.span>
                )}
              </button>

              <button
                className="md:hidden p-2 text-cream/80 hover:text-gold transition-colors"
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
                <User size={16} /> {user ? 'My Profile' : 'Sign In'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
