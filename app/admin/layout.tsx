'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, ShoppingBag, Bell, Users, LogOut, Menu, X, BookOpen,
} from 'lucide-react';

const NAV = [
  { href: '/admin',               icon: LayoutDashboard, label: 'Dashboard'     },
  { href: '/admin/orders',        icon: ShoppingBag,     label: 'Orders'        },
  { href: '/admin/books',         icon: BookOpen,        label: 'Catalog'       },
  { href: '/admin/notifications', icon: Bell,            label: 'Notifications' },
  { href: '/admin/users',         icon: Users,           label: 'Users'         },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname          = usePathname();
  const [authed, setAuthed] = useState(false);
  const [pw, setPw]         = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  // This flag is just UI state — whether to show the sidebar or the login
  // form. It carries no real authority: every admin API route checks its own
  // signed, httpOnly session cookie (see lib/admin-auth.ts) server-side, so
  // faking this in devtools doesn't grant access to any real data.
  useEffect(() => {
    setAuthed(localStorage.getItem('ssp-admin-auth') === '1');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        localStorage.setItem('ssp-admin-auth', '1');
        setAuthed(true);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Incorrect password.');
      }
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem('ssp-admin-auth');
    setAuthed(false);
  };

  /* ── Auth gate ──────────────────────────────────────────────────────────── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#040000] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="relative w-14 h-14 mx-auto mb-4">
              <Image src="/logo.png" alt="SSP" fill className="object-contain" />
            </div>
            <h1 className="font-cinzel text-gold font-bold text-xl">Admin Panel</h1>
            <p className="text-cream/40 text-xs mt-1 font-cinzel">Sangit Shree Prakashan</p>
          </div>
          <form onSubmit={handleLogin} className="bg-[#0A0000] border border-gold/15 rounded-2xl p-7 space-y-4">
            <div>
              <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1.5 font-cinzel">
                Password
              </label>
              <input
                type="password"
                className="input-gold"
                placeholder="Enter admin password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoFocus
              />
              {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Admin shell ────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#040000] flex">

      {/* Mobile overlay */}
      {sideOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-[#070000] border-r border-gold/10 z-40 flex flex-col transition-transform duration-300
          ${sideOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex`}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-gold/10 flex items-center gap-3">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image src="/logo.png" alt="SSP" fill className="object-contain" />
          </div>
          <div>
            <p className="font-cinzel text-gold text-xs font-bold leading-tight">Sangit Shree</p>
            <p className="font-cinzel text-cream/30 text-[10px]">Admin Panel</p>
          </div>
          <button onClick={() => setSideOpen(false)} className="ml-auto text-cream/30 lg:hidden">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSideOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-cinzel transition-all duration-200
                  ${active
                    ? 'bg-gold/15 text-gold border border-gold/20'
                    : 'text-cream/50 hover:text-cream hover:bg-white/5'
                  }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gold/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-cream/40 hover:text-cream text-xs font-cinzel transition-colors"
          >
            Back to Site
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/60 hover:text-red-400 text-xs font-cinzel transition-colors w-full"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gold/10 bg-[#070000]">
          <button onClick={() => setSideOpen(true)} className="text-cream/60">
            <Menu size={20} />
          </button>
          <span className="font-cinzel text-gold text-sm font-bold">Admin Panel</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
