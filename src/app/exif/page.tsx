import type { Metadata } from 'next';
import ExifClient from './ExifClient';

export const metadata: Metadata = {
  title: 'EXIF Viewer & Metadata Stripper | Debali Printing Blog',
  description: 'View hidden EXIF metadata (GPS, Camera, Dates) in your photos and securely strip it all out before sharing online. 100% private and local.',
  keywords: ["image tools","client-side","private","exif viewer & metadata stripper","exif"],
  alternates: {
    canonical: 'https://imageslayer.com/exif',
  },
  openGraph: {
    title: 'EXIF Viewer & Metadata Stripper',
    description: 'View hidden EXIF metadata (GPS, Camera, Dates) in your photos and securely strip it all out before sharing online. 100% private and local.',
    url: 'https://imageslayer.com/exif',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.484Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'EXIF Viewer & Metadata Stripper' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EXIF Viewer & Metadata Stripper',
    description: 'View hidden EXIF metadata (GPS, Camera, Dates) in your photos and securely strip it all out before sharing online. 100% private and local.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'EXIF Viewer & Metadata Stripper',
      description: 'View hidden EXIF metadata (GPS, Camera, Dates) in your photos and securely strip it all out before sharing online. 100% private and local.',
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
      datePublished: '2026-06-21T23:30:57.484Z',
      mainEntityOfPage: 'https://imageslayer.com/exif',
    }),
  },
};

export default function Page() {
  return <ExifClient />;
}
