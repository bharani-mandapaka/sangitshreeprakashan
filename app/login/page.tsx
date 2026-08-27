'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
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

export default function LoginPage() {
  const router = useRouter();
  const user               = useAuthStore((s) => s.user);
  const authLoading        = useAuthStore((s) => s.loading);
  const signInWithPassword = useAuthStore((s) => s.signInWithPassword);
  const signInWithGoogle   = useAuthStore((s) => s.signInWithGoogle);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Already signed in — bounce straight to the profile page.
  useEffect(() => {
    if (!authLoading && user) router.replace('/profile');
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signInWithPassword(email, password);
    setLoading(false);
    if (err) setError(err);
    else router.push('/profile');
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

  return (
    <div className="min-h-screen bg-dark pt-20 lg:pt-24 flex items-center justify-center px-4 pb-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-cinzel text-gold/70 text-xs uppercase tracking-[0.3em] mb-3">Welcome Back</p>
          <h1 className="font-cinzel text-3xl font-bold text-cream">Sign In</h1>
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

            <div>
              <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                Password
              </label>
              <input
                className="input-gold"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-cream/40 text-sm mt-6 font-cinzel">
          New here?{' '}
          <Link href="/signup" className="text-gold hover:text-gold-300 transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
