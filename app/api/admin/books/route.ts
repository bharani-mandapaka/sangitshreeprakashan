import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest } from '@/lib/admin-auth';

// The storefront (homepage, /books, book detail pages, sitemap) reads books
// through statically-rendered pages with no revalidate/dynamic export, so
// Next.js caches that data indefinitely once built — an admin edit here
// would otherwise never show up on the live site without a full redeploy.
// Revalidating the affected paths on every write keeps pages fast (still
// served from cache for the common case: a shopper browsing, not editing)
// while making admin changes appear immediately, no redeploy needed.
function revalidateStorefront(slugs: string[]) {
  revalidatePath('/');
  revalidatePath('/books');
  revalidatePath('/sitemap.xml');
  for (const slug of slugs) revalidatePath(`/books/${slug}`);
}

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
  /** Copies left; null = not counted; omitted = leave as is (and don't touch the column). */
  stockQuantity?: number | null;
  /** Optional details, sent together; omitted = leave as is (the columns only exist after book-details.sql). */
  isbn?: string | null;
  edition?: string | null;
  pages?: number | null;
  publicationYear?: number | null;
  tableOfContents?: string[] | null;
  aboutAuthors?: string | null;
  /** "Look inside" page images; omitted = leave as is (the column exists only after book-sample-pages.sql). */
  samplePages?: string[] | null;
  tags: string[];
}

const MAX_SAMPLE_PAGES = 8;
// Only images the site can actually show: our own Supabase Storage (the upload route returns these)
// or a file in /public. Anything else would be a broken image or an arbitrary outside address.
const SAMPLE_PAGE_URL = /^(\/[A-Za-z0-9._\-\/]+|https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/[A-Za-z0-9._\-\/]+)$/;

function validateSamplePages(b: Partial<BookInput>): string | null {
  if (b.samplePages == null) return null;
  if (!Array.isArray(b.samplePages) || b.samplePages.length > MAX_SAMPLE_PAGES
      || b.samplePages.some((u) => typeof u !== 'string' || u.length > 500 || !SAMPLE_PAGE_URL.test(u))) {
    return `Sample pages: up to ${MAX_SAMPLE_PAGES} images, each uploaded from the admin form.`;
  }
  return null;
}

const sendsDetails = (b: Partial<BookInput>) =>
  b.isbn !== undefined || b.edition !== undefined || b.pages !== undefined ||
  b.publicationYear !== undefined || b.tableOfContents !== undefined || b.aboutAuthors !== undefined;

function validateDetails(b: Partial<BookInput>): string | null {
  if (b.isbn != null && (typeof b.isbn !== 'string' || !/^[0-9Xx][0-9Xx -]{5,24}$/.test(b.isbn.trim()))) {
    return 'ISBN should be digits (and hyphens), for example 978-81-234-5678-9.';
  }
  if (b.edition != null && (typeof b.edition !== 'string' || b.edition.length > 60)) return 'Edition is too long (60 characters at most).';
  if (b.pages != null && (!Number.isInteger(b.pages) || b.pages <= 0 || b.pages > 5000)) return 'Pages must be a whole number above 0.';
  if (b.publicationYear != null && (!Number.isInteger(b.publicationYear) || b.publicationYear < 1900 || b.publicationYear > 2100)) {
    return 'Year must be between 1900 and 2100.';
  }
  if (b.tableOfContents != null) {
    if (!Array.isArray(b.tableOfContents) || b.tableOfContents.length > 80
        || b.tableOfContents.some((l) => typeof l !== 'string' || l.length > 200)) {
      return 'Table of contents can have up to 80 lines of up to 200 characters each.';
    }
  }
  if (b.aboutAuthors != null && (typeof b.aboutAuthors !== 'string' || b.aboutAuthors.length > 2000)) {
    return 'The note about the author is too long (2000 characters at most).';
  }
  return null;
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
  if (body.stockQuantity !== undefined && body.stockQuantity !== null
      && (!Number.isInteger(body.stockQuantity) || body.stockQuantity < 0)) {
    return 'Copies left must be a whole number, 0 or more (or empty to not count copies).';
  }
  return validateDetails(body) ?? validateSamplePages(body);
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
    // A counted book is in stock exactly when copies are left; that overrides the switch.
    in_stock:          typeof body.stockQuantity === 'number' ? body.stockQuantity > 0 : (body.inStock ?? true),
    // Only written when sent: the column doesn't exist until stock-quantity.sql has been run,
    // and including it would make every book save fail.
    ...(body.stockQuantity !== undefined ? { stock_quantity: body.stockQuantity } : {}),
    // Same rule for the optional details (book-details.sql): blank values are stored as empty.
    ...(sendsDetails(body) ? {
      isbn:              body.isbn?.trim() || null,
      edition:           body.edition?.trim() || null,
      pages:             body.pages ?? null,
      publication_year:  body.publicationYear ?? null,
      table_of_contents: (body.tableOfContents ?? []).map((l) => l.trim()).filter(Boolean),
      about_authors:     body.aboutAuthors?.trim() || null,
    } : {}),
    // Same rule again for sample pages (book-sample-pages.sql).
    ...(body.samplePages !== undefined ? { sample_pages: body.samplePages ?? [] } : {}),
    tags:             Array.isArray(body.tags) ? body.tags : [],
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

  revalidateStorefront([body.slug.trim()]);
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

  const admin = getSupabaseAdmin();

  // Fetch the pre-edit slug so we can revalidate its detail page too —
  // id and slug aren't always the same value (the original 36 seeded books
  // have hand-picked short-code ids like "sv-1" distinct from their slug),
  // and an edit can change the slug itself, leaving a stale cached page at
  // the old URL if we only revalidate the new one.
  const { data: existing } = await admin.from('books').select('slug').eq('id', body.id).maybeSingle();

  const { error } = await admin.from('books').update(toRow(body)).eq('id', body.id);
  if (error) {
    const message = error.code === '23505'
      ? 'Another book already uses this slug — please choose a different one.'
      : error.message;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const slugs = [body.slug.trim(), existing?.slug].filter(Boolean) as string[];
  revalidateStorefront(slugs);
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

  const admin = getSupabaseAdmin();
  const { data: existing } = await admin.from('books').select('slug').eq('id', id).maybeSingle();

  const { error } = await admin.from('books').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateStorefront(existing?.slug ? [existing.slug] : []);
  return NextResponse.json({ success: true });
}
