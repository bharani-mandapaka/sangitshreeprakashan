'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Trash2, Edit3, Check, X, Shield, Eye,
  Mail, Phone, CheckCircle, AlertCircle, RefreshCw,
} from 'lucide-react';
import {
  useUsersStore, initials, ROLE_META, generateOtp,
  type AppUser, type UserRole, type AuthMethod,
} from '@/lib/users-store';

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ user, size = 9 }: { user: AppUser; size?: number }) {
  const px = size * 4;
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center flex-shrink-0 font-cinzel font-bold text-white text-xs select-none`}
      style={{ background: user.color, width: px, height: px, fontSize: Math.max(10, px * 0.32) }}
    >
      {user.avatar
        ? <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
        : initials(user.name)
      }
    </div>
  );
}

// ── OTP input (4 boxes) ────────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const digits = value.padEnd(4, ' ').split('');

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const next = value.slice(0, i === 0 ? 0 : i - (value[i] ? 0 : 1));
      onChange(next);
      if (i > 0 && !value[i]) refs[i - 1].current?.focus();
    }
  };
  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[i] = digit;
    const next = arr.join('').slice(0, 4);
    onChange(next);
    if (digit && i < 3) refs[i + 1].current?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]?.trim() || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-12 h-14 text-center text-xl font-cinzel font-bold text-cream bg-[#0D0000] border-2 border-gold/20 focus:border-gold outline-none rounded-xl transition-colors"
        />
      ))}
    </div>
  );
}

// ── Google sign-in mock ────────────────────────────────────────────────────────
function GoogleSignIn({ onSuccess }: { onSuccess: (name: string, email: string, avatar?: string) => void }) {
  const [step,       setStep]       = useState<'choose' | 'enter' | 'consent' | 'done'>('choose');
  const [googleEmail, setGoogleEmail] = useState('');
  const [error,      setError]      = useState('');

  const handleContinue = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(googleEmail)) {
      setError('Enter a valid Google email address.');
      return;
    }
    setError('');
    setStep('consent');
  };

  const handleAllow = () => {
    // Derive display name from email local part
    const local = googleEmail.split('@')[0];
    const name  = local.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    setStep('done');
    setTimeout(() => onSuccess(name, googleEmail), 600);
  };

  if (step === 'done') {
    return (
      <div className="text-center py-8">
        <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
        <p className="font-cinzel text-cream text-sm">Signed in with Google</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-xs mx-auto">
      {/* Google header */}
      <div className="px-8 pt-8 pb-4 text-center">
        {/* Google logo */}
        <svg viewBox="0 0 24 24" className="w-8 h-8 mx-auto mb-4">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <h3 className="text-gray-800 text-lg font-medium" style={{ fontFamily: 'Google Sans, Roboto, sans-serif' }}>Sign in</h3>
        <p className="text-gray-500 text-sm mt-1" style={{ fontFamily: 'Roboto, sans-serif' }}>to continue to Sangit Shree Prakashan</p>
      </div>

      <div className="px-8 pb-8 space-y-4">
        {step === 'choose' && (
          <>
            <button
              onClick={() => setStep('enter')}
              className="w-full border border-gray-300 hover:border-gray-400 rounded-full py-2.5 flex items-center justify-center gap-3 text-sm text-gray-700 font-medium transition-colors"
              style={{ fontFamily: 'Roboto, sans-serif' }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <div className="relative">
              <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200" />
              <span className="relative bg-white px-3 text-gray-400 text-xs block w-max mx-auto">or enter email</span>
            </div>
            <button onClick={() => setStep('enter')} className="w-full text-[#1a73e8] text-sm hover:underline" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Use email address
            </button>
          </>
        )}

        {step === 'enter' && (
          <>
            <div>
              <label className="block text-gray-600 text-xs mb-1.5" style={{ fontFamily: 'Roboto, sans-serif' }}>Email or phone</label>
              <input
                autoFocus
                type="email"
                value={googleEmail}
                onChange={(e) => { setGoogleEmail(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                className="w-full border border-gray-300 focus:border-[#1a73e8] outline-none rounded px-3 py-2.5 text-sm text-gray-800 transition-colors"
                style={{ fontFamily: 'Roboto, sans-serif' }}
                placeholder="Enter your Google email"
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
            <p className="text-gray-500 text-xs leading-relaxed" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Not your computer? Use a private window to sign in.
            </p>
            <div className="flex justify-between items-center pt-2">
              <button onClick={() => setStep('choose')} className="text-[#1a73e8] text-sm hover:underline" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Create account
              </button>
              <button onClick={handleContinue} className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm px-6 py-2 rounded transition-colors" style={{ fontFamily: 'Google Sans, Roboto, sans-serif' }}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 'consent' && (
          <>
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                <span className="text-gray-500 text-lg">{googleEmail[0]?.toUpperCase()}</span>
              </div>
              <p className="text-gray-700 text-sm font-medium" style={{ fontFamily: 'Google Sans, sans-serif' }}>{googleEmail}</p>
            </div>
            <p className="text-gray-600 text-sm text-center" style={{ fontFamily: 'Roboto, sans-serif' }}>
              <strong>Sangit Shree Prakashan</strong> wants to access your Google Account
            </p>
            <ul className="text-gray-500 text-xs space-y-1.5 border border-gray-200 rounded-lg p-3">
              <li className="flex items-center gap-2"><CheckCircle size={12} className="text-green-500 flex-shrink-0" /> See your name and profile picture</li>
              <li className="flex items-center gap-2"><CheckCircle size={12} className="text-green-500 flex-shrink-0" /> See your email address</li>
            </ul>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setStep('enter')} className="flex-1 border border-gray-300 text-gray-600 text-sm py-2 rounded hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Roboto, sans-serif' }}>
                Cancel
              </button>
              <button onClick={handleAllow} className="flex-1 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm py-2 rounded transition-colors" style={{ fontFamily: 'Google Sans, sans-serif' }}>
                Allow
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Add-user modal ─────────────────────────────────────────────────────────────
type ModalTab = 'form' | 'google';
type OtpState = 'idle' | 'sending' | 'sent' | 'verified' | 'error';

function AddUserModal({ onClose }: { onClose: () => void }) {
  const { addUser, users } = useUsersStore();
  const [tab, setTab] = useState<ModalTab>('form');

  // Form fields
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role,  setRole]  = useState<UserRole>('viewer');

  // OTP state
  const [otpState,     setOtpState]     = useState<OtpState>('idle');
  const [otpValue,     setOtpValue]     = useState('');
  const [otpCode,      setOtpCode]      = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError,     setOtpError]     = useState('');

  // Derived
  const phoneVerified = otpState === 'verified';
  const validPhone    = /^\+91[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));

  // Countdown timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  const sendOtp = () => {
    setOtpState('sending');
    const code = generateOtp();
    setOtpCode(code);
    setOtpValue('');
    setOtpError('');
    setTimeout(() => {
      setOtpState('sent');
      setOtpCountdown(30);
    }, 800);
  };

  const verifyOtp = () => {
    if (otpValue === otpCode) {
      setOtpState('verified');
      setOtpError('');
    } else {
      setOtpError('Incorrect OTP. Try again.');
      setOtpState('error');
    }
  };

  // Form submit
  const handleSave = () => {
    if (!name.trim() || !email.trim()) return;
    const colors = ['#8B0000', '#1a3a6b', '#14532d', '#581c87', '#7c2d12', '#164e63'];
    addUser({
      id:            `user-${Date.now()}`,
      name:          name.trim(),
      email:         email.trim(),
      phone:         phone.replace(/\s/g, ''),
      role,
      authMethod:    'manual',
      emailVerified: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      phoneVerified,
      createdAt:     new Date().toISOString(),
      color:         colors[users.length % colors.length],
    });
    onClose();
  };

  // Google success
  const handleGoogleSuccess = (gName: string, gEmail: string) => {
    const colors = ['#8B0000', '#1a3a6b', '#14532d', '#581c87', '#7c2d12', '#164e63'];
    addUser({
      id:            `user-${Date.now()}`,
      name:          gName,
      email:         gEmail,
      phone:         '',
      role,
      authMethod:    'google',
      emailVerified: true,
      phoneVerified: false,
      createdAt:     new Date().toISOString(),
      color:         colors[users.length % colors.length],
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-[#0D0000] border border-gold/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gold/10">
          <h2 className="font-cinzel text-cream font-semibold text-sm">Add User</h2>
          <button onClick={onClose} className="text-cream/30 hover:text-cream transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gold/10">
          {([['form', 'Fill Form'], ['google', 'Sign in with Google']] as [ModalTab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-cinzel font-bold uppercase tracking-widest transition-colors ${
                tab === t
                  ? 'text-gold border-b-2 border-gold -mb-px'
                  : 'text-cream/30 hover:text-cream/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── FORM TAB ── */}
          {tab === 'form' && (
            <div className="space-y-4">
              <div>
                <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">Full Name *</label>
                <input className="input-gold text-sm" placeholder="e.g. Rohit Kumar" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">Email *</label>
                <input className="input-gold text-sm" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              {/* Phone + OTP */}
              <div>
                <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">
                  WhatsApp Number (+91)
                  {phoneVerified && <span className="ml-2 text-green-400 normal-case">Verified</span>}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/40 text-sm font-cinzel">+91</span>
                    <input
                      className="input-gold text-sm pl-12"
                      type="tel"
                      placeholder="9876543210"
                      maxLength={10}
                      value={phone.replace('+91', '')}
                      onChange={(e) => { setPhone('+91' + e.target.value.replace(/\D/g, '')); setOtpState('idle'); }}
                      disabled={phoneVerified}
                    />
                  </div>
                  {!phoneVerified && (
                    <button
                      onClick={sendOtp}
                      disabled={!validPhone || otpState === 'sending' || otpCountdown > 0}
                      className="flex-shrink-0 border border-gold/25 hover:border-gold/60 disabled:opacity-40 text-gold/70 hover:text-gold font-cinzel text-xs px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"
                    >
                      {otpState === 'sending' ? <RefreshCw size={12} className="animate-spin" /> : null}
                      {otpCountdown > 0 ? `Resend (${otpCountdown}s)` : 'Send OTP'}
                    </button>
                  )}
                  {phoneVerified && <CheckCircle size={18} className="text-green-400 self-center flex-shrink-0" />}
                </div>

                {/* OTP entry */}
                <AnimatePresence>
                  {(otpState === 'sent' || otpState === 'error') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-3"
                    >
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
                        <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                        <div>
                          <p className="text-green-300 text-xs">OTP sent to {phone}</p>
                          <p className="text-green-300/50 text-[10px] font-cinzel">Demo mode — OTP is: <strong className="text-green-300">{otpCode}</strong></p>
                        </div>
                      </div>
                      <OtpInput value={otpValue} onChange={setOtpValue} />
                      {otpError && (
                        <p className="text-red-400 text-xs flex items-center gap-1.5 justify-center">
                          <AlertCircle size={12} /> {otpError}
                        </p>
                      )}
                      <button
                        onClick={verifyOtp}
                        disabled={otpValue.length < 4}
                        className="w-full bg-gold/10 hover:bg-gold/20 disabled:opacity-40 border border-gold/25 text-gold font-cinzel font-bold text-xs py-2.5 rounded-xl transition-all"
                      >
                        Verify OTP
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">Role</label>
                <div className="flex gap-2">
                  {(['admin', 'staff', 'viewer'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2 rounded-xl border text-[11px] font-cinzel font-bold uppercase tracking-widest transition-all ${
                        role === r ? ROLE_META[r].color : 'border-white/8 text-cream/30 hover:text-cream/60 hover:border-white/15'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={!name.trim() || !email.trim()}
                className="w-full bg-gold hover:bg-gold-300 disabled:opacity-40 text-dark font-cinzel font-bold py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2"
              >
                <UserPlus size={15} /> Add User
              </button>
            </div>
          )}

          {/* ── GOOGLE TAB ── */}
          {tab === 'google' && (
            <div className="space-y-4">
              <GoogleSignIn onSuccess={handleGoogleSuccess} />
              <div className="border-t border-gold/10 pt-4">
                <label className="block text-cream/40 text-[10px] font-cinzel uppercase tracking-widest mb-1.5">Role</label>
                <div className="flex gap-2">
                  {(['admin', 'staff', 'viewer'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2 rounded-xl border text-[11px] font-cinzel font-bold uppercase tracking-widest transition-all ${
                        role === r ? ROLE_META[r].color : 'border-white/8 text-cream/30 hover:text-cream/60'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── User row ───────────────────────────────────────────────────────────────────
function UserRow({ user }: { user: AppUser }) {
  const { updateUser, deleteUser } = useUsersStore();
  const [editing, setEditing] = useState(false);
  const [name,  setName]  = useState(user.name);
  const [role,  setRole]  = useState<UserRole>(user.role);

  const save = () => {
    updateUser(user.id, { name: name.trim(), role });
    setEditing(false);
  };

  return (
    <tr className="border-b border-gold/5 hover:bg-white/2 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar user={user} size={9} />
          <div>
            {editing
              ? <input className="input-gold text-xs py-1 w-36" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              : <p className="font-cinzel text-cream text-sm font-semibold">{user.name}</p>
            }
            <p className="text-cream/35 text-[10px] mt-0.5">
              {user.authMethod === 'google' ? '🔵 Google' : '✏️ Manual'}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Mail size={10} className="text-cream/30 flex-shrink-0" />
          <span className="text-cream/70 text-xs">{user.email}</span>
          {user.emailVerified
            ? <CheckCircle size={11} className="text-green-400 flex-shrink-0" />
            : <AlertCircle size={11} className="text-yellow-400 flex-shrink-0" />
          }
        </div>
      </td>

      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex items-center gap-1.5">
          <Phone size={10} className="text-cream/30 flex-shrink-0" />
          <span className="text-cream/70 text-xs">{user.phone || '—'}</span>
          {user.phone && (
            user.phoneVerified
              ? <CheckCircle size={11} className="text-green-400 flex-shrink-0" />
              : <AlertCircle size={11} className="text-yellow-400 flex-shrink-0" />
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        {editing ? (
          <div className="flex gap-1">
            {(['admin', 'staff', 'viewer'] as UserRole[]).map((r) => (
              <button key={r} onClick={() => setRole(r)}
                className={`text-[9px] font-cinzel font-bold uppercase px-2 py-0.5 rounded-full border transition-all ${role === r ? ROLE_META[r].color : 'border-white/10 text-cream/30 hover:text-cream/50'}`}>
                {r}
              </button>
            ))}
          </div>
        ) : (
          <span className={`text-[10px] font-cinzel font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${ROLE_META[user.role].color}`}>
            {user.role}
          </span>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {editing ? (
            <>
              <button onClick={save} className="w-7 h-7 rounded-lg bg-gold/15 hover:bg-gold/30 flex items-center justify-center text-gold transition-colors"><Check size={12} /></button>
              <button onClick={() => setEditing(false)} className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-cream/40 hover:text-cream transition-colors"><X size={12} /></button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-cream/40 hover:text-cream transition-colors"><Edit3 size={12} /></button>
              <button onClick={() => deleteUser(user.id)} className="w-7 h-7 rounded-lg hover:bg-red-400/10 flex items-center justify-center text-red-400/40 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const users = useUsersStore((s) => s.users);
  const [showModal, setShowModal] = useState(false);
  const [filter,    setFilter]    = useState<UserRole | 'all'>('all');

  const filtered = filter === 'all' ? users : users.filter((u) => u.role === filter);

  const counts = {
    all:    users.length,
    admin:  users.filter((u) => u.role === 'admin').length,
    staff:  users.filter((u) => u.role === 'staff').length,
    viewer: users.filter((u) => u.role === 'viewer').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-cream">Users</h1>
          <p className="text-cream/40 text-sm mt-1">
            Manage who receives notifications and has access to this panel.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gold hover:bg-gold-300 text-dark font-cinzel font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
        >
          <UserPlus size={15} /> Add User
        </button>
      </div>

      {/* Role filter pills */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'admin', 'staff', 'viewer'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`flex items-center gap-1.5 text-xs font-cinzel font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all ${
              filter === r
                ? r === 'all' ? 'bg-white/10 border-white/20 text-cream' : ROLE_META[r].color
                : 'border-white/8 text-cream/30 hover:text-cream/60 hover:border-white/15'
            }`}
          >
            {r === 'all' ? <Shield size={11} /> : null}
            {r === 'admin' ? <Shield size={11} /> : null}
            {r === 'staff' ? <Edit3 size={11} /> : null}
            {r === 'viewer' ? <Eye size={11} /> : null}
            {r.charAt(0).toUpperCase() + r.slice(1)}
            <span className="opacity-60">({counts[r]})</span>
          </button>
        ))}
      </div>

      {/* Users table */}
      <div className="bg-[#0A0000] border border-gold/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold/10">
                {['User', 'Email', 'WhatsApp', 'Role', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-cinzel uppercase tracking-widest text-cream/35">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-cream/25 font-cinzel text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((user) => <UserRow key={user.id} user={user} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[10px] text-cream/30 font-cinzel">
        <span className="flex items-center gap-1.5"><CheckCircle size={10} className="text-green-400" /> Verified</span>
        <span className="flex items-center gap-1.5"><AlertCircle size={10} className="text-yellow-400" /> Unverified</span>
        <span>🔵 Google auth</span>
        <span>✏️ Manual entry</span>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && <AddUserModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
