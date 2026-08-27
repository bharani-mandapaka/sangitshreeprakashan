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
  signUpWithPassword: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  signUpWithPassword: async (email, password, name) => {
    const { error } = await getSupabase().auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    return { error: error?.message ?? null };
  },

  signInWithPassword: async (email, password) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
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
