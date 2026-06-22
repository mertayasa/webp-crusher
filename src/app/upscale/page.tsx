import type { Metadata } from 'next';
import UpscaleClient from './UpscaleClient';

export const metadata: Metadata = {
  title: 'AI Image Upscaler | Debali Printing Blog',
  description: 'Upscale your images 2x or 4x without losing quality using private, browser-based AI models (Real-ESRGAN).',
  keywords: ["image tools","client-side","private","ai image upscaler","upscale"],
  alternates: {
    canonical: 'https://imageslayer.com/upscale',
  },
  openGraph: {
    title: 'AI Image Upscaler',
    description: 'Upscale your images 2x or 4x without losing quality using private, browser-based AI models (Real-ESRGAN).',
    url: 'https://imageslayer.com/upscale',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.488Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'AI Image Upscaler' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Image Upscaler',
    description: 'Upscale your images 2x or 4x without losing quality using private, browser-based AI models (Real-ESRGAN).',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'AI Image Upscaler',
      description: 'Upscale your images 2x or 4x without losing quality using private, browser-based AI models (Real-ESRGAN).',
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
      datePublished: '2026-06-21T23:30:57.488Z',
      mainEntityOfPage: 'https://imageslayer.com/upscale',
    }),
  },
};

export default function Page() {
  return <UpscaleClient />;
}
