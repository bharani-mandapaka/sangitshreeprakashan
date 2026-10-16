import { getAllBooks } from '@/lib/books-data';
import BooksListClient from '@/components/BooksListClient';

// Server component — fetches the catalog from Supabase (see lib/books-data.ts)
// and hands it to the client component that owns the search/filter/sort UI.
// A 'use client' page can't itself be async, so that UI now lives in
// components/BooksListClient.tsx instead of directly in this file.
export default async function BooksPage() {
  const initialBooks = await getAllBooks();
  return <BooksListClient initialBooks={initialBooks} />;
}
