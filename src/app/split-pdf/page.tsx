import type { Metadata } from 'next';
import SplitPdfClient from './SplitPdfClient';

export const metadata: Metadata = {
  title: 'Split & Extract PDF Pages | Debali Printing Blog',
  description: 'Extract specific pages or remove unwanted pages from a PDF document locally in your browser. Fast and completely private.',
  keywords: ["image tools","client-side","private","split & extract pdf pages","split pdf"],
  alternates: {
    canonical: 'https://imageslayer.com/split-pdf',
  },
  openGraph: {
    title: 'Split & Extract PDF Pages',
    description: 'Extract specific pages or remove unwanted pages from a PDF document locally in your browser. Fast and completely private.',
    url: 'https://imageslayer.com/split-pdf',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.488Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Split & Extract PDF Pages' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Split & Extract PDF Pages',
    description: 'Extract specific pages or remove unwanted pages from a PDF document locally in your browser. Fast and completely private.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Split & Extract PDF Pages',
      description: 'Extract specific pages or remove unwanted pages from a PDF document locally in your browser. Fast and completely private.',
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
      mainEntityOfPage: 'https://imageslayer.com/split-pdf',
    }),
  },
};

export default function Page() {
  return <SplitPdfClient />;
}
