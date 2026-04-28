'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, Lock, CreditCard, Smartphone, Building2, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useOrdersStore } from '@/lib/orders-store';
import { useAnalyticsStore } from '@/lib/analytics-store';
import { formatPrice, generateOrderId } from '@/lib/utils';
import BookCover from '@/components/BookCover';

type PayMethod = 'upi' | 'card' | 'netbanking';
type CheckoutStep = 'details' | 'payment' | 'processing' | 'success';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const addOrder     = useOrdersStore((s) => s.addOrder);
  const trackCartAdd = useAnalyticsStore((s) => s.trackCartAdd);

  const [step,      setStep]      = useState<CheckoutStep>('details');
  const [method,    setMethod]    = useState<PayMethod>('upi');
  const [upiId,     setUpiId]     = useState('');
  const [orderId,   setOrderId]   = useState('');

  // Shipping form
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
  });

  const shipping = 0;   // Free shipping for now
  const total    = subtotal() + shipping;

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('payment');
  };

  const handlePay = async () => {
    setStep('processing');
    const id        = generateOrderId();
    const createdAt = new Date().toISOString();
    setOrderId(id);

    const orderPayload = {
      id,
      createdAt,
      customer: { name: form.name, email: form.email, phone: form.phone },
      billingAddress: {
        line1:   form.address,
        city:    form.city,
        state:   form.state,
        pincode: form.pincode,
      },
      items: items.map(({ book, quantity }) => ({
        bookId:       book.id,
        sku:          `SSP-${book.id.toUpperCase().slice(0, 6)}`,
        titleEnglish: book.titleEnglish,
        titleHindi:   book.titleHindi,
        qty:          quantity,
        price:        book.price,
      })),
      subtotal: subtotal(),
      paymentMethod: method,
    };

    // Run API call + minimum spinner delay in parallel
    await Promise.all([
      // Save to Supabase + send confirmation email
      fetch('/api/orders/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(orderPayload),
      }).catch((err) => console.error('[checkout] API error:', err)),

      // Minimum 2.8 s processing UX
      new Promise((resolve) => setTimeout(resolve, 2800)),
    ]);

    // Also keep local store in sync (used by dashboard analytics)
    addOrder({ ...orderPayload, status: 'confirmed' });
    trackCartAdd();
    clearCart();
    setStep('success');
  };

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen bg-dark pt-24 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-cinzel text-cream/40 text-xl mb-4">Your cart is empty</p>
          <Link href="/books" className="text-gold hover:underline font-cinzel text-sm">
            Browse our books →
          </Link>
        </div>
      </div>
    );
  }

  // ── SUCCESS ──────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-dark pt-24 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-400 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="text-green-400" size={48} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="font-cinzel text-3xl font-bold text-cream mb-2">Order Confirmed!</h1>
            <p className="font-devanagari text-gold/70 text-lg mb-4">आपका ऑर्डर सफलतापूर्वक प्राप्त हुआ</p>
            <div className="bg-[#0A0000] border border-gold/15 rounded-2xl p-6 mb-6 text-left space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-cream/50">Order ID</span>
                <span className="font-cinzel text-gold font-bold">{orderId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cream/50">Amount Paid</span>
                <span className="font-cinzel text-cream font-semibold">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cream/50">Status</span>
                <span className="text-green-400 font-semibold">Payment Successful</span>
              </div>
            </div>
            <p className="text-cream/50 text-sm mb-6">
              A confirmation has been sent to <span className="text-gold">{form.email || 'your email'}</span>.<br />
              Your books will be dispatched within 2–4 business days.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/books"
                className="block w-full text-center bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold py-3.5 rounded-xl transition-colors"
              >
                Continue Shopping
              </Link>
              <Link
                href="/"
                className="block w-full text-center border border-gold/20 text-cream/60 hover:text-cream font-cinzel py-3 rounded-xl transition-colors text-sm"
              >
                Go to Home
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── PROCESSING ───────────────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-dark pt-24 flex items-center justify-center px-4">
        <div className="text-center">
          {/* Razorpay-like spinner */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 rounded-full border-4 border-gold/20 border-t-gold"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock size={22} className="text-gold" />
            </div>
          </div>
          <h2 className="font-cinzel text-cream text-xl font-bold mb-2">Processing Payment</h2>
          <p className="text-cream/40 text-sm">Please do not close this window…</p>
          <motion.div
            className="mt-6 flex justify-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                className="w-2 h-2 rounded-full bg-gold"
              />
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark pt-20 lg:pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back */}
        <Link
          href="/books"
          className="inline-flex items-center gap-2 text-cream/40 hover:text-gold text-sm transition-colors mb-8 font-cinzel"
        >
          <ArrowLeft size={15} /> Continue Shopping
        </Link>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-10">
          {['Details', 'Payment'].map((s, i) => {
            const active = (s === 'Details' && step === 'details') || (s === 'Payment' && step === 'payment');
            const done   = (s === 'Details' && step === 'payment');
            return (
              <div key={s} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 text-sm font-cinzel ${active ? 'text-gold' : done ? 'text-green-400' : 'text-cream/30'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'bg-gold text-dark' : done ? 'bg-green-500 text-white' : 'bg-white/5 text-cream/30'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  {s}
                </div>
                {i === 0 && <ChevronRight size={14} className="text-cream/20" />}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {step === 'details' && (
                <motion.form
                  key="details"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleDetailsSubmit}
                  className="space-y-5"
                >
                  <h2 className="font-cinzel text-cream text-xl font-bold mb-6">Shipping Details</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">Full Name *</label>
                      <input className="input-gold" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">Email *</label>
                      <input className="input-gold" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">Phone *</label>
                    <input className="input-gold" type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 99999 99999" />
                  </div>

                  <div>
                    <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">Address *</label>
                    <textarea className="input-gold h-20 resize-none" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House/Flat No., Street, Area" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">City *</label>
                      <input className="input-gold" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
                    </div>
                    <div>
                      <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">State *</label>
                      <input className="input-gold" required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" />
                    </div>
                    <div>
                      <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">PIN Code *</label>
                      <input className="input-gold" required value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="110001" maxLength={6} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold py-4 rounded-xl transition-colors text-base mt-2"
                  >
                    Continue to Payment
                  </button>
                </motion.form>
              )}

              {step === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* ── Mock Razorpay UI ─────────────────────────────────── */}
                  <div className="rounded-2xl overflow-hidden border border-[#0A2D5C]/60 shadow-2xl">
                    {/* Razorpay header */}
                    <div className="bg-[#072654] px-6 py-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          {/* Razorpay logo text */}
                          <svg viewBox="0 0 100 20" className="h-5 w-auto" fill="none">
                            <text x="0" y="16" fontFamily="sans-serif" fontWeight="bold" fontSize="16" fill="#02BBD9">Razorpay</text>
                          </svg>
                        </div>
                        <p className="text-white/50 text-xs">Sangit Shree Prakashan</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white text-lg">{formatPrice(total)}</p>
                        <p className="text-white/40 text-xs">{form.name}</p>
                      </div>
                    </div>

                    {/* Payment method tabs */}
                    <div className="bg-white flex border-b border-gray-200">
                      {([
                        { id: 'upi',        label: 'UPI',         icon: <Smartphone size={14} /> },
                        { id: 'card',       label: 'Card',        icon: <CreditCard size={14} /> },
                        { id: 'netbanking', label: 'Net Banking', icon: <Building2 size={14} /> },
                      ] as { id: PayMethod; label: string; icon: React.ReactNode }[]).map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setMethod(m.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2 ${
                            method === m.id
                              ? 'border-[#072654] text-[#072654] bg-blue-50/50'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {m.icon} {m.label}
                        </button>
                      ))}
                    </div>

                    {/* Payment form body */}
                    <div className="bg-white p-6 min-h-[260px]">
                      <AnimatePresence mode="wait">
                        {method === 'upi' && (
                          <motion.div key="upi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                            <p className="text-gray-600 text-sm font-semibold">Pay using UPI</p>
                            {/* Fake QR */}
                            <div className="flex items-start gap-6">
                              <div className="border-2 border-gray-200 rounded-lg p-2 flex-shrink-0">
                                <svg viewBox="0 0 80 80" className="w-20 h-20">
                                  {[...Array(8)].map((_, r) =>
                                    [...Array(8)].map((_, c) => {
                                      const filled = (r + c + r * c) % 3 !== 1;
                                      return filled ? (
                                        <rect key={`${r}-${c}`} x={c * 10} y={r * 10} width="9" height="9" fill="#1a1a1a" />
                                      ) : null;
                                    })
                                  )}
                                </svg>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs mb-2">Scan with any UPI app</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                                    <span key={app} className="border border-gray-200 rounded px-2 py-0.5 text-[10px] text-gray-600">{app}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="relative">
                              <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200" />
                              <span className="relative bg-white px-3 text-gray-400 text-xs block w-max mx-auto">or enter UPI ID</span>
                            </div>
                            <input
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value)}
                              placeholder="yourname@upi"
                              className="w-full border border-gray-300 focus:border-[#072654] outline-none rounded-lg px-3 py-2.5 text-sm text-gray-800 transition-colors"
                            />
                          </motion.div>
                        )}

                        {method === 'card' && (
                          <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                            <p className="text-gray-600 text-sm font-semibold">Pay using Debit / Credit Card</p>
                            <input placeholder="Card Number" maxLength={19} className="w-full border border-gray-300 focus:border-[#072654] outline-none rounded-lg px-3 py-2.5 text-sm text-gray-800 transition-colors" />
                            <div className="grid grid-cols-2 gap-3">
                              <input placeholder="MM / YY" maxLength={5} className="w-full border border-gray-300 focus:border-[#072654] outline-none rounded-lg px-3 py-2.5 text-sm text-gray-800 transition-colors" />
                              <input placeholder="CVV" maxLength={3} type="password" className="w-full border border-gray-300 focus:border-[#072654] outline-none rounded-lg px-3 py-2.5 text-sm text-gray-800 transition-colors" />
                            </div>
                            <input placeholder="Name on Card" className="w-full border border-gray-300 focus:border-[#072654] outline-none rounded-lg px-3 py-2.5 text-sm text-gray-800 transition-colors" />
                            {/* Card logos */}
                            <div className="flex gap-2 items-center">
                              {['VISA', 'MC', 'RUPAY', 'AMEX'].map((c) => (
                                <span key={c} className="border border-gray-200 rounded px-2 py-0.5 text-[9px] font-bold text-gray-500">{c}</span>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {method === 'netbanking' && (
                          <motion.div key="nb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                            <p className="text-gray-600 text-sm font-semibold">Select your Bank</p>
                            <div className="grid grid-cols-3 gap-2">
                              {['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'Other'].map((bank) => (
                                <button key={bank} className="border border-gray-200 hover:border-[#072654] rounded-lg py-2.5 text-xs text-gray-600 hover:text-[#072654] transition-colors font-medium">
                                  {bank}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Pay button */}
                    <div className="bg-white px-6 pb-6 pt-2">
                      <button
                        onClick={handlePay}
                        className="w-full bg-[#072654] hover:bg-[#0a3875] text-white font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Lock size={14} />
                        Pay {formatPrice(total)} Securely
                      </button>
                      <p className="text-gray-400 text-[10px] text-center mt-2 flex items-center justify-center gap-1">
                        <Lock size={9} /> Secured by Razorpay · 256-bit SSL
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('details')}
                    className="mt-4 text-cream/40 hover:text-cream text-sm flex items-center gap-1.5 transition-colors font-cinzel"
                  >
                    <ArrowLeft size={13} /> Edit shipping details
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-[#0A0000] border border-gold/10 rounded-2xl p-5 sticky top-28">
              <h3 className="font-cinzel text-cream font-semibold text-sm uppercase tracking-widest mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map(({ book, quantity }) => (
                  <div key={book.id} className="flex items-center gap-3">
                    <div className="w-10 h-14 flex-shrink-0 rounded-md overflow-hidden">
                      <BookCover
                        titleEnglish={book.titleEnglish}
                        titleHindi={book.titleHindi}
                        category={book.category}
                        part={book.part}
                        series={book.series}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-cream text-xs font-cinzel line-clamp-2 leading-snug">
                        {book.titleEnglish}
                      </p>
                      <p className="text-cream/40 text-[10px]">Qty: {quantity}</p>
                    </div>
                    <p className="text-gold text-sm font-cinzel font-bold flex-shrink-0">
                      {formatPrice(book.price * quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="divider-gold my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-cream/60">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal())}</span>
                </div>
                <div className="flex justify-between text-cream/60">
                  <span>Shipping</span>
                  <span className="text-green-400 font-semibold">Free</span>
                </div>
              </div>

              <div className="divider-gold my-4" />

              <div className="flex justify-between items-baseline">
                <span className="font-cinzel text-cream font-semibold">Total</span>
                <span className="font-cinzel text-gold font-bold text-2xl">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
