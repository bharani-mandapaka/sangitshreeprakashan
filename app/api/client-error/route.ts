import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/error-log';

// Receives "this page crashed in a customer's browser" reports from app/error.tsx and
// app/global-error.tsx. Public on purpose (the customer isn't logged in), so it only
// accepts short text fields, and lib/error-log.ts groups identical reports and stops
// adding rows once too many are open, so it can't be used to flood the table.
const clip = (value: unknown, max: number) => (typeof value === 'string' ? value.slice(0, max) : undefined);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const message = clip(body?.message, 300);
  if (!message) return NextResponse.json({ ok: false }, { status: 400 });

  await logError('browser', message, {
    severity: 'error',
    details: {
      path:      clip(body?.path, 200),
      digest:    clip(body?.digest, 100),
      userAgent: clip(req.headers.get('user-agent'), 200),
    },
  });
  return NextResponse.json({ ok: true });
}
