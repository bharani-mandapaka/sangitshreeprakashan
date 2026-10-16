import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBookBySlug, getBooksByCategory } from '@/lib/books-data';
import BookDetailClient from '@/components/BookDetailClient';

interface Props {
  params: { slug: string };
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