import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
import { CONTACT } from '@/lib/utils';

const categories = [
  { href: '/books?category=instrumental', label: 'Instrumental Music' },
  { href: '/books?category=vocal',        label: 'Vocal Music' },
  { href: '/books?category=raag-theory',  label: 'Raag Theory' },
  { href: '/books?category=kathak',       label: 'Kathak Dance' },
  { href: '/books?category=bundle',       label: 'Bundle Sets' },
];

const quickLinks = [
  { href: '/',        label: 'Home' },
  { href: '/books',   label: 'All Books' },
  { href: '/about',   label: 'About Us' },
  { href: '/contact', label: 'Contact' },
];

export default function Footer() {
  return (
    <footer className="bg-[#050000] border-t border-gold/10 mt-auto">
      {/* Top decorative line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="relative w-12 h-12">
                <Image src="/logo.png" alt="SSP Logo" fill className="object-contain" />
              </div>
              <div>
                <p className="font-cinzel text-gold font-bold text-sm">Sangit Shree Prakashan</p>
                <p className="font-devanagari text-cream/40 text-xs">संगीत श्री प्रकाशन</p>
              </div>
            </Link>
            <p className="text-cream/50 text-sm leading-relaxed">
              Publisher and distributor of Hindustani Classical Music books since decades. Serving students, teachers, and artists across India.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-cinzel text-gold font-semibold text-sm uppercase tracking-widest mb-4">
              Categories
            </h4>
            <ul className="space-y-2.5">
              {categories.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="text-cream/55 hover:text-gold text-sm transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gold/30 group-hover:bg-gold transition-colors" />
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-cinzel text-gold font-semibold text-sm uppercase tracking-widest mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-cream/55 hover:text-gold text-sm transition-colors flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gold/30 group-hover:bg-gold transition-colors" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-cinzel text-gold font-semibold text-sm uppercase tracking-widest mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-cream/55 text-sm">
                <MapPin size={15} className="text-gold/60 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">
                  Shop No. 116, Nagar Nigam Market,<br />
                  Vikas Nagar, Kanpur – 208002, UP
                </span>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT.phone1Raw}`}
                  className="flex items-center gap-2.5 text-cream/55 hover:text-gold text-sm transition-colors"
                >
                  <Phone size={15} className="text-gold/60" />
                  {CONTACT.phone1}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT.phone2Raw}`}
                  className="flex items-center gap-2.5 text-cream/55 hover:text-gold text-sm transition-colors"
                >
                  <Phone size={15} className="text-gold/60" />
                  {CONTACT.phone2}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT.email1}`}
                  className="flex items-center gap-2.5 text-cream/55 hover:text-gold text-sm transition-colors"
                >
                  <Mail size={15} className="text-gold/60" />
                  {CONTACT.email1}
                </a>
              </li>
              <li>
                <a
                  href="https://sangitshreeprakashan.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-cream/55 hover:text-gold text-sm transition-colors"
                >
                  <ExternalLink size={15} className="text-gold/60" />
                  sangitshreeprakashan.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gold/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-cream/30 text-xs">
            © {new Date().getFullYear()} Sangit Shree Prakashan. All rights reserved.
          </p>
          <p className="text-cream/20 text-xs">
            Publisher of Hindustani Classical Music Books · Kanpur, India
          </p>
        </div>
      </div>
    </footer>
  );
}
