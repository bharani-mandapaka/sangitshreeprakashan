import type { ReactNode } from 'react';
import Link from 'next/link';

export interface LegalSection {
  heading: string;
  body: ReactNode;
}

export const LEGAL_LAST_UPDATED = '15 October 2026';

export default function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">
          Sangit Shree Prakashan
        </p>
        <h1 className="font-cinzel text-gold-gradient text-3xl sm:text-4xl font-bold mb-3">{title}</h1>
        <p className="text-cream/40 text-xs mb-6">Last updated: {LEGAL_LAST_UPDATED}</p>
        <p className="text-cream/65 leading-relaxed mb-10">{intro}</p>

        <div className="space-y-9">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-cinzel text-cream text-lg font-semibold mb-3">{s.heading}</h2>
              <div className="text-cream/60 text-sm sm:text-base leading-relaxed space-y-3">{s.body}</div>
            </section>
          ))}
        </div>

        <div className="divider-gold my-12" />

        <p className="text-cream/45 text-sm">
          Questions? <Link href="/contact" className="text-gold hover:underline">Contact us</Link>.
        </p>
      </div>
    </main>
  );
}
