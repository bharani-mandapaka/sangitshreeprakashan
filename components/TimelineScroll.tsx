'use client';

import { useRef, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  speedPx?: number; // pixels per second
}

export default function TimelineScroll({ children, speedPx = 50 }: Props) {
  const ref    = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const lastTs = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number;

    const tick = (ts: number) => {
      const overflow = el.scrollWidth - el.clientWidth;

      if (lastTs.current !== null && !paused.current && overflow > 1) {
        const delta = ts - lastTs.current;           // ms since last frame
        el.scrollLeft += (speedPx * delta) / 1000;  // proportional advance

        // Seamless loop: once we reach the end, snap back to start
        if (el.scrollLeft >= overflow - 1) {
          el.scrollLeft = 0;
        }
      }
      lastTs.current = ts;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    const pause  = () => { paused.current = true; };
    const resume = () => { paused.current = false; lastTs.current = null; };

    el.addEventListener('mouseenter',  pause);
    el.addEventListener('mouseleave',  resume);
    el.addEventListener('touchstart',  pause,  { passive: true });
    el.addEventListener('touchend',    resume, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('touchend',   resume);
    };
  }, [speedPx]);

  return (
    <div
      ref={ref}
      className="overflow-x-auto select-none pb-4 cursor-grab active:cursor-grabbing"
      style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {children}
    </div>
  );
}
