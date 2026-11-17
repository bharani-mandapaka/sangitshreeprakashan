'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * "Look inside": a row of small page thumbnails on the book's page. Tapping one opens that page
 * large, with previous/next buttons, keyboard arrows and Escape, and a swipe-friendly layout on
 * phones. Pages come from Admin -> Catalog -> Sample pages and are shown in the order given.
 */
export default function SamplePages({ pages, title }: { pages: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const touchStart = useRef<number | null>(null);
  const count = pages.length;
  const isOpen = open !== null;

  const go = useCallback((step: number) => {
    setOpen((i) => (i === null ? i : (i + step + count) % count));
  }, [count]);

  // While the viewer is open: keyboard control, page scroll locked, focus moved into it and
  // handed back to the thumbnail that opened it when it closes.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [isOpen, go]);

  if (count === 0) return null;

  // Swipe left / right on a phone.
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };

  return (
    <div>
      <h2 className="font-cinzel text-cream font-semibold text-base mb-3">Look inside</h2>
      <ul className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {pages.map((url, i) => (
          <li key={url} className="flex-shrink-0">
            <button
              type="button"
              onClick={(e) => { openerRef.current = e.currentTarget; setOpen(i); }}
              aria-label={`Open sample page ${i + 1} of ${count}`}
              className="relative block w-24 sm:w-28 aspect-[3/4] rounded-lg overflow-hidden border border-gold/20 hover:border-gold/60 focus-visible:border-gold bg-black/40 transition-colors"
            >
              <Image src={url} alt={`${title}, sample page ${i + 1}`} fill sizes="112px" className="object-cover" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>

      {/* Drawn on <body>, not inside this component: the book page content is wrapped in an animated
          (transformed) element, and a fixed-position child of a transformed element is positioned
          against that element instead of the screen, which pushed the viewer off to one side. */}
      {isOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title}: sample page ${open + 1} of ${count}`}
          className="fixed inset-0 z-[70] bg-black/90 flex flex-col"
          onClick={() => setOpen(null)}
        >
          <div className="flex items-center justify-between px-4 py-3 text-cream/80 text-sm font-cinzel">
            <span>Page {open + 1} of {count}</span>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="p-2 rounded-full hover:bg-white/10 text-cream"
            >
              <X size={22} />
            </button>
          </div>

          <div
            className="relative flex-1 mx-2 sm:mx-12 mb-4"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
            onTouchEnd={onTouchEnd}
          >
            <Image
              key={pages[open]}
              src={pages[open]}
              alt={`${title}, sample page ${open + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                aria-label="Previous page"
                className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-cream"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                aria-label="Next page"
                className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-cream"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
