import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { EVENT_TYPES, isBot, recordEvent, type AnalyticsEventType } from '@/lib/analytics-server';

// Receives anonymous analytics events from the browser (see lib/track.ts). Public on
// purpose, so it only accepts a few short fields and always answers 204: tracking must
// never show an error to a customer, and a visitor can't learn whether it was recorded.
//
// Skipped on purpose: bots, the shop's own admin pages, and anyone logged in to the admin
// panel (so your own browsing doesn't inflate the numbers).
const done = () => new NextResponse(null, { status: 204 });
const clip = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : '');

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const type = body?.type as AnalyticsEventType;
  if (!EVENT_TYPES.includes(type)) return done();

  // Path only, never the query string (it could contain something personal).
  const path = clip(body?.path, 200).split('?')[0].split('#')[0];
  if (!path.startsWith('/') || path.startsWith('/admin') || path.startsWith('/api')) return done();

  if (isBot(req.headers.get('user-agent'))) return done();
  try { if (isAdminRequest(req)) return done(); } catch { /* ADMIN_SESSION_SECRET not set: nothing to skip */ }

  // The book is taken from the page address; add-to-cart sends it explicitly.
  const slugFromPath = /^\/books\/([a-z0-9-]+)$/i.exec(path)?.[1] ?? null;
  const bookSlug = type === 'page_view' ? slugFromPath : (clip(body?.bookSlug, 100).match(/^[a-z0-9-]+$/i) ? clip(body?.bookSlug, 100) : null);

  await recordEvent(req, { type, path, bookSlug });
  return done();
}
