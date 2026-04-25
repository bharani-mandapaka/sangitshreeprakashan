'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SLIDES = [
  '/gallery/slide-1.jpeg',
  '/gallery/slide-2.jpeg',
  '/gallery/slide-3.jpeg',
  '/gallery/slide-4.jpeg',
  '/gallery/slide-5.jpeg',
  '/gallery/slide-6.jpeg',
  '/gallery/slide-7.png',
  '/gallery/slide-8.png',
  '/gallery/slide-9.png',
  '/gallery/slide-10.png',
  '/gallery/slide-11.jpeg',
];

const INTERVAL = 4500;

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 60 }),
  center: { opacity: 1, x: 0 },
  exit:  (dir: number) => ({ opacity: 0, x: dir * -60 }),
};

export default function GallerySlideshow() {
  const [current, setCurrent]   = useState(0);
  const [paused,  setPaused]    = useState(false);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((idx: number, dir: number) => {
    setDirection(dir);
    setCurrent(((idx % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => go(current + 1,  1), [current, go]);
  const prev = useCallback(() => go(current - 1, -1), [current, go]);

  useEffect(() => {
    if (paused) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(next, INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused, next]);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0A0000] to-dark">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">
            Moments in Music
          </p>
          <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-cream">
            Through the Lens
          </h2>
          <p className="font-devanagari text-gold/60 text-lg mt-2">
            पं० सतीश चन्द्र श्रीवास्तव की यादें
          </p>
        </div>

        {/* Slideshow */}
        <div
          className="relative w-full rounded-2xl overflow-hidden border border-gold/20 shadow-[0_0_60px_rgba(0,0,0,0.8),0_0_30px_rgba(201,162,39,0.08)]"
          style={{ aspectRatio: '16/9' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={SLIDES[current]}
                alt={`Gallery photo ${current + 1} - Pt. Satish Chandra Srivastava`}
                fill
                className="object-cover object-center"
                priority={current === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
              />
              {/* Gradient overlay for legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Prev arrow */}
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 border border-gold/20 hover:border-gold/50 flex items-center justify-center text-cream/70 hover:text-gold transition-all duration-200 backdrop-blur-sm"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Next arrow */}
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/75 border border-gold/20 hover:border-gold/50 flex items-center justify-center text-cream/70 hover:text-gold transition-all duration-200 backdrop-blur-sm"
          >
            <ChevronRight size={20} />
          </button>

          {/* Counter badge */}
          <div className="absolute bottom-4 right-4 z-20 bg-black/60 backdrop-blur-sm border border-gold/15 rounded-full px-3 py-1 font-cinzel text-gold/70 text-xs">
            {current + 1} / {SLIDES.length}
          </div>

          {/* Pause indicator */}
          {paused && (
            <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm border border-gold/15 rounded-full px-3 py-1 font-cinzel text-gold/50 text-[10px] uppercase tracking-widest">
              Paused
            </div>
          )}
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i, i > current ? 1 : -1)}
              aria-label={`Go to photo ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-2 bg-gold'
                  : 'w-2 h-2 bg-gold/25 hover:bg-gold/50'
              }`}
            />
          ))}
        </div>

        {/* Caption */}
        <p className="text-center text-cream/35 text-xs font-cinzel mt-4 tracking-wider uppercase">
          A lifetime dedicated to Hindustani Classical Music
        </p>
      </div>
    </section>
  );
}
