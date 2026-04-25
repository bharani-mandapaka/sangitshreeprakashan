'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, CheckCircle, Instagram, Facebook, Smartphone } from 'lucide-react';
import { WHATSAPP_URL, CONTACT } from '@/lib/utils';

const contactInfo = [
  {
    icon: <MapPin size={18} />,
    label: 'Address',
    value: 'Shop No. 116, Nagar Nigam Market, Vikas Nagar, Gurudev Zoo Rd.',
    subValue: 'In front of: Manorma Marriage Palace, Kanpur – 208002, UP',
  },
  {
    icon: <Phone size={18} />,
    label: 'Phone',
    value: CONTACT.phone1,
    href: `tel:${CONTACT.phone1Raw}`,
    subValue: CONTACT.phone2,
    subHref: `tel:${CONTACT.phone2Raw}`,
  },
  {
    icon: <Mail size={18} />,
    label: 'Email',
    value: CONTACT.email1,
    href: `mailto:${CONTACT.email1}`,
    subValue: CONTACT.email2,
    subHref: `mailto:${CONTACT.email2}`,
  },
  {
    icon: <Clock size={18} />,
    label: 'Hours',
    value: 'Mon – Sat, 10:00 AM – 6:00 PM IST',
  },
];

const socials = [
  { icon: <Instagram size={18} />, label: 'Instagram',   href: '#',  color: 'hover:text-pink-400' },
  { icon: <Facebook size={18} />,  label: 'Facebook',    href: '#',  color: 'hover:text-blue-400' },
  { icon: <Smartphone size={18} />,label: 'Android App', href: '#',  color: 'hover:text-green-400' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 800);
  };

  return (
    <div className="min-h-screen bg-dark pt-20 lg:pt-24">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-[#0F0000] to-dark py-16 px-4 sm:px-6 lg:px-8 border-b border-gold/10 text-center">
        <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">Get in Touch</p>
        <h1 className="font-cinzel text-4xl sm:text-5xl font-bold text-cream mb-3">Contact Us</h1>
        <p className="font-devanagari text-gold/60 text-xl">हमसे संपर्क करें</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* ── Left: Info ───────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Contact details */}
            <div>
              <h2 className="font-cinzel text-xl font-bold text-cream mb-6">Our Details</h2>
              <div className="space-y-5">
                {contactInfo.map((info) => (
                  <div key={info.label} className="flex items-start gap-3">
                    <span className="text-gold/70 mt-0.5 flex-shrink-0">{info.icon}</span>
                    <div>
                      <p className="text-cream/40 text-[10px] uppercase tracking-widest font-cinzel mb-0.5">
                        {info.label}
                      </p>
                      {info.href ? (
                        <a href={info.href} className="text-cream/80 hover:text-gold text-sm transition-colors block">
                          {info.value}
                        </a>
                      ) : (
                        <p className="text-cream/80 text-sm">{info.value}</p>
                      )}
                      {info.subValue && (
                        info.subHref ? (
                          <a href={info.subHref} className="text-cream/60 hover:text-gold text-sm transition-colors block mt-0.5">
                            {info.subValue}
                          </a>
                        ) : (
                          <p className="text-cream/60 text-sm mt-0.5">{info.subValue}</p>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider-gold" />

            {/* WhatsApp CTA */}
            <div className="gold-border rounded-2xl p-6 bg-[#0A0000]">
              <h3 className="font-cinzel text-cream font-semibold mb-2">Fastest via WhatsApp</h3>
              <p className="text-cream/50 text-sm leading-relaxed mb-4">
                For quick enquiries about books, pricing, or bulk orders - WhatsApp is the fastest
                way to reach us.
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-cinzel font-bold px-5 py-3 rounded-xl transition-colors w-full justify-center text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12.004 2C6.477 2 2 6.477 2 12.004c0 1.771.469 3.53 1.36 5.07L2.05 22l5.077-1.29A10.01 10.01 0 0012.004 22C17.527 22 22 17.523 22 12.004 22 6.477 17.527 2 12.004 2zm0 18.35a8.34 8.34 0 01-4.378-1.232l-.314-.187-3.012.765.793-2.93-.203-.328A8.347 8.347 0 013.65 12.004c0-4.607 3.748-8.355 8.354-8.355 4.607 0 8.355 3.748 8.355 8.355 0 4.607-3.748 8.35-8.355 8.35z" />
                </svg>
                Chat on WhatsApp
              </a>
            </div>

            <div className="divider-gold" />

            {/* Social links */}
            <div>
              <h3 className="font-cinzel text-cream font-semibold text-sm mb-4">Connect With Us</h3>
              <div className="flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    title={s.label}
                    className={`w-10 h-10 rounded-xl border border-gold/15 flex items-center justify-center text-cream/50 transition-colors ${s.color} hover:border-gold/30`}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Form ──────────────────────────────────────────────── */}
          <div className="lg:col-span-3">
            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-20 gap-4"
              >
                <CheckCircle size={56} className="text-green-400" />
                <h2 className="font-cinzel text-2xl font-bold text-cream">Message Sent!</h2>
                <p className="text-cream/60 max-w-xs text-sm leading-relaxed">
                  Thank you for reaching out. We&apos;ll get back to you within 1–2 business days
                  at <span className="text-gold">{form.email}</span>.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                  className="text-gold hover:underline text-sm font-cinzel mt-2"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-cinzel text-xl font-bold text-cream mb-6">Send us a Message</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                      Your Name *
                    </label>
                    <input
                      className="input-gold"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                      Email *
                    </label>
                    <input
                      className="input-gold"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                      Phone
                    </label>
                    <input
                      className="input-gold"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 99999 99999"
                    />
                  </div>
                  <div>
                    <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                      Subject *
                    </label>
                    <select
                      className="input-gold"
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    >
                      <option value="">Select a subject</option>
                      <option>Book Enquiry</option>
                      <option>Bulk / Institutional Order</option>
                      <option>Distributor / Reseller</option>
                      <option>Author / Publishing</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                    Message *
                  </label>
                  <textarea
                    className="input-gold h-36 resize-none"
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us how we can help…"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold hover:bg-gold-300 disabled:opacity-60 text-dark font-cinzel font-bold py-4 rounded-xl transition-colors text-base flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full inline-block"
                      />
                      Sending…
                    </>
                  ) : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Map placeholder ──────────────────────────────────────────────── */}
      <div className="border-t border-gold/10 bg-[#050000] py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <p className="font-cinzel text-gold/60 text-xs uppercase tracking-widest mb-4 text-center">Find Us</p>
          <div className="w-full h-64 rounded-2xl bg-[#0A0000] border border-gold/10 flex flex-col items-center justify-center gap-3 text-center">
            <MapPin size={32} className="text-gold/30" />
            <div>
              <p className="font-cinzel text-cream/60 text-sm font-semibold">Shop No. 116, Nagar Nigam Market</p>
              <p className="text-cream/40 text-xs mt-1">Vikas Nagar, Gurudev Zoo Rd., Kanpur – 208002, UP</p>
            </div>
            <a
              href="https://maps.google.com/?q=Nagar+Nigam+Market+Vikas+Nagar+Kanpur"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline text-xs font-cinzel mt-1"
            >
              Open in Google Maps →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
