'use client';

import Link from 'next/link';
import Image from 'next/image';
import { m as motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

export default function HeroScroll() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-dark flex items-center justify-center py-24">

      {/* Library photo behind everything, darkened so the text stays readable, fading into the page below */}
      <div className="absolute inset-0 pointer-events-none">
        <Image src="/hero-library.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        {/* Phones: even dark layer (text sits over the photo). Wide screens: dark on the left where the
            text is, clear on the right so the library shows. */}
        <div className="absolute inset-0 bg-[#130304]/80 lg:hidden" />
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-[#130304]/95 via-[#130304]/65 to-[#130304]/10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-dark" />
      </div>

      {/* Radial background gradient */}
      <div className="absolute inset-0 pointer-events-none lg:hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_rgba(139,0,0,0.35)_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_50%,_rgba(201,162,39,0.08)_0%,_transparent_70%)]" />
      </div>

      {/* Decorative rings (static) — scale with viewport, capped so they never clip or shrink too far */}
      <div className="absolute rounded-full border border-gold/5 pointer-events-none lg:hidden" style={{ width: 'clamp(280px, 85vw, 600px)', height: 'clamp(280px, 85vw, 600px)' }} />
      <div className="absolute rounded-full border border-gold/[0.08] pointer-events-none lg:hidden" style={{ width: 'clamp(200px, 62vw, 420px)', height: 'clamp(200px, 62vw, 420px)' }} />
      <div className="absolute rounded-full border border-gold/10 pointer-events-none lg:hidden" style={{ width: 'clamp(140px, 40vw, 260px)', height: 'clamp(140px, 40vw, 260px)' }} />

      {/* Content — fades/slides in once on mount, no scroll-linked animation */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center px-4 gap-6 lg:items-start lg:text-left lg:self-center lg:mr-auto lg:pl-[6vw]"
      >
        {/* Brand name, with the very small publisher line directly under it */}
        <div className="flex flex-col items-center lg:items-start gap-2">
          <h1 className="font-cinzel text-3xl sm:text-4xl lg:text-[2.6rem] font-black leading-tight tracking-wide">
            <span className="text-gold-gradient">Sangit Shree</span>
            <br className="sm:hidden" />
            <span className="text-cream sm:ml-3">Prakashan</span>
          </h1>
          <p className="text-cream/50 text-[10px] sm:text-[11px] uppercase tracking-[0.2em]">
            Publisher & Distributor of Hindustani Classical Music Books, Kanpur, Uttar Pradesh
          </p>
        </div>

        {/* Hindi tagline */}
        <p className="font-devanagari text-gold/80 text-base sm:text-lg -mt-2">
          संगीत श्री प्रकाशन
        </p>

        {/* About */}
        <p className="text-cream/75 text-sm sm:text-base max-w-md leading-relaxed">
          Our platform is dedicated to providing authentic and comprehensive books on theory, practical, and history of Hindustani Classical music.
        </p>

        {/* CTA button */}
        <Link
          href="/books"
          className="group flex items-center gap-2.5 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold px-7 py-3 rounded-full transition-all duration-300 shadow-gold-sm hover:shadow-gold-glow text-sm"
        >
          <ShoppingBag size={17} />
          Browse Books
        </Link>

        {/* Stats */}
        <div className="flex items-center gap-8 sm:gap-10 mt-1">
          {[
            { value: '20+', label: 'Titles' },
            { value: '130+', label: 'Ragas Covered' },
            { value: '30+', label: 'Years of Trust' },
          ].map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <p className="font-cinzel text-gold font-bold text-lg sm:text-xl">{stat.value}</p>
              <p className="text-cream/40 text-[10px] uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
