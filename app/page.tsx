import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';
import HeroScroll from '@/components/HeroScroll';
import BookCard from '@/components/BookCard';
import GallerySlideshow from '@/components/GallerySlideshow';
import { getFeaturedBooks, categoryMeta, type BookCategory } from '@/lib/books';
import { WHATSAPP_URL } from '@/lib/utils';

const primaryCategories: BookCategory[] = ['instrumental', 'vocal', 'raag-theory', 'kathak'];

const testimonials = [
  {
    name: 'Rohit Sharma',
    role: 'Music Teacher, Lucknow',
    text: 'The Swar Vadan series is indispensable for every instrumental student. Clear notations and comprehensive raga coverage.',
  },
  {
    name: 'Priya Agarwal',
    role: 'Sangit Prabhakar Student',
    text: 'I passed my B.A. Music exams with distinction thanks to the Bhatkhande Swarlippi books. Highly recommended!',
  },
  {
    name: 'Anand Mishra',
    role: 'Tabla Guru, Kanpur',
    text: 'The Raag Shastra Parichay series presents complex theory in a very accessible manner. My students love them.',
  },
];

export default function HomePage() {
  const featured = getFeaturedBooks().slice(0, 8);

  return (
    <>
      {/* ── 3D Scroll Hero ─────────────────────────────────────────────── */}
      <HeroScroll />

      {/* ── Transition fade-in divider ─────────────────────────────────── */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      {/* ── Categories ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-dark to-[#0F0000]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">
              Browse by Subject
            </p>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-cream">
              Our Collection
            </h2>
            <p className="font-devanagari text-gold/60 text-lg mt-2">हमारा संग्रह</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {primaryCategories.map((cat) => {
              const meta = categoryMeta[cat];
              return (
                <Link
                  key={cat}
                  href={`/books?category=${cat}`}
                  className="group gold-border rounded-2xl p-6 bg-[#0A0000] hover:bg-[#150000] transition-all duration-300 flex flex-col items-center text-center gap-3"
                >
                  <span className="text-4xl">{meta.icon}</span>
                  <div>
                    <h3 className="font-cinzel text-cream font-semibold text-sm group-hover:text-gold transition-colors">
                      {meta.label}
                    </h3>
                    <p className="font-devanagari text-gold/50 text-xs mt-0.5">{meta.labelHindi}</p>
                  </div>
                  <p className="text-cream/40 text-xs leading-relaxed hidden sm:block">
                    {meta.description}
                  </p>
                  <span className="text-gold/50 group-hover:text-gold transition-colors text-xs flex items-center gap-1 mt-auto">
                    View books <ArrowRight size={12} />
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Bundle CTA */}
          <Link
            href="/books?category=bundle"
            className="mt-6 flex items-center justify-between p-5 rounded-2xl border border-gold/25 bg-gradient-to-r from-crimson-900/40 to-[#0A0000] hover:border-gold/50 transition-all duration-300 group"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">📦</span>
              <div>
                <h3 className="font-cinzel text-gold font-semibold">
                  {categoryMeta.bundle.label}
                </h3>
                <p className="text-cream/50 text-sm">{categoryMeta.bundle.description}</p>
              </div>
            </div>
            <ArrowRight className="text-gold/50 group-hover:text-gold transition-colors flex-shrink-0" size={20} />
          </Link>
        </div>
      </section>

      <div className="divider-gold mx-8" />

      {/* ── Featured Books ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0F0000]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">
                Handpicked for You
              </p>
              <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-cream">
                Featured Books
              </h2>
            </div>
            <Link
              href="/books"
              className="hidden sm:flex items-center gap-2 text-gold hover:text-gold-300 font-cinzel text-sm transition-colors"
            >
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {featured.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>

          <div className="sm:hidden mt-8 text-center">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 text-gold hover:text-gold-300 font-cinzel text-sm transition-colors"
            >
              View All Books <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <div className="divider-gold mx-8" />

      {/* ── Gallery Slideshow ──────────────────────────────────────────── */}
      <GallerySlideshow />

      <div className="divider-gold mx-8" />

      {/* ── About Snippet ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0F0000] to-dark">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-4">
            Our Story
          </p>
          <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-cream mb-6">
            Preserving the Legacy of{' '}
            <span className="text-gold-gradient">Hindustani Classical Music</span>
          </h2>
          <p className="font-devanagari text-gold/60 text-xl mb-8">हिन्दुस्तानी शास्त्रीय संगीत की विरासत</p>
          <p className="text-cream/60 text-base sm:text-lg leading-relaxed mb-8 max-w-3xl mx-auto">
            Sangit Shree Prakashan has been at the heart of Hindustani Classical Music education
            for decades. Based in Kanpur, Uttar Pradesh, we publish authoritative books used by
            students, teachers and musicians across India - from Class 9 through Post-Graduation,
            covering Prayag Sangit Samiti, Pracheen Kala Kendra, Gandharv Mahavidyalay, CBSE,
            ICSE, and University syllabi.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 border border-gold/30 hover:border-gold text-cream hover:text-gold font-cinzel px-8 py-3 rounded-full transition-all duration-300 text-sm"
          >
            Learn More <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <div className="divider-gold mx-8" />

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">
              What Students Say
            </p>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-cream">
              Trusted by Musicians
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="gold-border rounded-2xl p-6 bg-[#0A0000] flex flex-col gap-4"
              >
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-cream/70 text-sm leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-cinzel text-cream text-sm font-semibold">{t.name}</p>
                  <p className="text-cream/40 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WhatsApp CTA Banner ─────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-crimson-700 via-crimson to-crimson-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_50%,_rgba(201,162,39,0.1)_0%,_transparent_70%)]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-cream mb-3">
            Have a question about our books?
          </h2>
          <p className="text-cream/70 mb-8">
            Chat with us directly on WhatsApp - we&apos;re happy to help you find the right book.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-cinzel font-bold px-8 py-4 rounded-full transition-colors shadow-xl text-base"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12.004 2C6.477 2 2 6.477 2 12.004c0 1.771.469 3.53 1.36 5.07L2.05 22l5.077-1.29A10.01 10.01 0 0012.004 22C17.527 22 22 17.523 22 12.004 22 6.477 17.527 2 12.004 2zm0 18.35a8.34 8.34 0 01-4.378-1.232l-.314-.187-3.012.765.793-2.93-.203-.328A8.347 8.347 0 013.65 12.004c0-4.607 3.748-8.355 8.354-8.355 4.607 0 8.355 3.748 8.355 8.355 0 4.607-3.748 8.35-8.355 8.35z"/>
            </svg>
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
