import type { Metadata } from 'next';
import RotateImage from '../../views/RotateImage';

export const metadata: Metadata = {
  title: 'Rotate Image | Debali Printing Blog',
  description: 'Rotate and flip your images locally and instantly without uploading them to any server.',
  keywords: ["image tools","client-side","private","rotate image","rotate"],
  alternates: {
    canonical: 'https://imageslayer.com/rotate',
  },
  openGraph: {
    title: 'Rotate Image',
    description: 'Rotate and flip your images locally and instantly without uploading them to any server.',
    url: 'https://imageslayer.com/rotate',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.487Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Rotate Image' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rotate Image',
    description: 'Rotate and flip your images locally and instantly without uploading them to any server.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Rotate Image',
      description: 'Rotate and flip your images locally and instantly without uploading them to any server.',
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
      mainEntityOfPage: 'https://imageslayer.com/rotate',
    }),
  },
};

export default function Page() {
  return <RotateImage />;
}
