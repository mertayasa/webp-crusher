import type { Metadata } from 'next';
import ConvertFormat from '../../views/ConvertFormat';

export const metadata: Metadata = {
  title: 'Convert Image Format | Debali Printing Blog',
  description: 'Convert images between JPG, PNG, WebP, and BMP formats instantly and securely without uploading to a server.',
  keywords: ["image tools","client-side","private","convert image format","convert"],
  alternates: {
    canonical: 'https://imageslayer.com/convert',
  },
  openGraph: {
    title: 'Convert Image Format',
    description: 'Convert images between JPG, PNG, WebP, and BMP formats instantly and securely without uploading to a server.',
    url: 'https://imageslayer.com/convert',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.482Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Convert Image Format' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convert Image Format',
    description: 'Convert images between JPG, PNG, WebP, and BMP formats instantly and securely without uploading to a server.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Convert Image Format',
      description: 'Convert images between JPG, PNG, WebP, and BMP formats instantly and securely without uploading to a server.',
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
      mainEntityOfPage: 'https://imageslayer.com/convert',
    }),
  },
};

export default function Page() {
  return <ConvertFormat />;
}
