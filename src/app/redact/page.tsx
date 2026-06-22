import type { Metadata } from 'next';
import RedactClient from './RedactClient';

export const metadata: Metadata = {
  title: 'Blur & Redact Image | Debali Printing Blog',
  description: 'Blur, pixelate, or black out sensitive information in your images (like faces or documents). 100% private and secure image redaction.',
  keywords: ["image tools","client-side","private","blur & redact image","redact"],
  alternates: {
    canonical: 'https://imageslayer.com/redact',
  },
  openGraph: {
    title: 'Blur & Redact Image',
    description: 'Blur, pixelate, or black out sensitive information in your images (like faces or documents). 100% private and secure image redaction.',
    url: 'https://imageslayer.com/redact',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.486Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Blur & Redact Image' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blur & Redact Image',
    description: 'Blur, pixelate, or black out sensitive information in your images (like faces or documents). 100% private and secure image redaction.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Blur & Redact Image',
      description: 'Blur, pixelate, or black out sensitive information in your images (like faces or documents). 100% private and secure image redaction.',
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
      datePublished: '2026-06-21T23:30:57.486Z',
      mainEntityOfPage: 'https://imageslayer.com/redact',
    }),
  },
};

export default function Page() {
  return <RedactClient />;
}
