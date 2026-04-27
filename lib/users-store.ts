import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole       = 'admin' | 'staff' | 'viewer';
export type AuthMethod     = 'google' | 'manual';

export interface AppUser {
  id:            string;
  name:          string;
  email:         string;
  phone:         string;   // e.g. +917408452828
  role:          UserRole;
  authMethod:    AuthMethod;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt:     string;
  avatar?:       string;   // URL for Google profile pic (or initials fallback)
  color:         string;   // hex for avatar background
}

interface UsersStore {
  users:      AppUser[];
  addUser:    (user: AppUser) => void;
  updateUser: (id: string, patch: Partial<AppUser>) => void;
  deleteUser: (id: string) => void;
}

const COLORS = ['#8B0000', '#1a3a6b', '#14532d', '#581c87', '#7c2d12', '#164e63'];
const pick = (i: number) => COLORS[i % COLORS.length];

const seedUsers: AppUser[] = [
  {
    id:            'user-001',
    name:          'Bharani Mandapaka',
    email:         'meetbharani91@gmail.com',
    phone:         '+917408452828',
    role:          'admin',
    authMethod:    'google',
    emailVerified: true,
    phoneVerified: true,
    createdAt:     '2026-04-20T09:00:00Z',
    color:         pick(0),
  },
  {
    id:            'user-002',
    name:          'Rohit Kumar',
    email:         'rohit.kumar@sangitshreeprakashan.com',
    phone:         '+919336112507',
    role:          'staff',
    authMethod:    'manual',
    emailVerified: true,
    phoneVerified: true,
    createdAt:     '2026-04-21T11:00:00Z',
    color:         pick(1),
  },
  {
    id:            'user-003',
    name:          'Priya Sharma',
    email:         'priya.sharma@gmail.com',
    phone:         '+919876543210',
    role:          'viewer',
    authMethod:    'manual',
    emailVerified: true,
    phoneVerified: false,
    createdAt:     '2026-04-22T14:30:00Z',
    color:         pick(2),
  },
];

export const useUsersStore = create<UsersStore>()(
  persist(
    (set) => ({
      users: seedUsers,
      addUser: (user) =>
        set((s) => ({ users: [...s.users, user] })),
      updateUser: (id, patch) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      deleteUser: (id) =>
        set((s) => ({ users: s.users.filter((u) => u.id !== id) })),
    }),
    { name: 'ssp-users' }
  )
);

// ── Helpers ────────────────────────────────────────────────────────────────────
export function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export const ROLE_META: Record<UserRole, { label: string; color: string }> = {
  admin:  { label: 'Admin',  color: 'bg-gold/15 text-gold border-gold/25' },
  staff:  { label: 'Staff',  color: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  viewer: { label: 'Viewer', color: 'bg-white/8 text-cream/50 border-white/10' },
};

// ── OTP mock ───────────────────────────────────────────────────────────────────
// In production, replace with Twilio / MSG91 / AWS SNS
export function generateOtp(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}
