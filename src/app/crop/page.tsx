import type { Metadata } from 'next';
import CropImage from '../../views/CropImage';

export const metadata: Metadata = {
  title: 'Crop Image | Debali Printing Blog',
  description: 'Crop out unwanted parts of an image easily. A fast, browser-based, 100% private image cropper.',
  keywords: ["image tools","client-side","private","crop image","crop"],
  alternates: {
    canonical: 'https://imageslayer.com/crop',
  },
  openGraph: {
    title: 'Crop Image',
    description: 'Crop out unwanted parts of an image easily. A fast, browser-based, 100% private image cropper.',
    url: 'https://imageslayer.com/crop',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.483Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Crop Image' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crop Image',
    description: 'Crop out unwanted parts of an image easily. A fast, browser-based, 100% private image cropper.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Crop Image',
      description: 'Crop out unwanted parts of an image easily. A fast, browser-based, 100% private image cropper.',
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
      datePublished: '2026-06-21T23:30:57.483Z',
      mainEntityOfPage: 'https://imageslayer.com/crop',
    }),
  },
};

export default function Page() {
  return <CropImage />;
}
