'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.4-4.3 5.8l6.2 5.2C40.5 35.9 44 30.6 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

type Step = 'phone' | 'otp';
type Mode = 'login' | 'signup';

export default function PhoneAuthForm({ mode, next }: { mode: Mode; next: string }) {
  const router = useRouter();

  const user             = useAuthStore((s) => s.user);
  const authLoading      = useAuthStore((s) => s.loading);
  const sendPhoneOtp     = useAuthStore((s) => s.sendPhoneOtp);
  const verifyPhoneOtp   = useAuthStore((s) => s.verifyPhoneOtp);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  const [step,   setStep]   = useState<Step>('phone');
  const [phone,  setPhone]  = useState('');
  const [otp,    setOtp]    = useState('');
  const [name,   setName]   = useState('');
  const [email,  setEmail]  = useState('');
  const [mockOtp, setMockOtp] = useState('');
  const [error,   setError]   = useState('');
  const [sending,  setSending]  = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Already signed in — bounce straight to wherever they were headed.
  useEffect(() => {
    if (!authLoading && user) router.replace(next);
  }, [authLoading, user, router, next]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    const { otp: code, error: err } = await sendPhoneOtp(phone);
    setSending(false);
    if (err) {
      setError(err);
      return;
    }
    setMockOtp(code ?? '');
    setStep('otp');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifying(true);
    const { error: err } = await verifyPhoneOtp(phone, otp, mode, name, email);
    setVerifying(false);
    if (err) setError(err);
    else router.push(next);
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    const { error: err } = await signInWithGoogle();
    // On success Supabase redirects the browser away immediately, so there's
    // nothing to reset here — only handle the failure path.
    if (err) {
      setError(err);
      setGoogleLoading(false);
    }
  };

  const nextParam = next && next !== '/profile' ? `?next=${encodeURIComponent(next)}` : '';

  return (
    <div className="min-h-screen bg-dark pt-20 lg:pt-24 flex items-center justify-center px-4 pb-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">
            {mode === 'login' ? 'Welcome Back' : 'Join Us'}
          </p>
          <h1 className="font-cinzel text-3xl font-bold text-cream">
            {mode === 'login' ? 'Login' : 'Create Account'}
          </h1>
        </div>

        <div className="gold-border rounded-2xl p-6 sm:p-8 bg-[#0A0000]">
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 border border-gold/25 hover:border-gold/50 text-cream/80 hover:text-cream font-cinzel text-sm py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gold/10" />
            <span className="text-cream/30 text-xs font-cinzel uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-gold/10" />
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                  Phone Number
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-gold/30 bg-white/[0.03] focus-within:border-gold focus-within:shadow-[0_0_0_3px_rgba(201,162,39,0.15)] transition-colors">
                  <span className="pl-4 py-2.5 text-cream/50 flex-shrink-0">+91</span>
                  <input
                    className="min-w-0 flex-1 bg-transparent border-0 py-2.5 pr-4 text-cream placeholder:text-cream/35 focus:outline-none"
                    type="tel"
                    inputMode="numeric"
                    placeholder="98765 43210"
                    required
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-xs font-cinzel bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <>Send OTP <ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="flex items-center gap-1.5 text-cream/40 hover:text-cream text-xs font-cinzel transition-colors"
              >
                <ArrowLeft size={12} /> +91 {phone}
              </button>

              {mockOtp && (
                <p className="text-gold/80 text-xs font-cinzel bg-gold/5 border border-gold/20 rounded-lg px-3 py-2">
                  Demo mode — no SMS provider is connected yet, so here&apos;s your code: <span className="font-bold">{mockOtp}</span>
                </p>
              )}

              <div>
                <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                  Verification Code
                </label>
                <input
                  className="input-gold tracking-[0.5em] text-center"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                      Full Name
                    </label>
                    <input
                      className="input-gold"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                      Email <span className="normal-case text-cream/30">(optional — for order updates)</span>
                    </label>
                    <input
                      className="input-gold"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </>
              )}

              {error && (
                <p className="text-red-400 text-xs font-cinzel bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={verifying || otp.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {verifying ? <Loader2 size={16} className="animate-spin" /> : <>Verify & Continue <ArrowRight size={16} /></>}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-cream/40 text-sm mt-6 font-cinzel">
          {mode === 'login' ? (
            <>New here?{' '}
              <Link href={`/signup${nextParam}`} className="text-gold hover:text-gold-300 transition-colors">
                Sign up
              </Link>
            </>
          ) : (
            <>Already have an account?{' '}
              <Link href={`/login${nextParam}`} className="text-gold hover:text-gold-300 transition-colors">
                Login
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
