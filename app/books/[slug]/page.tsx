import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllBooks, getBookBySlug, getBooksByCategory } from '@/lib/books-data';
import BookDetailClient from '@/components/BookDetailClient';

interface Props {
  params: { slug: string };
}

// Without generateStaticParams Next treats /books/[slug] as fully dynamic: every click
// re-queried Supabase (book + related books) before anything could show, ~0.6-1.3s each
// time. Pre-building the pages makes them as quick as /books. Books added later are built
// on first visit (dynamicParams defaults to true), the admin API revalidates a page when
// its book is edited, and `revalidate` is a safety net for edits made straight in Supabase.
export const revalidate = 3600;

export async function generateStaticParams() {
  const books = await getAllBooks();
  return books.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = await getBookBySlug(params.slug);
  if (!book) return {};
  return {
    title: book.titleEnglish,
    description: book.description.slice(0, 160),
    openGraph: {
      title: `${book.titleEnglish} | Sangit Shree Prakashan`,
      description: book.description.slice(0, 160),
      type: 'website',
    },
  };
}

export default async function BookDetailPage({ params }: Props) {
  const book = await getBookBySlug(params.slug);
  if (!book) notFound();

  // Computed here (server-side) instead of inside BookDetailClient, which is
  // a 'use client' component and would otherwise need its own Supabase call.
  const related = (await getBooksByCategory(book.category))
    .filter((b) => b.id !== book.id)
    .slice(0, 4);

  return <BookDetailClient book={book} related={related} />;
}