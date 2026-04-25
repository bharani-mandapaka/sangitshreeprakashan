import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          DEFAULT: '#8B0000',
          50:  '#FFF0F0',
          100: '#FFD6D6',
          200: '#FF9999',
          300: '#E05555',
          400: '#C01010',
          500: '#8B0000',
          600: '#6B0000',
          700: '#4A0000',
          800: '#2A0000',
          900: '#0D0000',
          950: '#050000',
        },
        gold: {
          DEFAULT: '#C9A227',
          50:  '#FEFAED',
          100: '#FDF0C4',
          200: '#F9DF85',
          300: '#F5CB45',
          400: '#E8B820',
          500: '#C9A227',
          600: '#A07D14',
          700: '#795D0E',
          800: '#4F3D09',
          900: '#281F04',
        },
        cream: '#FFF8E7',
        dark: '#0A0000',
      },
      fontFamily: {
        cinzel:     ['var(--font-cinzel)', 'serif'],
        devanagari: ['var(--font-devanagari)', 'serif'],
        sans:       ['var(--font-inter)', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #C9A227 0%, #F5D060 40%, #E8B820 60%, #C9A227 100%)',
        'crimson-gradient': 'linear-gradient(135deg, #5C0000 0%, #8B0000 50%, #5C0000 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0A0000 0%, #1A0000 100%)',
      },
      keyframes: {
        shimmer: {
          '0%':   { transform: 'translateX(-100%) skewX(-20deg)' },
          '100%': { transform: 'translateX(300%) skewX(-20deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        'gold-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        shimmer:    'shimmer 3s infinite',
        float:      'float 4s ease-in-out infinite',
        'gold-pulse': 'gold-pulse 2s ease-in-out infinite',
        'spin-slow': 'spin-slow 20s linear infinite',
      },
      boxShadow: {
        'gold-glow': '0 0 30px rgba(201,162,39,0.5), 0 0 60px rgba(201,162,39,0.2)',
        'gold-sm':   '0 0 12px rgba(201,162,39,0.4)',
        'crimson-glow': '0 0 30px rgba(139,0,0,0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
