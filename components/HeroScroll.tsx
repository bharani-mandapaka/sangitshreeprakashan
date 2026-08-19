'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingBag, MessageCircle } from 'lucide-react';
import { WHATSAPP_URL } from '@/lib/utils';

export default function HeroScroll() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-dark flex items-center justify-center py-24">

      {/* Radial background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_rgba(139,0,0,0.35)_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_50%,_rgba(201,162,39,0.08)_0%,_transparent_70%)]" />
      </div>

      {/* Decorative rings (static) */}
      <div className="absolute w-[600px] h-[600px] rounded-full border border-gold/5 pointer-events-none" />
      <div className="absolute w-[420px] h-[420px] rounded-full border border-gold/8 pointer-events-none" />
      <div className="absolute w-[260px] h-[260px] rounded-full border border-gold/10 pointer-events-none" />

      {/* Content — fades/slides in once on mount, no scroll-linked animation */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center px-4 gap-6"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="logo-shimmer-wrap w-36 h-36 sm:w-44 sm:h-44 lg:w-52 lg:h-52"
        >
          <Image
            src="/logo.png"
            alt="Sangit Shree Prakashan"
            width={208}
            height={208}
            className="object-contain w-full h-full drop-shadow-2xl"
            priority
          />
        </motion.div>

        {/* Brand name */}
        <h1 className="font-cinzel text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-wide">
          <span className="text-gold-gradient">Sangit Shree</span>
          <br />
          <span className="text-cream">Prakashan</span>
        </h1>

        {/* Hindi tagline */}
        <p className="font-devanagari text-gold/80 text-lg sm:text-xl">
          संगीत श्री प्रकाशन
        </p>

        {/* Subtitle */}
        <p className="text-cream/60 text-base sm:text-lg max-w-xl leading-relaxed">
          Publisher & Distributor of{' '}
          <span className="text-cream/90 font-medium">Hindustani Classical Music Books</span>
          , Kanpur, Uttar Pradesh
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/books"
            className="group flex items-center gap-2.5 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold px-8 py-3.5 rounded-full transition-all duration-300 shadow-gold-sm hover:shadow-gold-glow text-sm sm:text-base"
          >
            <ShoppingBag size={18} />
            Browse Books
          </Link>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 border border-gold/30 hover:border-gold text-cream hover:text-gold font-cinzel px-8 py-3.5 rounded-full transition-all duration-300 text-sm sm:text-base backdrop-blur-sm"
          >
            <MessageCircle size={18} />
            WhatsApp Us
          </a>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 sm:gap-12 mt-2">
          {[
            { value: '20+', label: 'Titles' },
            { value: '130+', label: 'Ragas Covered' },
            { value: '30+', label: 'Years of Trust' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-cinzel text-gold font-bold text-xl sm:text-2xl">{stat.value}</p>
              <p className="text-cream/40 text-xs uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
