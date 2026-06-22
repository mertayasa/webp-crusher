import type { Metadata } from 'next';
import ImageToPdfClient from './ImageToPdfClient';

export const metadata: Metadata = {
  title: 'Image to PDF Converter | Debali Printing Blog',
  description: 'Compile multiple images into a single PDF document locally in your browser. Fast, secure, and 100% private.',
  keywords: ["image tools","client-side","private","image to pdf converter","image to pdf"],
  alternates: {
    canonical: 'https://imageslayer.com/image-to-pdf',
  },
  openGraph: {
    title: 'Image to PDF Converter',
    description: 'Compile multiple images into a single PDF document locally in your browser. Fast, secure, and 100% private.',
    url: 'https://imageslayer.com/image-to-pdf',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.485Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Image to PDF Converter' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Image to PDF Converter',
    description: 'Compile multiple images into a single PDF document locally in your browser. Fast, secure, and 100% private.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Image to PDF Converter',
      description: 'Compile multiple images into a single PDF document locally in your browser. Fast, secure, and 100% private.',
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
      datePublished: '2026-06-21T23:30:57.485Z',
      mainEntityOfPage: 'https://imageslayer.com/image-to-pdf',
    }),
  },
};

export default function Page() {
  return <ImageToPdfClient />;
}
