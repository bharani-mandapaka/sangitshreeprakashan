/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // Book covers uploaded via /admin/books are stored in Supabase Storage
    // (see app/api/admin/books/upload-cover/route.ts) and served from a
    // *.supabase.co URL, so next/image needs this host allow-listed. Wildcard
    // subdomain covers any Supabase project without hardcoding a project ref.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
