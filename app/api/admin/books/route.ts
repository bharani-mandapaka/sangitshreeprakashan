import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest } from '@/lib/admin-auth';

// Reads (list/detail) go straight through the anon-key client from the admin
// UI, since `books` RLS already allows public SELECT (see supabase/schema.sql)
// — there's nothing sensitive in a book record. Only writes need gating: the
// anon key has no insert/update/delete policy on `books` at all, so this
// route (service-role, admin-cookie gated) is the only way to change the
// catalog, matching the pattern already used for orders.

const CATEGORIES = ['instrumental', 'vocal', 'raag-theory', 'kathak', 'research', 'cbse', 'bundle'];
const LEVELS      = ['beginner', 'intermediate', 'advanced', 'research', 'bundle'];
const LANGUAGES   = ['hindi', 'english', 'bilingual'];

interface BookInput {
  id?: string;
  slug: string;
  titleHindi: string;
  titleEnglish: string;
  price: number;
  category: string;
  level: string;
  language: string;
  authors: string[];
  description: string;
  descriptionHindi?: string | null;
  coverImage?: string | null;
  series?: string | null;
  part?: number | null;
  isBundle?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
  tags: string[];
}

function validate(body: Partial<BookInput>): string | null {
  if (!body.slug || typeof body.slug !== 'string') return 'A slug is required.';
  if (!body.titleEnglish || typeof body.titleEnglish !== 'string') return 'An English title is required.';
  if (!body.titleHindi || typeof body.titleHindi !== 'string') return 'A Hindi title is required.';
  if (typeof body.price !== 'number' || body.price <= 0) return 'Price must be a positive number.';
  if (!body.category || !CATEGORIES.includes(body.category)) return `Category must be one of: ${CATEGORIES.join(', ')}.`;
  if (!body.level || !LEVELS.includes(body.level)) return `Level must be one of: ${LEVELS.join(', ')}.`;
  if (!body.language || !LANGUAGES.includes(body.language)) return `Language must be one of: ${LANGUAGES.join(', ')}.`;
  if (!Array.isArray(body.authors) || body.authors.length === 0) return 'At least one author is required.';
  if (!body.description || typeof body.description !== 'string') return 'A description is required.';
  return null;
}

function toRow(body: BookInput) {
  return {
    slug:              body.slug.trim(),
    title_hindi:       body.titleHindi,
    title_english:     body.titleEnglish,
    price:             body.price,
    category:          body.category,
    level:             body.level,
    language:          body.language,
    authors:           body.authors,
    description:       body.description,
    description_hindi: body.descriptionHindi || null,
    cover_image:       body.coverImage || null,
    series:            body.series || null,
    part:              body.part ?? null,
    is_bundle:         !!body.isBundle,
    is_featured:       !!body.isFeatured,
    in_stock:          body.inStock ?? true,
    tags:              Array.isArray(body.tags) ? body.tags : [],
    updated_at:        new Date().toISOString(),
  };
}

// ── Create a new book (or bundle — bundles are just books with isBundle=true) ──
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as BookInput | null;
  if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });

  const validationError = validate(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  // New books use the slug as their id too — existing books have hand-picked
  // short codes (e.g. "sv-1"), but there's no reason to require admins to
  // invent one; the slug is already required, unique, and human-readable.
  const id = body.slug.trim();

  const { error } = await getSupabaseAdmin().from('books').insert({ id, ...toRow(body) });
  if (error) {
    const message = error.code === '23505'
      ? 'A book with this slug already exists — please choose a different one.'
      : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ success: true, id });
}

// ── Update an existing book ─────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as (BookInput & { id?: string }) | null;
  if (!body?.id) return NextResponse.json({ error: 'A book id is required.' }, { status: 400 });

  const validationError = validate(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const { error } = await getSupabaseAdmin().from('books').update(toRow(body)).eq('id', body.id);
  if (error) {
    const message = error.code === '23505'
      ? 'Another book already uses this slug — please choose a different one.'
      : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

// ── Delete a book ────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = body?.id;
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'A book id is required.' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin().from('books').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
