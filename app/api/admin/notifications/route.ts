import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest } from '@/lib/admin-auth';

// notification_rules / notification_logs have RLS enabled with no anon policy
// (see supabase/schema.sql), so the admin panel reads and writes them through
// here with the server-only service-role key. Every handler checks the signed
// admin session cookie first.

const RULE_FIELDS = [
  'name', 'description', 'trigger', 'channel', 'recipients', 'subject', 'body',
  'whatsapp_numbers', 'whatsapp_message', 'active', 'audience',
] as const;

function pickRuleFields(input: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input && typeof input === 'object') {
    for (const key of RULE_FIELDS) {
      if (key in input) out[key] = (input as Record<string, unknown>)[key];
    }
  }
  return out;
}

const unauthorized = () => NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
const failure = (err: unknown, fallback: string) =>
  NextResponse.json({ error: err instanceof Error ? err.message : fallback }, { status: 500 });

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  try {
    const db = getSupabaseAdmin();
    const [rules, logs] = await Promise.all([
      db.from('notification_rules').select('*').order('created_at', { ascending: false }),
      db.from('notification_logs').select('*').order('sent_at', { ascending: false }).limit(30),
    ]);
    if (rules.error) return NextResponse.json({ error: rules.error.message }, { status: 500 });
    return NextResponse.json({ rules: rules.data ?? [], logs: logs.data ?? [] });
  } catch (err) {
    return failure(err, 'Failed to load notifications.');
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = await req.json().catch(() => null);
  const rule = pickRuleFields(body);
  if (!rule.name || !rule.trigger || !rule.channel) {
    return NextResponse.json({ error: 'name, trigger and channel are required.' }, { status: 400 });
  }
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('notification_rules')
      .insert({ ...rule, id: crypto.randomUUID() })
      .select('*')
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ rule: data });
  } catch (err) {
    return failure(err, 'Failed to create the rule.');
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  const patch = pickRuleFields(body?.patch);
  if (!id || Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'id and a non-empty patch are required.' }, { status: 400 });
  }
  try {
    const { error } = await getSupabaseAdmin().from('notification_rules').update(patch).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return failure(err, 'Failed to update the rule.');
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) return unauthorized();
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required.' }, { status: 400 });
  try {
    const { error } = await getSupabaseAdmin().from('notification_rules').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return failure(err, 'Failed to delete the rule.');
  }
}
