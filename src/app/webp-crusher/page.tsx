import type { Metadata } from 'next';
import WebpCrusher from '../../views/WebpCrusher';

export const metadata: Metadata = {
  title: 'WebP Crusher | Debali Printing Blog',
  description: 'Convert PNG and JPG images to the highly efficient WebP format locally in your browser for maximum compression.',
  keywords: ["image tools","client-side","private","webp crusher","webp crusher"],
  alternates: {
    canonical: 'https://imageslayer.com/webp-crusher',
  },
  openGraph: {
    title: 'WebP Crusher',
    description: 'Convert PNG and JPG images to the highly efficient WebP format locally in your browser for maximum compression.',
    url: 'https://imageslayer.com/webp-crusher',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.489Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'WebP Crusher' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WebP Crusher',
    description: 'Convert PNG and JPG images to the highly efficient WebP format locally in your browser for maximum compression.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'WebP Crusher',
      description: 'Convert PNG and JPG images to the highly efficient WebP format locally in your browser for maximum compression.',
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
      mainEntityOfPage: 'https://imageslayer.com/webp-crusher',
    }),
  },
};

export default function Page() {
  return <WebpCrusher />;
}
