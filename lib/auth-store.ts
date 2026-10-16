'use client';

import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

interface AuthStore {
  user: User | null;
  // True until the initial session check (getSession) resolves — lets pages
  // avoid flashing a "logged out" state before we actually know.
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  // Mock OTP flow: the API returns the code itself (no real SMS provider yet)
  // so the UI can display it directly instead of waiting for a text message.
  sendPhoneOtp: (phone: string) => Promise<{ otp: string | null; error: string | null }>;
  verifyPhoneOtp: (
    phone: string,
    otp: string,
    mode: 'login' | 'signup',
    name?: string,
    email?: string,
  ) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  sendPhoneOtp: async (phone) => {
    try {
      const res = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const body = await res.json();
      if (!res.ok) return { otp: null, error: body.error ?? 'Failed to send code.' };
      return { otp: body.otp as string, error: null };
    } catch {
      return { otp: null, error: 'Could not reach the server. Try again.' };
    }
  },

  verifyPhoneOtp: async (phone, otp, mode, name, email) => {
    try {
      const res = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, mode, name, email }),
      });
      const body = await res.json();
      if (!res.ok) return { error: body.error ?? 'Verification failed.' };

      // Hand the session from the server to the browser's Supabase client so
      // the rest of the app (AuthListener, etc.) picks it up normally.
      const { error } = await getSupabase().auth.setSession({
        access_token: body.access_token,
        refresh_token: body.refresh_token,
      });
      return { error: error?.message ?? null };
    } catch {
      return { error: 'Could not reach the server. Try again.' };
    }
  },

  signInWithGoogle: async () => {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/profile` },
    });
    return { error: error?.message ?? null };
  },

  signOut: async () => {
    await getSupabase().auth.signOut();
    set({ user: null });
  },
}));
