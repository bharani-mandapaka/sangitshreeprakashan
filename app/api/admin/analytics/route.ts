import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { getAnalyticsSummary } from '@/lib/analytics-server';

// Real visitor numbers for the admin dashboard. analytics_events has RLS on with no public
// policy, so it can only be read here with the service-role key, behind the admin session.
//   GET /api/admin/analytics?days=7   (7 or 30)
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  const days = req.nextUrl.searchParams.get('days') === '30' ? 30 : 7;
  return NextResponse.json(await getAnalyticsSummary(days), { headers: { 'Cache-Control': 'no-store' } });
}
