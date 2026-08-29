'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

export default function ForgotPasswordPage() {
  const requestPasswordReset = useAuthStore((s) => s.requestPasswordReset);

  const [email, setEmail]   = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await requestPasswordReset(email);
    setLoading(false);
    // Show the "check your email" state either way — not confirming whether
    // an account exists for this address avoids leaking which emails are
    // registered.
    if (err) setError(err);
    else setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-dark pt-20 lg:pt-24 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md text-center gold-border rounded-2xl p-8 bg-[#0A0000]">
          <Mail size={40} className="text-gold mx-auto mb-4" />
          <h1 className="font-cinzel text-2xl font-bold text-cream mb-2">Check Your Email</h1>
          <p className="text-cream/60 text-sm leading-relaxed">
            If an account exists for <span className="text-gold">{email}</span>, we&apos;ve sent a
            link to reset your password. Click it to choose a new one.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 mt-6 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark pt-20 lg:pt-24 flex items-center justify-center px-4 pb-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">Account Recovery</p>
          <h1 className="font-cinzel text-3xl font-bold text-cream">Reset Password</h1>
          <p className="text-cream/50 text-sm mt-3">
            Enter the email on your account and we&apos;ll send you a link to set a new password.
          </p>
        </div>

        <div className="gold-border rounded-2xl p-6 sm:p-8 bg-[#0A0000]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                Email
              </label>
              <input
                className="input-gold"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs font-cinzel bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-cream/40 hover:text-gold text-sm mt-6 font-cinzel transition-colors"
        >
          <ArrowLeft size={14} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
