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
    // iOS Safari fires touchcancel (not touchend) when a touch turns into a
    // scroll/system gesture — without this, resume() never runs and the
    // carousel stays paused for the rest of the session after the first touch.
    el.addEventListener('touchcancel', resume, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('touchend',   resume);
      el.removeEventListener('touchcancel', resume);
    };
  }, [speedPx]);

  // Because this scrolls continuously (not snap-to-card), the leading/trailing
  // card is mid-scroll at any given moment and gets hard-clipped by the
  // container edge — reads as a rendering bug ("timeline is cut off") rather
  // than normal carousel behavior. Fading the edges with a mask makes that
  // partial card disappear into the background instead of being sliced.
  const edgeFade = {
    maskImage:
      'linear-gradient(to right, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)',
    WebkitMaskImage:
      'linear-gradient(to right, transparent 0, black 32px, black calc(100% - 32px), transparent 100%)',
  };

  return (
    <div
      ref={ref}
      className="overflow-x-auto select-none pb-4 cursor-grab active:cursor-grabbing"
      style={{
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        ...edgeFade,
      }}
    >
      {children}
    </div>
  );
}
