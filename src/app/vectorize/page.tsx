import type { Metadata } from 'next';
import VectorizeClient from './VectorizeClient';

export const metadata: Metadata = {
  title: 'Vectorize Image to SVG | Debali Printing Blog',
  description: 'Convert raster images (PNG, JPG) to scalable vector graphics (SVG) instantly. High-quality tracing running 100% locally.',
  keywords: ["image tools","client-side","private","vectorize image to svg","vectorize"],
  alternates: {
    canonical: 'https://imageslayer.com/vectorize',
  },
  openGraph: {
    title: 'Vectorize Image to SVG',
    description: 'Convert raster images (PNG, JPG) to scalable vector graphics (SVG) instantly. High-quality tracing running 100% locally.',
    url: 'https://imageslayer.com/vectorize',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.488Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Vectorize Image to SVG' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vectorize Image to SVG',
    description: 'Convert raster images (PNG, JPG) to scalable vector graphics (SVG) instantly. High-quality tracing running 100% locally.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Vectorize Image to SVG',
      description: 'Convert raster images (PNG, JPG) to scalable vector graphics (SVG) instantly. High-quality tracing running 100% locally.',
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
      datePublished: '2026-06-21T23:30:57.488Z',
      mainEntityOfPage: 'https://imageslayer.com/vectorize',
    }),
  },
};

export default function Page() {
  return <VectorizeClient />;
}
