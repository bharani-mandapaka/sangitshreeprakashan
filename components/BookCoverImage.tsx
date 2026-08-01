import Image from 'next/image';
import BookCover from './BookCover';
import type { Book } from '@/lib/books';

interface BookCoverImageProps {
  book: Book;
  size?: 'sm' | 'md' | 'lg';
  sizes?: string;
  priority?: boolean;
}

/**
 * Renders the real cover photo when a book has one (public/covers/*.jpg),
 * otherwise falls back to the generated BookCover SVG placeholder.
 */
export default function BookCoverImage({
  book,
  size = 'md',
  sizes = '(max-width: 768px) 50vw, 300px',
  priority = false,
}: BookCoverImageProps) {
  if (book.coverImage) {
    return (
      <Image
        src={book.coverImage}
        alt={`${book.titleEnglish} cover`}
        fill
        sizes={sizes}
        className="object-contain"
        priority={priority}
      />
    );
  }

  return (
    <BookCover
      titleEnglish={book.titleEnglish}
      titleHindi={book.titleHindi}
      category={book.category}
      level={book.level}
      part={book.part}
      series={book.series}
      isBundle={book.isBundle}
      size={size}
    />
  );
}
