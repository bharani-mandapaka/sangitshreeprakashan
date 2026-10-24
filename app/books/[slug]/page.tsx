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
    .slice(0, 4)
    // The cards don't show a table of contents or an author note; don't ship them in the page.
    .map((b) => ({ ...b, tableOfContents: undefined, aboutAuthors: undefined }));

  // Structured data so search engines can show the book properly (price, availability, ISBN, pages).
  // Only fields that are filled in are included. `<` is escaped so the text can never close the script tag.
  const site = 'https://sangit-shree-prakashan.vercel.app';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.titleEnglish,
    alternateName: book.titleHindi,
    description: book.description,
    url: `${site}/books/${book.slug}`,
    inLanguage: book.language === 'hindi' ? 'hi' : book.language === 'english' ? 'en' : undefined,
    author: book.authors.map((name) => ({ '@type': 'Person', name })),
    publisher: { '@type': 'Organization', name: 'Sangit Shree Prakashan' },
    image: book.coverImage ? new URL(book.coverImage, site).toString() : undefined,
    isbn: book.isbn,
    bookEdition: book.edition,
    numberOfPages: book.pages,
    datePublished: book.publicationYear ? String(book.publicationYear) : undefined,
    offers: {
      '@type': 'Offer',
      price: book.price,
      priceCurrency: 'INR',
      availability: book.inStock === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <BookDetailClient book={book} related={related} />
    </>
  );
}