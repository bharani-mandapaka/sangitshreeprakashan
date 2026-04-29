import { notFound } from 'next/navigation';
import { getBookBySlug } from '@/lib/books';
import BookDetailClient from '@/components/BookDetailClient';

interface Props {
  params: { slug: string };
}

export default function BookDetailPage({ params }: Props) {
  const book = getBookBySlug(params.slug);
  if (!book) notFound();
  return <BookDetailClient book={book} />;
}
