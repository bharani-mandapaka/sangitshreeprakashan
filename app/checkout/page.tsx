'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, Lock, ChevronRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useOrdersStore } from '@/lib/orders-store';
import { useAnalyticsStore } from '@/lib/analytics-store';
import { useAuthStore } from '@/lib/auth-store';
import { getSupabase } from '@/lib/supabase';
import { formatPrice, generateOrderId } from '@/lib/utils';
import { validateCheckoutDetails, type CheckoutErrors } from '@/lib/checkout-validation';
import { statesMatch, PINCODE_FORMAT } from '@/lib/pincode';
import { useAddressesStore } from '@/lib/addresses-store';
import { sameAddress, MAX_SAVED_ADDRESSES, type SavedAddress } from '@/lib/addresses';
import BookCoverImage from '@/components/BookCoverImage';
import CartStockNotice from '@/components/CartStockNotice';
import { useCartStock } from '@/lib/use-cart-stock';

type CheckoutStep = 'details' | 'payment' | 'success';

// Minimal shape of Razorpay's checkout.js global — just what this page uses.
// See lib/razorpay.ts for the server-side half of this integration.
interface RazorpayFailureResponse {
  error: { description?: string; reason?: string };
}
interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', handler: (response: RazorpayFailureResponse) => void) => void;
}
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal: { ondismiss: () => void };
}
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

// What we know about the PIN code typed so far (see /api/pincode, lib/pincode.ts).
// "unknown" means the lookup service didn't answer — that never blocks checkout.
interface PinInfo {
  code: string;
  status: 'checking' | 'valid' | 'invalid' | 'unknown';
  state?: string;
  states?: string[];
  districts?: string[];
}
const pinCache = new Map<string, PinInfo>();

// A PIN straddling a state border lists several states — any of them is fine.
// A PIN with no state in the official list (~100 of them) is never held against the customer.
const pinStateMatches = (entered: string, pin: PinInfo) =>
  !pin.states?.length || pin.states.some((s) => statesMatch(entered, s));

async function lookupPin(code: string): Promise<PinInfo> {
  const cached = pinCache.get(code);
  if (cached) return cached;
  try {
    const res  = await fetch(`/api/pincode?code=${code}`);
    const data = await res.json();
    const info: PinInfo =
      data.status === 'valid'   ? { code, status: 'valid', state: data.state, states: data.states ?? [], districts: data.districts } :
      data.status === 'invalid' ? { code, status: 'invalid' } :
                                  { code, status: 'unknown' };
    if (info.status !== 'unknown') pinCache.set(code, info);
    return info;
  } catch {
    return { code, status: 'unknown' };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  // Books in the cart that sold out (or have fewer copies than asked for) since they were added.
  const { issues: stockIssues, hasIssues: hasStockIssues } = useCartStock();
  const addOrder     = useOrdersStore((s) => s.addOrder);
  const trackCartAdd = useAnalyticsStore((s) => s.trackCartAdd);
  const user          = useAuthStore((s) => s.user);

  const [step,      setStep]      = useState<CheckoutStep>('details');
  const [orderId,   setOrderId]   = useState('');
  const [paying,       setPaying]       = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Shipping form — pre-filled from the account when signed in, still editable
  // and still usable as a guest (no account required to check out).
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '',
  });
  const [fieldErrors, setFieldErrors] = useState<CheckoutErrors>({});
  const [pinInfo, setPinInfo]           = useState<PinInfo | null>(null);
  const [pinConfirmed, setPinConfirmed] = useState(false);

  // Saved addresses (signed-in customers only — see lib/addresses-store.ts).
  const savedAddresses  = useAddressesStore((s) => s.addresses);
  const addressesLoaded = useAddressesStore((s) => s.loaded);
  const addAddress      = useAddressesStore((s) => s.add);
  const [saveAddress, setSaveAddress]   = useState(true);
  const [addressLabel, setAddressLabel] = useState('');
  // Set when a saved address is applied, so the PIN lookup that follows doesn't
  // overwrite the city/state the customer saved (the lookup uses district names).
  const skipAutofillFor = useRef<string | null>(null);
  const prefilledDefault = useRef(false);
  const formRef = useRef(form);
  formRef.current = form;

  // Look the PIN code up as soon as all 6 digits are in; fill in an empty State field.
  useEffect(() => {
    const code = form.pincode;
    if (!PINCODE_FORMAT.test(code)) { setPinInfo(null); return; }
    let cancelled = false;
    setPinInfo({ code, status: 'checking' });
    lookupPin(code).then((info) => {
      if (cancelled) return;
      setPinInfo(info);
      if (skipAutofillFor.current === code) { skipAutofillFor.current = null; return; }
      // A new PIN moves State and City with it. A border PIN (several states) keeps the
      // customer's state if it is one of them; a PIN with no state on record leaves State alone.
      if (info.status === 'valid') {
        setForm((f) => {
          if (f.pincode !== code) return f;
          const states = info.states ?? [];
          const keepState = states.length > 1 && f.state.trim() !== '' && states.some((s) => statesMatch(f.state, s));
          const state = states.length === 0 || keepState ? f.state : states[0];
          const city  = info.districts?.[0] ?? f.city;
          return { ...f, state, city };
        });
      }
    });
    return () => { cancelled = true; };
  }, [form.pincode]);

  // Updating a field also clears that field's error message.
  const setField = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((errs) => (errs[key] ? { ...errs, [key]: undefined } : errs));
  };
  const fieldClass = (key: keyof typeof form) =>
    `input-gold${fieldErrors[key] ? ' !border-red-400/70' : ''}`;
  const fieldError = (key: keyof typeof form) =>
    fieldErrors[key] ? <p className="text-red-400 text-xs mt-1.5">{fieldErrors[key]}</p> : null;

  useEffect(() => {
    if (!user) return;
    // user.email is a real address for Google accounts, but an internal
    // synthetic one for phone accounts (see lib/phone-auth.ts) — never
    // pre-fill that. Phone accounts instead prefill their verified phone
    // number and, if they've added one, their optional real_email.
    const isPhoneAccount = !!user.user_metadata?.phone;
    const prefillEmail = isPhoneAccount
      ? (user.user_metadata?.real_email as string | undefined) ?? ''
      : user.email ?? '';
    setForm((f) => ({
      ...f,
      name:  f.name  || (user.user_metadata?.full_name as string | undefined) || '',
      email: f.email || prefillEmail,
      phone: f.phone || (user.user_metadata?.phone as string | undefined) || '',
    }));
  }, [user]);

  // Fill the whole delivery block from a saved address (name and phone come with it;
  // the email stays as is).
  const applyAddress = (a: SavedAddress) => {
    if (a.address_pincode !== formRef.current.pincode) skipAutofillFor.current = a.address_pincode;
    setForm((f) => ({
      ...f,
      name: a.full_name, phone: a.phone,
      address: a.address_line1, city: a.address_city, state: a.address_state, pincode: a.address_pincode,
    }));
    setFieldErrors({});
    setPinConfirmed(true); // it was accepted when the customer saved it
  };

  const startNewAddress = () => {
    setForm((f) => ({ ...f, address: '', city: '', state: '', pincode: '' }));
    setFieldErrors({});
    setPinConfirmed(false);
  };

  // A returning customer lands on checkout with their default address already in place.
  useEffect(() => {
    if (!addressesLoaded || prefilledDefault.current) return;
    prefilledDefault.current = true;
    const preferred = savedAddresses.find((a) => a.is_default) ?? savedAddresses[0];
    const f = formRef.current;
    if (preferred && !f.address.trim() && !f.pincode) applyAddress(preferred);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, when the addresses first arrive
  }, [addressesLoaded, savedAddresses]);

  const shipping = 0;   // Free shipping for now
  const total    = subtotal() + shipping;

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasStockIssues) return;   // the notice above the form says what to fix

    // Catch bad details (e.g. a 5-digit phone, a 2-digit PIN) before anyone
    // reaches payment — the server re-checks the same rules before charging.
    const { errors, clean } = validateCheckoutDetails(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const first = (['name', 'email', 'phone', 'address', 'city', 'state', 'pincode'] as const).find((k) => errors[k]);
      if (first) document.getElementById(`checkout-${first}`)?.focus();
      return;
    }

    // The PIN has the right shape — does it really exist, and is it in the state typed?
    const pin = await lookupPin(clean.pincode);
    setPinInfo(pin);
    if (pin.status === 'invalid' && !pinConfirmed) {
      setFieldErrors({ pincode: 'We couldn’t find this PIN code. Please check it, or tick “My PIN code is correct” below if you’re sure.' });
      document.getElementById('checkout-pincode')?.focus();
      return;
    }
    if (pin.status === 'valid' && !pinStateMatches(clean.state, pin)) {
      setFieldErrors({ state: `PIN code ${clean.pincode} belongs to ${(pin.states ?? []).join(' / ')}. Change the state, or check the PIN code.` });
      document.getElementById('checkout-state')?.focus();
      return;
    }
    setFieldErrors({});
    setForm(clean);

    // Keep the address for next time if the customer asked (fire and forget — a save
    // problem must never get in the way of paying; duplicates and the 5-address cap
    // are handled by the store).
    if (user && saveAddress) {
      void addAddress(user.id, {
        label: addressLabel.trim() || null,
        full_name: clean.name, phone: clean.phone,
        address_line1: clean.address, address_city: clean.city,
        address_state: clean.state, address_pincode: clean.pincode,
      });
    }
    setStep('payment');
    // Without this, the page keeps whatever scroll position the (often
    // long) shipping form left it at — after filling the form, that's
    // usually scrolled down near the bottom, so the payment step's heading
    // and summary render off-screen above the viewport and the customer
    // has to scroll up to see them.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Real Razorpay flow (razorpay-integration-user-stories.md):
  // create-order -> open widget -> verify -> only then save + notify.
  // Replaces the old mock flow that always saved the order regardless of any
  // "payment" outcome.
  const handlePay = async () => {
    if (!window.Razorpay) {
      setPaymentError('Payment couldn’t load. Please refresh the page and try again.');
      return;
    }

    setPaying(true);
    setPaymentError('');

    const id        = orderId || generateOrderId();
    const createdAt = new Date().toISOString();
    setOrderId(id);

    const itemsPayload = items.map(({ book, quantity }) => ({
      bookId:       book.id,
      sku:          `SSP-${book.id.toUpperCase().slice(0, 6)}`,
      titleEnglish: book.titleEnglish,
      titleHindi:   book.titleHindi,
      qty:          quantity,
      price:        book.price, // display only — both server routes recompute this from the books table
    }));

    const { data: { session } } = await getSupabase().auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

    // ── Story 1: start a real payment ─────────────────────────────────────────
    let createOrderRes: Response;
    try {
      createOrderRes = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          orderId: id,
          items: itemsPayload,
          customer: { name: form.name, email: form.email, phone: form.phone },
          billingAddress: { line1: form.address, city: form.city, state: form.state, pincode: form.pincode },
          pincodeConfirmed: pinConfirmed,
        }),
      });
    } catch {
      setPaymentError('Couldn’t reach the payment server. Please check your connection and try again.');
      setPaying(false);
      return;
    }
    const createOrderBody = await createOrderRes.json().catch(() => ({}));
    if (createOrderBody.fieldErrors) {
      // The server rejected the shipping details before any payment started —
      // send the customer back to fix them.
      setFieldErrors(createOrderBody.fieldErrors);
      setStep('details');
      setPaying(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!createOrderRes.ok) {
      setPaymentError(createOrderBody.error ?? 'Couldn’t start payment. Please try again.');
      setPaying(false);
      return;
    }

    const { razorpayOrderId, amount, currency, keyId } = createOrderBody;

    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      order_id: razorpayOrderId,
      name: 'Sangit Shree Prakashan',
      description: `Order ${id}`,
      prefill: { name: form.name, email: form.email, contact: form.phone },
      theme: { color: '#8B0000' },

      // ── Story 2: confirm the order only after verified payment ─────────────
      handler: async (response) => {
        try {
          const verifyRes = await fetch('/api/checkout/verify', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              id, createdAt,
              customer: { name: form.name, email: form.email, phone: form.phone },
              billingAddress: {
                line1: form.address, city: form.city, state: form.state, pincode: form.pincode,
              },
              items: itemsPayload,
              paymentMethod: 'razorpay',
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });
          const verifyBody = await verifyRes.json().catch(() => ({}));
          if (!verifyRes.ok) {
            setPaymentError(verifyBody.error ?? 'We couldn’t verify your payment. If you were charged, please contact support.');
            setPaying(false);
            return;
          }
          addOrder({
            id, createdAt,
            customer: { name: form.name, email: form.email, phone: form.phone },
            billingAddress: { line1: form.address, city: form.city, state: form.state, pincode: form.pincode },
            items: itemsPayload,
            subtotal: subtotal(),
            paymentMethod: 'razorpay',
            status: 'confirmed',
          });
          trackCartAdd();
          clearCart();
          setPaying(false);
          setStep('success');
        } catch {
          setPaymentError('We couldn’t verify your payment. If you were charged, please contact support.');
          setPaying(false);
        }
      },

      // ── Story 3: cancelled/abandoned — back to checkout, cart intact ────────
      modal: {
        ondismiss: () => {
          setPaying(false);
        },
      },
    });

    // ── Story 3: Razorpay-reported failure (declined card, etc.) ────────────
    rzp.on('payment.failed', (response) => {
      setPaymentError(response.error?.description || 'Payment failed. Please try again.');
      setPaying(false);
    });

    rzp.open();
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

  return (
    <div className="min-h-screen bg-dark pt-20 lg:pt-24">
      {/* Razorpay's own checkout widget — loaded once, opened from handlePay() */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10">
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

                  <CartStockNotice issues={stockIssues} />

                  {/* Returning customers: pick a saved address instead of retyping it. */}
                  {user && savedAddresses.length > 0 && (
                    <div>
                      <p className="text-cream/50 text-xs uppercase tracking-widest mb-2 font-cinzel">Your saved addresses</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedAddresses.map((a) => {
                          const selected = sameAddress({ address_line1: form.address, address_pincode: form.pincode }, a);
                          return (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => applyAddress(a)}
                              className={`text-left rounded-xl border p-3 transition-colors ${selected ? 'border-gold bg-gold/10' : 'border-gold/15 hover:border-gold/40'}`}
                            >
                              <span className="flex items-center justify-between gap-2">
                                <span className="font-cinzel text-gold text-xs font-bold">{a.label || 'Address'}</span>
                                {a.is_default && <span className="text-[10px] uppercase tracking-widest text-cream/50 border border-gold/20 rounded-full px-2 py-0.5">Default</span>}
                              </span>
                              <span className="block text-cream/85 text-sm mt-1">{a.full_name}</span>
                              <span className="block text-cream/55 text-xs mt-0.5">{a.address_line1}, {a.address_city}, {a.address_state} – {a.address_pincode}</span>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={startNewAddress}
                          className="rounded-xl border border-dashed border-gold/25 hover:border-gold/60 p-3 text-gold/80 hover:text-gold text-sm font-cinzel transition-colors"
                        >
                          + Use a new address
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">Full Name *</label>
                      <input id="checkout-name" className={fieldClass('name')} required autoComplete="name" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Your full name" />
                      {fieldError('name')}
                    </div>
                    <div>
                      <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">Email *</label>
                      <input id="checkout-email" className={fieldClass('email')} type="email" required autoComplete="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="you@email.com" />
                      {fieldError('email')}
                    </div>
                  </div>

                  <div>
                    <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">Phone *</label>
                    <input id="checkout-phone" className={fieldClass('phone')} type="tel" inputMode="tel" required autoComplete="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+91 99999 99999" />
                    {fieldError('phone')}
                  </div>

                  <div>
                    <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">PIN Code *</label>
                    <input id="checkout-pincode" className={fieldClass('pincode')} required inputMode="numeric" autoComplete="postal-code" value={form.pincode} onChange={(e) => { setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6)); setPinConfirmed(false); }} placeholder="e.g. 208001" maxLength={6} />
                    {fieldError('pincode')}
                    {!pinInfo && !fieldErrors.pincode && (
                      <p className="text-cream/35 text-xs mt-1.5">Enter your PIN code first — we’ll fill in your city and state.</p>
                    )}
                    {pinInfo?.status === 'checking' && !fieldErrors.pincode && (
                      <p className="text-cream/40 text-xs mt-1.5">Checking PIN code…</p>
                    )}
                    {pinInfo?.status === 'valid' && !fieldErrors.pincode && (
                      <p className="text-emerald-400/90 text-xs mt-1.5">✓ {[...(pinInfo.districts ?? []), ...(pinInfo.states ?? [])].join(', ') || 'PIN code found'}</p>
                    )}
                    {pinInfo?.status === 'invalid' && (
                      <div className="mt-1.5">
                        {!fieldErrors.pincode && (
                          <p className="text-amber-400 text-xs">We couldn’t find this PIN code. Please double-check it.</p>
                        )}
                        <label className="flex items-center gap-2 text-cream/60 text-xs mt-1.5 cursor-pointer">
                          <input type="checkbox" checked={pinConfirmed} onChange={(e) => setPinConfirmed(e.target.checked)} />
                          My PIN code is correct
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">City *</label>
                      <input id="checkout-city" className={fieldClass('city')} required autoComplete="address-level2" value={form.city} onChange={(e) => setField('city', e.target.value)} placeholder="City" />
                      {fieldError('city')}
                      {pinInfo?.status === 'valid' && (pinInfo.districts?.length ?? 0) > 1 && (
                        <p className="text-cream/40 text-xs mt-1.5">
                          Also in:{' '}
                          {(pinInfo.districts ?? [])
                            .filter((d) => d.toLowerCase() !== form.city.trim().toLowerCase())
                            .map((d) => (
                              <button key={d} type="button" onClick={() => setField('city', d)} className="underline text-gold hover:text-gold-300 mr-2">
                                {d}
                              </button>
                            ))}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">State *</label>
                      <input id="checkout-state" className={fieldClass('state')} required autoComplete="address-level1" value={form.state} onChange={(e) => setField('state', e.target.value)} placeholder="State" />
                      {fieldError('state')}
                      {pinInfo?.status === 'valid' && form.state.trim() && !pinStateMatches(form.state, pinInfo) && (
                        <p className="text-amber-400 text-xs mt-1.5">
                          PIN {pinInfo.code} is in {(pinInfo.states ?? []).join(' / ')}.{' '}
                          {(pinInfo.states ?? []).map((s) => (
                            <button key={s} type="button" onClick={() => setField('state', s)} className="underline text-gold hover:text-gold-300 mr-2">
                              Use {s}
                            </button>
                          ))}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">Address *</label>
                    <textarea id="checkout-address" className={`${fieldClass('address')} h-20 resize-none`} required autoComplete="street-address" value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="House/Flat No., Street, Area" />
                    {fieldError('address')}
                  </div>

                  {/* "Save address" (signed-in customers); guests get a nudge to sign in. */}
                  {user ? (() => {
                    const alreadySaved = savedAddresses.some((a) => sameAddress({ address_line1: form.address, address_pincode: form.pincode }, a));
                    if (alreadySaved) {
                      return <p className="text-emerald-400/90 text-xs">✓ This address is saved to your account.</p>;
                    }
                    if (savedAddresses.length >= MAX_SAVED_ADDRESSES) {
                      return <p className="text-cream/45 text-xs">You have {MAX_SAVED_ADDRESSES} saved addresses. Delete one in your <Link href="/profile" className="underline text-gold/80 hover:text-gold">profile</Link> to save this one.</p>;
                    }
                    return (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-cream/70 text-sm cursor-pointer">
                          <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                          Save address
                        </label>
                        {saveAddress && (
                          <input
                            className="input-gold"
                            value={addressLabel}
                            onChange={(e) => setAddressLabel(e.target.value.slice(0, 30))}
                            placeholder="Name this address (optional) — e.g. Home, Office"
                            maxLength={30}
                          />
                        )}
                      </div>
                    );
                  })() : (
                    <p className="text-cream/40 text-xs">
                      Want to save your address?{' '}
                      <Link href="/login?next=/checkout" className="underline text-gold/80 hover:text-gold">Sign in</Link>
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={hasStockIssues}
                    className="w-full bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold py-4 rounded-xl transition-colors text-base mt-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gold"
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
                  <div className="bg-[#0A0000] border border-gold/15 rounded-2xl p-6 sm:p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-5">
                      <ShieldCheck size={28} className="text-gold" />
                    </div>
                    <h2 className="font-cinzel text-cream text-xl font-bold mb-2">Ready to Pay</h2>
                    <p className="text-cream/50 text-sm mb-6">
                      You&apos;ll be taken to Razorpay&apos;s secure checkout to pay by UPI, card, or net banking.
                      We never see or store your payment details.
                    </p>

                    {paymentError && (
                      <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-red-400 text-sm mb-5 text-left">
                        {paymentError}
                      </div>
                    )}

                    <button
                      onClick={handlePay}
                      disabled={paying}
                      className="w-full bg-[#072654] hover:bg-[#0a3875] text-white font-bold py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                    >
                      {paying ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Opening secure checkout…
                        </>
                      ) : (
                        <>
                          <Lock size={14} /> Pay {formatPrice(total)} Securely
                        </>
                      )}
                    </button>
                    <p className="text-cream/30 text-[10px] text-center mt-3 flex items-center justify-center gap-1">
                      <Lock size={9} /> Secured by Razorpay · 256-bit SSL
                    </p>
                  </div>

                  <button
                    onClick={() => { setStep('details'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    disabled={paying}
                    className="mt-4 text-cream/40 hover:text-cream text-sm flex items-center gap-1.5 transition-colors font-cinzel disabled:opacity-40"
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
                    <div className="relative w-10 h-14 flex-shrink-0 rounded-md overflow-hidden">
                      <BookCoverImage book={book} size="sm" sizes="40px" />
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
