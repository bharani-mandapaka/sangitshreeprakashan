import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isAdminRequest } from '@/lib/admin-auth';

// Real cover-image upload for /admin/books, replacing the manual-path-only
// approach. Uploads go to the public 'covers' Supabase Storage bucket (see
// supabase/schema.sql) via the service-role client -- the anon key has no
// write access to this bucket, matching the pattern used for the books table
// itself. Returns the public URL, which the admin form then saves as the
// book's cover_image.

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: 'Unsupported image type — please upload a JPG, PNG, WebP or AVIF file.' },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image is too large — please keep it under 5MB.' }, { status: 400 });
  }

  // Random-ish filename avoids collisions between books and busts any CDN
  // cache if a cover is re-uploaded for the same book later.
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await getSupabaseAdmin()
    .storage
    .from('covers')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data } = getSupabaseAdmin().storage.from('covers').getPublicUrl(path);

  return NextResponse.json({ success: true, url: data.publicUrl });
}
