import type { Metadata } from 'next';
import AddTextClient from './AddTextClient';

export const metadata: Metadata = {
  title: 'Add Text & Captions to Image | Debali Printing Blog',
  description: 'Add text, memes, and captions to your images instantly. Fully private, browser-based image annotation tool.',
  keywords: ["image tools","client-side","private","add text & captions to image","add text"],
  alternates: {
    canonical: 'https://imageslayer.com/add-text',
  },
  openGraph: {
    title: 'Add Text & Captions to Image',
    description: 'Add text, memes, and captions to your images instantly. Fully private, browser-based image annotation tool.',
    url: 'https://imageslayer.com/add-text',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.466Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Add Text & Captions to Image' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Add Text & Captions to Image',
    description: 'Add text, memes, and captions to your images instantly. Fully private, browser-based image annotation tool.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Add Text & Captions to Image',
      description: 'Add text, memes, and captions to your images instantly. Fully private, browser-based image annotation tool.',
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
      datePublished: '2026-06-21T23:30:57.466Z',
      mainEntityOfPage: 'https://imageslayer.com/add-text',
    }),
  },
};

export default function Page() {
  return <AddTextClient />;
}
