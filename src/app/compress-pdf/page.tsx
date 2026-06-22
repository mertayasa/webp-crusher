import type { Metadata } from 'next';
import CompressPdfClient from './CompressPdfClient';

export const metadata: Metadata = {
  title: 'Compress PDF | Debali Printing Blog',
  description: 'Reduce PDF file sizes instantly and securely right in your browser. No files are ever uploaded to a server.',
  keywords: ["image tools","client-side","private","compress pdf","compress pdf"],
  alternates: {
    canonical: 'https://imageslayer.com/compress-pdf',
  },
  openGraph: {
    title: 'Compress PDF',
    description: 'Reduce PDF file sizes instantly and securely right in your browser. No files are ever uploaded to a server.',
    url: 'https://imageslayer.com/compress-pdf',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.482Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Compress PDF' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compress PDF',
    description: 'Reduce PDF file sizes instantly and securely right in your browser. No files are ever uploaded to a server.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Compress PDF',
      description: 'Reduce PDF file sizes instantly and securely right in your browser. No files are ever uploaded to a server.',
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
      datePublished: '2026-06-21T23:30:57.482Z',
      mainEntityOfPage: 'https://imageslayer.com/compress-pdf',
    }),
  },
};

export default function Page() {
  return <CompressPdfClient />;
}
