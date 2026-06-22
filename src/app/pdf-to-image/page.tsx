import type { Metadata } from 'next';
import PdfToImageClient from './PdfToImageClient';

export const metadata: Metadata = {
  title: 'PDF to Image Converter | Debali Printing Blog',
  description: 'Convert PDF document pages into high-quality JPG or PNG images instantly. 100% private and runs locally in your browser.',
  keywords: ["image tools","client-side","private","pdf to image converter","pdf to image"],
  alternates: {
    canonical: 'https://imageslayer.com/pdf-to-image',
  },
  openGraph: {
    title: 'PDF to Image Converter',
    description: 'Convert PDF document pages into high-quality JPG or PNG images instantly. 100% private and runs locally in your browser.',
    url: 'https://imageslayer.com/pdf-to-image',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.485Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'PDF to Image Converter' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF to Image Converter',
    description: 'Convert PDF document pages into high-quality JPG or PNG images instantly. 100% private and runs locally in your browser.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'PDF to Image Converter',
      description: 'Convert PDF document pages into high-quality JPG or PNG images instantly. 100% private and runs locally in your browser.',
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
      mainEntityOfPage: 'https://imageslayer.com/pdf-to-image',
    }),
  },
};

export default function Page() {
  return <PdfToImageClient />;
}
