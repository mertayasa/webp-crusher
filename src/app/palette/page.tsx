import type { Metadata } from 'next';
import PaletteClient from './PaletteClient';

export const metadata: Metadata = {
  title: 'Color Palette Generator | Debali Printing Blog',
  description: 'Extract dominant colors and generate beautiful CSS hex palettes from any image, running instantly and securely in your browser.',
  keywords: ["image tools","client-side","private","color palette generator","palette"],
  alternates: {
    canonical: 'https://imageslayer.com/palette',
  },
  openGraph: {
    title: 'Color Palette Generator',
    description: 'Extract dominant colors and generate beautiful CSS hex palettes from any image, running instantly and securely in your browser.',
    url: 'https://imageslayer.com/palette',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.485Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Color Palette Generator' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Color Palette Generator',
    description: 'Extract dominant colors and generate beautiful CSS hex palettes from any image, running instantly and securely in your browser.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Color Palette Generator',
      description: 'Extract dominant colors and generate beautiful CSS hex palettes from any image, running instantly and securely in your browser.',
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
      datePublished: '2026-06-21T23:30:57.485Z',
      mainEntityOfPage: 'https://imageslayer.com/palette',
    }),
  },
};

export default function Page() {
  return <PaletteClient />;
}
