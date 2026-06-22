import type { Metadata } from 'next';
import ResizeClient from './ResizeClient';

export const metadata: Metadata = {
  title: 'Resize Image | Debali Printing Blog',
  description: 'Change the dimensions of your images quickly and securely. 100% private client-side image resizer.',
  keywords: ["image tools","client-side","private","resize image","resize"],
  alternates: {
    canonical: 'https://imageslayer.com/resize',
  },
  openGraph: {
    title: 'Resize Image',
    description: 'Change the dimensions of your images quickly and securely. 100% private client-side image resizer.',
    url: 'https://imageslayer.com/resize',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.487Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Resize Image' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resize Image',
    description: 'Change the dimensions of your images quickly and securely. 100% private client-side image resizer.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Resize Image',
      description: 'Change the dimensions of your images quickly and securely. 100% private client-side image resizer.',
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
      datePublished: '2026-06-21T23:30:57.487Z',
      mainEntityOfPage: 'https://imageslayer.com/resize',
    }),
  },
};

export default function Page() {
  return <ResizeClient />;
}
