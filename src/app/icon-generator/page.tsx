import type { Metadata } from 'next';
import IconClient from './IconClient';

export const metadata: Metadata = {
  title: 'Favicon & App Icon Generator | Debali Printing Blog',
  description: 'Instantly generate every required icon size for iOS, Android, and Web Favicons from a single image. Runs 100% locally in your browser.',
  keywords: ["image tools","client-side","private","favicon & app icon generator","icon generator"],
  alternates: {
    canonical: 'https://imageslayer.com/icon-generator',
  },
  openGraph: {
    title: 'Favicon & App Icon Generator',
    description: 'Instantly generate every required icon size for iOS, Android, and Web Favicons from a single image. Runs 100% locally in your browser.',
    url: 'https://imageslayer.com/icon-generator',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.484Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Favicon & App Icon Generator' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Favicon & App Icon Generator',
    description: 'Instantly generate every required icon size for iOS, Android, and Web Favicons from a single image. Runs 100% locally in your browser.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Favicon & App Icon Generator',
      description: 'Instantly generate every required icon size for iOS, Android, and Web Favicons from a single image. Runs 100% locally in your browser.',
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
      mainEntityOfPage: 'https://imageslayer.com/icon-generator',
    }),
  },
};

export default function Page() {
  return <IconClient />;
}
