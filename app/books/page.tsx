import { getAllBooks } from '@/lib/books-data';
import BooksListClient from '@/components/BooksListClient';

// Server component — fetches the catalog from Supabase (see lib/books-data.ts)
// and hands it to the client component that owns the search/filter/sort UI.
// A 'use client' page can't itself be async, so that UI now lives in
// components/BooksListClient.tsx instead of directly in this file.
//
// Built once and re-checked hourly: the admin API revalidates it on every edit, and this
// covers edits made straight in Supabase.
export const revalidate = 3600;

export default async function BooksPage() {
  const initialBooks = await getAllBooks();
  return <BooksListClient initialBooks={initialBooks} />;
}
