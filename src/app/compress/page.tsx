import type { Metadata } from 'next';
import CompressImage from '../../views/CompressImage';

export const metadata: Metadata = {
  title: 'Compress Image | Debali Printing Blog',
  description: 'Reduce image file size instantly without losing quality. 100% private, runs entirely in your browser.',
  keywords: ["image tools","client-side","private","compress image","compress"],
  alternates: {
    canonical: 'https://imageslayer.com/compress',
  },
  openGraph: {
    title: 'Compress Image',
    description: 'Reduce image file size instantly without losing quality. 100% private, runs entirely in your browser.',
    url: 'https://imageslayer.com/compress',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.481Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Compress Image' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compress Image',
    description: 'Reduce image file size instantly without losing quality. 100% private, runs entirely in your browser.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Compress Image',
      description: 'Reduce image file size instantly without losing quality. 100% private, runs entirely in your browser.',
      image: ['https://imageslayer.com/image-slayer-artwork.webp'],
      author: {
        '@type': 'Organization',
        name: 'Debali Printing',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Debali Printing',
        logo: {
          '@type': 'ImageObject',
          url: 'https://imageslayer.com/image-slayer-artwork.webp',
        },
      },
      datePublished: '2026-06-21T23:30:57.481Z',
      mainEntityOfPage: 'https://imageslayer.com/compress',
    }),
  },
};

export default function Page() {
  return <CompressImage />;
}
