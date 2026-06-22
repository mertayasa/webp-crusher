import type { Metadata } from 'next';
import QrClient from './QrClient';

export const metadata: Metadata = {
  title: 'QR Code Generator & Reader | Debali Printing Blog',
  description: 'Generate or scan QR codes completely offline. Protect your privacy by scanning suspicious QR codes without uploading them.',
  keywords: ["image tools","client-side","private","qr code generator & reader","qr code"],
  alternates: {
    canonical: 'https://imageslayer.com/qr-code',
  },
  openGraph: {
    title: 'QR Code Generator & Reader',
    description: 'Generate or scan QR codes completely offline. Protect your privacy by scanning suspicious QR codes without uploading them.',
    url: 'https://imageslayer.com/qr-code',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.486Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'QR Code Generator & Reader' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Code Generator & Reader',
    description: 'Generate or scan QR codes completely offline. Protect your privacy by scanning suspicious QR codes without uploading them.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'QR Code Generator & Reader',
      description: 'Generate or scan QR codes completely offline. Protect your privacy by scanning suspicious QR codes without uploading them.',
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
      datePublished: '2026-06-21T23:30:57.486Z',
      mainEntityOfPage: 'https://imageslayer.com/qr-code',
    }),
  },
};

export default function Page() {
  return <QrClient />;
}
