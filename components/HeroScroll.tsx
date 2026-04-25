'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useSpring,
} from 'framer-motion';
import { ShoppingBag, MessageCircle, ChevronDown } from 'lucide-react';
import { WHATSAPP_URL } from '@/lib/utils';

export default function HeroScroll() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // ── Smooth spring wrapper for the main progress ─────────────────────
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });

  // ── Logo: rotates in 3D like a coin turning to face you ─────────────
  const logoRotateY  = useTransform(smoothProgress, [0, 0.18, 0.55, 0.80], [-30, 0, 6, -6]);
  const logoScale    = useTransform(smoothProgress, [0, 0.15, 0.60, 0.85], [0.6, 1, 1, 0.75]);
  const logoOpacity  = useTransform(smoothProgress, [0, 0.08, 0.72, 0.92], [0, 1, 1, 0]);
  const logoY        = useTransform(smoothProgress, [0, 0.18, 0.60, 0.85], [40, 0, 0, -30]);

  // ── Gold glow around logo ────────────────────────────────────────────
  const glowPx       = useTransform(smoothProgress, [0, 0.25, 0.55, 0.85], [0, 50, 35, 0]);
  const glowOpacity  = useTransform(smoothProgress, [0, 0.25, 0.55, 0.85], [0, 0.7, 0.5, 0]);
  const logoFilter   = useMotionTemplate`drop-shadow(0 0 ${glowPx}px rgba(201,162,39,${glowOpacity}))`;

  // ── Title ─────────────────────────────────────────────────────────────
  const titleOpacity = useTransform(smoothProgress, [0.18, 0.32], [0, 1]);
  const titleY       = useTransform(smoothProgress, [0.18, 0.32], [50, 0]);
  const titleBlur    = useTransform(smoothProgress, [0.18, 0.32], [12, 0]);
  const titleFilter  = useMotionTemplate`blur(${titleBlur}px)`;

  // ── Subtitle ──────────────────────────────────────────────────────────
  const subOpacity   = useTransform(smoothProgress, [0.28, 0.42], [0, 1]);
  const subY         = useTransform(smoothProgress, [0.28, 0.42], [30, 0]);

  // ── Hindi tagline ─────────────────────────────────────────────────────
  const hindiOpacity = useTransform(smoothProgress, [0.36, 0.48], [0, 1]);

  // ── CTAs ──────────────────────────────────────────────────────────────
  const ctaOpacity   = useTransform(smoothProgress, [0.44, 0.56], [0, 1]);
  const ctaY         = useTransform(smoothProgress, [0.44, 0.56], [24, 0]);

  // ── Stats row ─────────────────────────────────────────────────────────
  const statsOpacity = useTransform(smoothProgress, [0.52, 0.64], [0, 1]);

  // ── Whole section exits upward ────────────────────────────────────────
  const exitOpacity  = useTransform(smoothProgress, [0.72, 0.94], [1, 0]);
  const exitY        = useTransform(smoothProgress, [0.72, 0.94], [0, -80]);

  // ── Background subtle scale ───────────────────────────────────────────
  const bgScale      = useTransform(smoothProgress, [0, 1], [1.08, 1]);

  // ── Decorative ring rotation ──────────────────────────────────────────
  const ringRotate   = useTransform(smoothProgress, [0, 1], [0, 180]);
  const ring2Rotate  = useTransform(smoothProgress, [0, 1], [0, -120]);

  // ── Scroll indicator ─────────────────────────────────────────────────
  const scrollIndicatorOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);

  return (
    <section ref={containerRef} className="relative h-[320vh]">
      {/* ── Sticky viewport ────────────────────────────────────────────── */}
      <div className="sticky top-0 h-screen overflow-hidden bg-dark flex items-center justify-center">

        {/* Radial background gradient - slowly contracts */}
        <motion.div
          style={{ scale: bgScale }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_rgba(139,0,0,0.35)_0%,_transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_50%_50%,_rgba(201,162,39,0.08)_0%,_transparent_70%)]" />
        </motion.div>

        {/* Decorative rotating rings */}
        <motion.div
          style={{ rotate: ringRotate }}
          className="absolute w-[600px] h-[600px] rounded-full border border-gold/5 pointer-events-none"
        />
        <motion.div
          style={{ rotate: ring2Rotate }}
          className="absolute w-[420px] h-[420px] rounded-full border border-gold/8 pointer-events-none"
        />
        <div className="absolute w-[260px] h-[260px] rounded-full border border-gold/10 pointer-events-none" />

        {/* ── All animated content ──────────────────────────────────────── */}
        <motion.div
          style={{ opacity: exitOpacity, y: exitY }}
          className="relative z-10 flex flex-col items-center text-center px-4 gap-6"
        >
          {/* 3-D Logo */}
          <div className="perspective-1000">
            <motion.div
              style={{
                rotateY:  logoRotateY,
                scale:    logoScale,
                opacity:  logoOpacity,
                y:        logoY,
                filter:   logoFilter,
              }}
              className="logo-shimmer-wrap w-36 h-36 sm:w-44 sm:h-44 lg:w-52 lg:h-52 cursor-default"
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
          </div>

          {/* Brand name */}
          <motion.div style={{ opacity: titleOpacity, y: titleY, filter: titleFilter }}>
            <h1 className="font-cinzel text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-wide">
              <span className="text-gold-gradient">Sangit Shree</span>
              <br />
              <span className="text-cream">Prakashan</span>
            </h1>
          </motion.div>

          {/* Hindi tagline */}
          <motion.p
            style={{ opacity: hindiOpacity }}
            className="font-devanagari text-gold/80 text-lg sm:text-xl"
          >
            संगीत श्री प्रकाशन
          </motion.p>

          {/* Subtitle */}
          <motion.p
            style={{ opacity: subOpacity, y: subY }}
            className="text-cream/60 text-base sm:text-lg max-w-xl leading-relaxed"
          >
            Publisher & Distributor of{' '}
            <span className="text-cream/90 font-medium">Hindustani Classical Music Books</span>
            , Kanpur, Uttar Pradesh
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            style={{ opacity: ctaOpacity, y: ctaY }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
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
          </motion.div>

          {/* Stats */}
          <motion.div
            style={{ opacity: statsOpacity }}
            className="flex items-center gap-8 sm:gap-12 mt-2"
          >
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
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          style={{ opacity: scrollIndicatorOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-cream/30"
        >
          <span className="text-xs uppercase tracking-[0.2em] font-cinzel">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
