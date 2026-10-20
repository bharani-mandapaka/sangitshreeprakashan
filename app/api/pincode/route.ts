import { NextRequest, NextResponse } from 'next/server';
import { lookupPincode, PINCODE_FORMAT } from '@/lib/pincode';

// Called by the checkout form as the customer types their PIN code. Public on
// purpose (guests check out too) — it only answers "does this PIN exist, and in
// which state?", and results are cached so repeat lookups don't hit India Post.
export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get('code') ?? '').trim();
  if (!PINCODE_FORMAT.test(code)) {
    return NextResponse.json({ status: 'invalid' }, { status: 400 });
  }

  const result = await lookupPincode(code);
  return NextResponse.json(result, {
    headers: {
      // Only cache definite answers; "unknown" (service hiccup) must be retried.
      'Cache-Control':
        result.status === 'unknown' ? 'no-store' : 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
