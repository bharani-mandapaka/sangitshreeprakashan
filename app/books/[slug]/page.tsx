import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBookBySlug } from '@/lib/books';
import BookDetailClient from '@/components/BookDetailClient';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const book = getBookBySlug(params.slug);
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

export default function BookDetailPage({ params }: Props) {
  const book = getBookBySlug(params.slug);
  if (!book) notFound();
  return <BookDetailClient book={book} />;
}