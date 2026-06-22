import type { Metadata } from 'next';
import WatermarkClient from './WatermarkClient';

export const metadata: Metadata = {
  title: 'Watermark PDF | Debali Printing Blog',
  description: 'Add a custom text watermark to every page of your PDF instantly. Runs 100% locally in your browser for total privacy.',
  keywords: ["image tools","client-side","private","watermark pdf","watermark pdf"],
  alternates: {
    canonical: 'https://imageslayer.com/watermark-pdf',
  },
  openGraph: {
    title: 'Watermark PDF',
    description: 'Add a custom text watermark to every page of your PDF instantly. Runs 100% locally in your browser for total privacy.',
    url: 'https://imageslayer.com/watermark-pdf',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.489Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Watermark PDF' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watermark PDF',
    description: 'Add a custom text watermark to every page of your PDF instantly. Runs 100% locally in your browser for total privacy.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Watermark PDF',
      description: 'Add a custom text watermark to every page of your PDF instantly. Runs 100% locally in your browser for total privacy.',
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
      datePublished: '2026-06-21T23:30:57.489Z',
      mainEntityOfPage: 'https://imageslayer.com/watermark-pdf',
    }),
  },
};

export default function Page() {
  return <WatermarkClient />;
}
