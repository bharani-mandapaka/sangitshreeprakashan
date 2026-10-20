import { NextRequest, NextResponse } from 'next/server';
import { PINCODE_FORMAT } from '@/lib/pincode';
import { lookupPincode } from '@/lib/pincode-lookup';

// Called by the checkout form as the customer types their PIN code. Public on
// purpose (guests check out too) — it only answers "does this PIN exist, and in
// which state?" from the bundled official directory (no outside service involved).
export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get('code') ?? '').trim();
  if (!PINCODE_FORMAT.test(code)) {
    return NextResponse.json({ status: 'invalid' }, { status: 400 });
  }

  return NextResponse.json(lookupPincode(code), {
    // The directory only changes when the app is redeployed, so the CDN may cache answers
    // (Vercel clears it on every deploy). Browsers must NOT reuse a stored copy: with
    // "stale-while-revalidate" a browser can show an old answer after the data has changed.
    headers: { 'Cache-Control': 'public, max-age=0, s-maxage=86400' },
  });
}
