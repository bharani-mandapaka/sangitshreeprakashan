'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

export default function ResetPasswordPage() {
  const router = useRouter();
  const user            = useAuthStore((s) => s.user);
  const authLoading     = useAuthStore((s) => s.loading);
  const updatePassword  = useAuthStore((s) => s.updatePassword);

  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword]  = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error: err } = await updatePassword(password);
    setLoading(false);
    if (err) setError(err);
    else setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-dark pt-20 lg:pt-24 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md text-center gold-border rounded-2xl p-8 bg-[#0A0000]">
          <CheckCircle size={40} className="text-gold mx-auto mb-4" />
          <h1 className="font-cinzel text-2xl font-bold text-cream mb-2">Password Updated</h1>
          <p className="text-cream/60 text-sm leading-relaxed mb-6">
            Your password has been changed and you&apos;re signed in.
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Go to My Account
          </button>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark pt-20 lg:pt-24 flex items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={28} />
      </div>
    );
  }

  // No session — either the reset link is invalid/expired, or someone landed
  // here directly without going through the email link.
  if (!user) {
    return (
      <div className="min-h-screen bg-dark pt-20 lg:pt-24 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md text-center gold-border rounded-2xl p-8 bg-[#0A0000]">
          <h1 className="font-cinzel text-2xl font-bold text-cream mb-2">Link Expired</h1>
          <p className="text-cream/60 text-sm leading-relaxed mb-6">
            This password reset link is invalid or has expired. Request a new one below.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Request New Link
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
          <h1 className="font-cinzel text-3xl font-bold text-cream">Set New Password</h1>
        </div>

        <div className="gold-border rounded-2xl p-6 sm:p-8 bg-[#0A0000]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                New Password
              </label>
              <input
                className="input-gold"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                Confirm New Password
              </label>
              <input
                className="input-gold"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Update Password <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
