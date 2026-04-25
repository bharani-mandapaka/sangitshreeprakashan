import type { BookCategory, BookLevel } from '@/lib/books';

interface BookCoverProps {
  titleEnglish: string;
  titleHindi: string;
  category: BookCategory;
  level?: BookLevel;
  part?: number;
  series?: string;
  isBundle?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const categoryIcons: Record<BookCategory, string> = {
  instrumental:  '♬',
  vocal:         '♪',
  'raag-theory': '𝄞',
  kathak:        '✦',
  research:      '⊕',
  cbse:          '✎',
  bundle:        '⊞',
};

const categoryColors: Record<BookCategory, { bg: string; accent: string }> = {
  instrumental:  { bg: '#3D0800', accent: '#FF6B35' },
  vocal:         { bg: '#08003D', accent: '#4EA8FF' },
  'raag-theory': { bg: '#003D1A', accent: '#4EFF91' },
  kathak:        { bg: '#3D0040', accent: '#D04EFF' },
  research:      { bg: '#2A2000', accent: '#FFD04E' },
  cbse:          { bg: '#002035', accent: '#4ECFFF' },
  bundle:        { bg: '#5C0000', accent: '#C9A227' },
};

export default function BookCover({
  titleEnglish,
  titleHindi,
  category,
  part,
  series,
  isBundle,
  className = '',
  size = 'md',
}: BookCoverProps) {
  const { bg, accent } = categoryColors[category];
  const icon = categoryIcons[category];

  const dims = size === 'sm' ? '120x170' : size === 'lg' ? '280x380' : '200x280';
  const [w, h] = dims.split('x').map(Number);

  const shortTitle =
    titleEnglish.length > 28 ? titleEnglish.slice(0, 26) + '…' : titleEnglish;
  const shortHindi =
    titleHindi.length > 20 ? titleHindi.slice(0, 18) + '…' : titleHindi;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full ${className}`}
      role="img"
      aria-label={titleEnglish}
    >
      <defs>
        <linearGradient id={`bg-${category}-${part}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#0A0000" />
          <stop offset="40%"  stopColor={bg} />
          <stop offset="100%" stopColor="#8B0000" />
        </linearGradient>
        <linearGradient id={`gold-${category}-${part}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#8B6914" />
          <stop offset="40%"  stopColor="#F5D060" />
          <stop offset="70%"  stopColor="#C9A227" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
        <filter id={`glow-${category}-${part}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background */}
      <rect width={w} height={h} fill={`url(#bg-${category}-${part})`} rx="4" />

      {/* Top gold border strip */}
      <rect x="0" y="0" width={w} height="4" fill={`url(#gold-${category}-${part})`} rx="4" />

      {/* Decorative corner elements */}
      <text x="6" y="14" fontSize="10" fill="#C9A227" opacity="0.6">✦</text>
      <text x={w - 14} y="14" fontSize="10" fill="#C9A227" opacity="0.6" textAnchor="middle">✦</text>

      {/* Publisher imprint top */}
      <text
        x={w / 2}
        y="22"
        textAnchor="middle"
        fontSize={size === 'sm' ? '5' : '6'}
        fill="#C9A227"
        opacity="0.8"
        letterSpacing="1"
      >
        SANGIT SHREE PRAKASHAN
      </text>

      {/* Divider line */}
      <line x1="12" y1="28" x2={w - 12} y2="28" stroke="#C9A227" strokeWidth="0.5" opacity="0.4" />

      {/* Central icon / music symbol */}
      <text
        x={w / 2}
        y={h * 0.46}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size === 'sm' ? '38' : '56'}
        fill={accent}
        opacity="0.18"
        filter={`url(#glow-${category}-${part})`}
      >
        {icon}
      </text>

      {/* Part badge */}
      {part && (
        <>
          <circle cx={w / 2} cy={h * 0.46} r={size === 'sm' ? '18' : '26'} fill="none" stroke={`url(#gold-${category}-${part})`} strokeWidth="1" opacity="0.5" />
          <text
            x={w / 2}
            y={h * 0.46}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size === 'sm' ? '14' : '20'}
            fontWeight="bold"
            fill={`url(#gold-${category}-${part})`}
          >
            {isBundle ? '✦' : part}
          </text>
        </>
      )}

      {/* Bottom divider */}
      <line x1="12" y1={h - 52} x2={w - 12} y2={h - 52} stroke="#C9A227" strokeWidth="0.5" opacity="0.4" />

      {/* Series label */}
      {series && (
        <text
          x={w / 2}
          y={h - 42}
          textAnchor="middle"
          fontSize={size === 'sm' ? '5.5' : '7'}
          fill={`url(#gold-${category}-${part})`}
          letterSpacing="0.5"
          opacity="0.9"
        >
          {series.toUpperCase()}
        </text>
      )}

      {/* Hindi title */}
      <text
        x={w / 2}
        y={h - 28}
        textAnchor="middle"
        fontSize={size === 'sm' ? '6' : '8'}
        fill="#FFF8E7"
        opacity="0.7"
      >
        {shortHindi}
      </text>

      {/* English title */}
      <text
        x={w / 2}
        y={h - 16}
        textAnchor="middle"
        fontSize={size === 'sm' ? '5.5' : '7.5'}
        fontWeight="600"
        fill="#FFF8E7"
        letterSpacing="0.3"
      >
        {shortTitle}
      </text>

      {/* Bottom gold border */}
      <rect x="0" y={h - 4} width={w} height="4" fill={`url(#gold-${category}-${part})`} rx="4" />
    </svg>
  );
}
