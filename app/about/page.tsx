import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, BookOpen, Users, Award, MapPin, Star, Quote,
  Sun, Music, Music2, Radio, Tv, GraduationCap, Medal,
  BookMarked, Microscope, Target, Eye,
} from 'lucide-react';
import TimelineScroll from '@/components/TimelineScroll';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Sangit Shree Prakashan - publisher of Hindustani Classical Music books, founded by Sangeet Natak Akademi Award winner Pt. Satish Chandra Srivastava, student of Sitar maestro Pt. Ravi Shankar.',
};

const awards = [
  'Sangeet Natak Akademi Award',
  'Sangeetacharya',
  'Sangeet Kala Ratna',
  'Sangeet Shiromani',
  'Top Grade Artist - All India Radio',
  'Top Grade Artist - Doordarshan',
];

const stats = [
  { icon: <BookOpen size={22} />, value: '20+',      label: 'Books Published' },
  { icon: <Users size={22} />,    value: '50,000+',  label: 'Students Served' },
  { icon: <Award size={22} />,    value: '130+',     label: 'Ragas Covered' },
  { icon: <MapPin size={22} />,   value: 'PAN India',label: 'Distribution' },
];

const founderTimeline = [
  {
    year: '1938',
    icon: <Sun size={18} className="text-red-300" />,
    iconBg: 'linear-gradient(135deg,#3D0800,#8B0000)',
    tag: 'Birth',
    tagClass: 'bg-red-900/40 text-red-300 border border-red-800/30',
    title: 'Born in Allahabad',
    description: 'Born on 8th September 1938 in Allahabad, UP - a city steeped in the arts.',
  },
  {
    year: 'Early 1950s',
    icon: <Music size={18} className="text-amber-300" />,
    iconBg: 'linear-gradient(135deg,#1A0A00,#4A1500)',
    tag: 'Education',
    tagClass: 'bg-amber-900/30 text-amber-300 border border-amber-800/30',
    title: 'Training under Prof. Banwari Lal',
    description: 'Began formal sitar training under Prof. Banwari Lal, building a rigorous classical foundation.',
  },
  {
    year: '1960',
    icon: <BookOpen size={18} className="text-green-300" />,
    iconBg: 'linear-gradient(135deg,#001A0A,#003D1A)',
    tag: 'Career',
    tagClass: 'bg-green-900/30 text-green-300 border border-green-800/30',
    title: 'Joins D.G.P.G. College, Kanpur',
    description: 'Joined the Department of Music as faculty - the start of a 39-year academic career.',
  },
  {
    year: '1963',
    icon: <Music2 size={18} className="text-yellow-200" />,
    iconBg: 'linear-gradient(135deg,#2A1A00,#6B4500)',
    tag: 'Mentorship',
    tagClass: 'bg-yellow-900/30 text-yellow-200 border border-yellow-700/30',
    title: 'Student of Pt. Ravi Shankar',
    description: 'Began advanced sitar training under the legendary maestro Pandit Ravi Shankar - a defining chapter.',
  },
  {
    year: '1960s–70s',
    icon: <Radio size={18} className="text-cyan-300" />,
    iconBg: 'linear-gradient(135deg,#001A1A,#003D3D)',
    tag: 'Recognition',
    tagClass: 'bg-cyan-900/30 text-cyan-300 border border-cyan-800/30',
    title: 'Top Grade Artist - All India Radio',
    description: 'Conferred the coveted "Top Grade Artist" honour by All India Radio.',
  },
  {
    year: '1970s–80s',
    icon: <Tv size={18} className="text-cyan-300" />,
    iconBg: 'linear-gradient(135deg,#001A00,#004000)',
    tag: 'Recognition',
    tagClass: 'bg-cyan-900/30 text-cyan-300 border border-cyan-800/30',
    title: 'Top Grade Artist - Doordarshan',
    description: 'Awarded "Top Grade Artist" by Doordarshan; performed on prestigious stages worldwide.',
  },
  {
    year: '1980s',
    icon: <GraduationCap size={18} className="text-purple-300" />,
    iconBg: 'linear-gradient(135deg,#1A001A,#3D003D)',
    tag: 'Leadership',
    tagClass: 'bg-purple-900/30 text-purple-300 border border-purple-800/30',
    title: 'Head of Department of Music',
    description: 'Appointed Head of the Department of Music at D.G.P.G. College, Kanpur.',
  },
  {
    year: 'Career-long',
    icon: <Award size={18} className="text-gold" />,
    iconBg: 'linear-gradient(135deg,#2A1A00,#8B6914)',
    tag: 'Awards',
    tagClass: 'bg-gold/10 text-gold border border-gold/20',
    title: 'National Honours & Awards',
    description: 'Sangeet Natak Akademi Award, Sangeetacharya, Sangeet Kala Ratna & Sangeet Shiromani.',
  },
  {
    year: '1999',
    icon: <Medal size={18} className="text-red-300" />,
    iconBg: 'linear-gradient(135deg,#1A0000,#5C0000)',
    tag: 'Retirement',
    tagClass: 'bg-red-900/30 text-red-300 border border-red-800/30',
    title: 'Retirement after 39 Years',
    description: 'Retired from D.G.P.G. College after nearly four decades, leaving a transformed music department.',
  },
  {
    year: '2000s–2010s',
    icon: <BookMarked size={18} className="text-emerald-300" />,
    iconBg: 'linear-gradient(135deg,#001A0A,#004020)',
    tag: 'Publications',
    tagClass: 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/30',
    title: 'Landmark Music Textbooks',
    description: 'Authored the Swar Vadan series, Bhatkhande Swarlippi Sangrah & Raag Shastra Parichay - used by 50,000+ students.',
  },
  {
    year: '2024',
    icon: <Microscope size={18} className="text-lime-300" />,
    iconBg: 'linear-gradient(135deg,#1A1A00,#404000)',
    tag: 'Legacy',
    tagClass: 'bg-lime-900/30 text-lime-300 border border-lime-700/30',
    title: 'Research Thesis at Punjab University',
    description: '"Pandit Satish Chandra Srivastava Ka Sangeet Ke Kshetra Mein Yogdan" - a permanent academic tribute.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-dark pt-20 lg:pt-24">

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-[#0F0000] to-dark py-16 px-4 sm:px-6 lg:px-8 border-b border-gold/10 text-center">
        <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">Our Story</p>
        <h1 className="font-cinzel text-4xl sm:text-5xl font-bold text-cream mb-3">About Us</h1>
        <p className="font-devanagari text-gold/60 text-xl">हमारे बारे में</p>
      </div>

      {/* ── Stats Bar ───────────────────────────────────────────────────── */}
      <div className="border-b border-gold/10 bg-[#0A0000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center flex flex-col items-center gap-2">
              <span className="text-gold/60">{s.icon}</span>
              <p className="font-cinzel text-gold font-bold text-3xl">{s.value}</p>
              <p className="text-cream/40 text-xs uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Founder Bio ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">
            The Visionary Behind the Books
          </p>
          <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-cream">About the Founder</h2>
          <p className="font-devanagari text-gold/60 text-lg mt-2">संस्थापक के बारे में</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: photo + name + awards */}
          <div className="flex flex-col gap-6">
            <div className="mx-auto lg:mx-0 relative w-56 h-64 flex-shrink-0">
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-gold/30 via-crimson/20 to-gold/10 blur-md" />
              <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-gold/40 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(201,162,39,0.25)]">
                <Image
                  src="/founder.jpg"
                  alt="Pandit Satish Chandra Srivastava"
                  fill
                  className="object-cover object-top"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-dark/80 to-transparent" />
              </div>
            </div>

            <div>
              <h3 className="font-cinzel text-2xl sm:text-3xl font-bold text-cream">
                Pt. Satish Chandra Srivastava
              </h3>
              <p className="font-devanagari text-gold text-xl mt-1">पं० सतीश चन्द्र श्रीवास्तव</p>
              <p className="text-cream/50 text-sm mt-1 font-cinzel">
                8 September 1938 - Allahabad, Uttar Pradesh
              </p>
            </div>

            <div className="bg-[#0A0000] border border-gold/15 rounded-2xl p-5">
              <p className="font-cinzel text-gold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                <Award size={14} /> Honours & Recognition
              </p>
              <div className="flex flex-wrap gap-2">
                {awards.map((award) => (
                  <span
                    key={award}
                    className="flex items-center gap-1.5 text-xs text-cream/70 border border-gold/15 rounded-full px-3 py-1"
                  >
                    <Star size={9} className="text-gold fill-gold" /> {award}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: bio text */}
          <div className="space-y-5 text-cream/65 text-base leading-relaxed">
            <div className="relative pl-5 border-l-2 border-gold/40">
              <Quote size={20} className="text-gold/30 absolute -top-1 -left-2.5" />
              <p className="font-cinzel text-cream/80 text-sm italic leading-relaxed">
                Student of Sitar maestro Pandit Ravi Shankar. Sangeet Natak Akademi awardee.
                Head of Music, D.G.P.G. College, Kanpur - for 39 years.
              </p>
            </div>

            <p>
              Pandit Satish Chandra Srivastava began his sitar training under{' '}
              <span className="text-cream/90 font-medium">Prof. Banwari Lal</span>, and from{' '}
              <span className="text-gold font-semibold">1963</span> honed his craft under the
              tutelage of Sitar maestro{' '}
              <span className="text-cream/90 font-medium">Pt. Ravi Shankar</span> - one of the
              most celebrated musicians of the 20th century.
            </p>

            <p>
              His academic career spanned nearly four decades as a faculty member and later{' '}
              <span className="text-cream/90 font-medium">
                Head of the Department of Music at D.G.P.G. College, Kanpur (1960–1999)
              </span>
              . During this time, he shaped generations of musicians and established himself as
              one of the foremost music educators in Uttar Pradesh.
            </p>

            <p>
              Recognised as a{' '}
              <span className="text-gold font-semibold">&ldquo;Top Grade Artist&rdquo;</span> by
              both All India Radio and Doordarshan, Panditji performed on prestigious stages
              worldwide and conducted numerous workshops promoting Hindustani Classical Music.
              His contributions were featured in journals including{' '}
              <em>Sangeet Kala Vihar</em> and <em>Sangeet</em>.
            </p>

            <p>
              In <span className="text-gold font-semibold">2024</span>, a research thesis titled{' '}
              <em>
                &ldquo;Pandit Satish Chandra Srivastava Ka Sangeet Ke Kshetra Mein Yogdan&rdquo;
              </em>{' '}
              was documented at Punjab University - cementing his enduring impact on Indian
              Classical Music.
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          HORIZONTAL LIFE TIMELINE
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#060000] border-y border-gold/10 py-16 overflow-x-hidden">

        {/* Section heading - constrained width */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
          <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">
            A Life in Music
          </p>
          <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-cream">
            The Life of Pandit Satish Chandra Srivastava
          </h2>
          <p className="font-devanagari text-gold/60 text-lg mt-2">
            पं० सतीश चन्द्र श्रीवास्तव का जीवन
          </p>
          {/* Scroll hint */}
          <p className="text-cream/25 text-xs font-cinzel mt-4 flex items-center justify-center gap-2">
            <span className="animate-pulse">⟵</span> auto-scrolling · hover to pause <span className="animate-pulse">⟶</span>
          </p>
        </div>

        {/* Horizontally scrollable timeline - auto-scrolls via TimelineScroll */}
        <TimelineScroll speedPx={50}>
          <div
            className="relative flex px-16 sm:px-24"
            style={{ height: '560px' }}
          >
            {/* ── Gold horizontal centre line ── */}
            <div className="absolute left-0 right-0 top-[260px] h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
            {/* Faint extended glow */}
            <div className="absolute left-0 right-0 top-[259px] h-[3px] bg-gradient-to-r from-transparent via-gold/10 to-transparent blur-sm" />

            {founderTimeline.map((item, i) => {
              const isAbove = i % 2 === 0;
              return (
                <div
                  key={item.year}
                  className="relative flex flex-col items-center flex-shrink-0"
                  style={{ '--tl-item-w': 'clamp(140px, 35vw, 220px)', width: 'var(--tl-item-w)' } as CSSProperties}
                >
                  {/* ── TOP half (260px) ── */}
                  <div className="flex flex-col items-center justify-end w-full" style={{ height: '260px' }}>
                    {isAbove ? (
                      <div className="flex flex-col items-center w-full">
                        {/* Card */}
                        <div className="w-[calc(var(--tl-item-w)-20px)] bg-[#0D0000] border border-gold/12 hover:border-gold/35 rounded-xl p-3.5 transition-all duration-300 group shadow-lg">
                          <span className={`inline-block text-[9px] font-cinzel font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${item.tagClass}`}>
                            {item.tag}
                          </span>
                          <p className="font-cinzel text-gold font-bold text-base leading-tight mb-1.5">
                            {item.year}
                          </p>
                          <p className="font-cinzel text-cream/90 text-[11px] font-semibold leading-snug mb-1.5 group-hover:text-gold transition-colors">
                            {item.title}
                          </p>
                          <p className="text-cream/45 text-[10px] leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        {/* Connector down to dot */}
                        <div className="w-px flex-1 min-h-[12px] bg-gradient-to-b from-gold/20 to-gold/55" />
                      </div>
                    ) : (
                      /* Spacer - same height as card column above */
                      <div className="flex-1" />
                    )}
                  </div>

                  {/* ── Dot on the line ── */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 border-2 border-gold/35 z-10 shadow-[0_0_14px_rgba(201,162,39,0.3)] transition-transform hover:scale-110"
                    style={{ background: item.iconBg }}
                    title={item.title}
                  >
                    {item.icon}
                  </div>

                  {/* ── BOTTOM half (260px) ── */}
                  <div className="flex flex-col items-center justify-start w-full" style={{ height: '260px' }}>
                    {!isAbove ? (
                      <div className="flex flex-col items-center w-full h-full">
                        {/* Connector down from dot */}
                        <div className="w-px flex-1 min-h-[12px] bg-gradient-to-b from-gold/55 to-gold/20" />
                        {/* Card */}
                        <div className="w-[calc(var(--tl-item-w)-20px)] bg-[#0D0000] border border-gold/12 hover:border-gold/35 rounded-xl p-3.5 transition-all duration-300 group shadow-lg">
                          <span className={`inline-block text-[9px] font-cinzel font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 ${item.tagClass}`}>
                            {item.tag}
                          </span>
                          <p className="font-cinzel text-gold font-bold text-base leading-tight mb-1.5">
                            {item.year}
                          </p>
                          <p className="font-cinzel text-cream/90 text-[11px] font-semibold leading-snug mb-1.5 group-hover:text-gold transition-colors">
                            {item.title}
                          </p>
                          <p className="text-cream/45 text-[10px] leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1" />
                    )}
                  </div>
                </div>
              );
            })}

            {/* End-cap glyph */}
            <div className="flex items-center flex-shrink-0 pl-2" style={{ height: '560px' }}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gold/30 ring-4 ring-gold/8" />
                <p className="font-cinzel text-gold/30 text-[9px] uppercase tracking-widest"
                   style={{ writingMode: 'vertical-rl' }}>
                  Legacy Lives On
                </p>
              </div>
            </div>
          </div>
        </TimelineScroll>
      </div>

      {/* ── About the Publisher ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-24">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="w-full aspect-square max-w-sm mx-auto rounded-3xl bg-gradient-to-br from-crimson-800 to-dark flex items-center justify-center border border-gold/20 shadow-gold-glow">
              <div className="relative w-44 h-44">
                <Image src="/logo.png" alt="Sangit Shree Prakashan" fill className="object-contain drop-shadow-2xl" />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">The Publisher</p>
              <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-cream leading-tight">
                Preserving the Legacy of{' '}
                <span className="text-gold-gradient">Hindustani Music</span>
              </h2>
              <p className="font-devanagari text-gold/60 text-lg mt-2">हिन्दुस्तानी संगीत की विरासत</p>
            </div>

            <div className="space-y-4 text-cream/65 text-base leading-relaxed">
              <p>
                At Sangit Shree Prakashan, we are passionate about preserving and promoting the
                rich tradition of Hindustani Classical Music through authentic, syllabus-oriented
                publications. Our goal is to make classical music education{' '}
                <span className="text-cream/90 font-medium">accessible, simple, and enjoyable</span>{' '}
                for students, teachers, and enthusiasts alike.
              </p>
              <p>
                We specialise in publishing music books in Hindi and English, crafted to align
                with academic syllabuses - yet designed to foster a genuine appreciation of the
                art form beyond examinations. Every book reflects our commitment to{' '}
                <span className="text-cream/90 font-medium">authenticity, quality, and cultural responsibility</span>.
              </p>
              <p>
                Our books cover the syllabuses of Prayag Sangit Samiti, Pracheen Kala Kendra,
                Gandharv Mahavidyalay Mumbai, CBSE, ICSE, ISC and state boards - from Class 9
                through Post-Graduation (M.A.).
              </p>
            </div>
          </div>
        </div>

        <div className="divider-gold" />

        {/* Mission & Vision */}
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div>
            <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">What Drives Us</p>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-bold text-cream mb-6">Our Mission & Vision</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
            <div className="gold-border rounded-2xl p-6 bg-[#0A0000]">
              <h3 className="font-cinzel text-gold font-semibold text-base mb-3 flex items-center gap-2">
                <Target size={17} className="text-gold/70 flex-shrink-0" /> Our Mission
              </h3>
              <p className="text-cream/65 text-sm leading-relaxed">
                To bridge the gap between traditional music knowledge and modern learning needs  - 
                ensuring learners acquire technical proficiency and understand the spiritual depth
                of Hindustani Classical Music.
              </p>
            </div>
            <div className="gold-border rounded-2xl p-6 bg-[#0A0000]">
              <h3 className="font-cinzel text-gold font-semibold text-base mb-3 flex items-center gap-2">
                <Eye size={17} className="text-gold/70 flex-shrink-0" /> Our Vision
              </h3>
              <p className="text-cream/65 text-sm leading-relaxed">
                To nurture a new generation of musicians who cherish classical music as a lifelong
                passion. We believe music education should be an enriching journey connecting
                learners to India&apos;s rich cultural roots.
              </p>
            </div>
          </div>

          <blockquote className="relative border border-gold/20 rounded-2xl p-8 bg-[#0A0000]">
            <Quote size={32} className="text-gold/20 absolute top-4 left-4" />
            <p className="font-cinzel text-cream/80 text-lg leading-relaxed italic">
              &ldquo;Join us in our mission to keep the timeless art of Hindustani Classical Music
              alive, accessible, and thriving for generations to come.&rdquo;
            </p>
            <p className="text-gold/60 text-sm mt-4 font-cinzel"> -  Sangit Shree Prakashan</p>
          </blockquote>
        </div>
      </div>

      {/* ── CTA Banner ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-crimson-700 via-crimson to-crimson-700 py-16 px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-cream mb-3">
          Explore Our Full Catalog
        </h2>
        <p className="text-cream/70 mb-8 max-w-xl mx-auto">
          20+ books covering every aspect of Hindustani Classical Music - instrumental, vocal,
          raag theory, Kathak dance, and more.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/books"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold px-8 py-3.5 rounded-full transition-colors"
          >
            Browse Books <ArrowRight size={16} />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-cream/30 hover:border-cream text-cream font-cinzel px-8 py-3.5 rounded-full transition-colors text-sm"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
