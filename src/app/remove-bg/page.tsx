import type { Metadata } from 'next';
import RemoveBgClient from './RemoveBgClient';

export const metadata: Metadata = {
  title: 'AI Background Remover | Debali Printing Blog',
  description: 'Remove the background from any image automatically using local, browser-based AI models. 100% private and free.',
  keywords: ["image tools","client-side","private","ai background remover","remove bg"],
  alternates: {
    canonical: 'https://imageslayer.com/remove-bg',
  },
  openGraph: {
    title: 'AI Background Remover',
    description: 'Remove the background from any image automatically using local, browser-based AI models. 100% private and free.',
    url: 'https://imageslayer.com/remove-bg',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.487Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'AI Background Remover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Background Remover',
    description: 'Remove the background from any image automatically using local, browser-based AI models. 100% private and free.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'AI Background Remover',
      description: 'Remove the background from any image automatically using local, browser-based AI models. 100% private and free.',
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
      mainEntityOfPage: 'https://imageslayer.com/remove-bg',
    }),
  },
};

export default function Page() {
  return <RemoveBgClient />;
}
