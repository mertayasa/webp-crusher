import type { Metadata } from 'next';
import SignPDF from '../../views/SignPDF';

export const metadata: Metadata = {
  title: 'Sign PDF | Debali Printing Blog',
  description: 'Sign your PDF documents securely in your browser. Add drawn or uploaded signatures, 100% private.',
  keywords: ["sign pdf", "pdf signature", "client-side", "private", "pdf tools", "image slayer"],
  alternates: {
    canonical: 'https://imageslayer.com/sign-pdf',
  },
  openGraph: {
    title: 'Sign PDF',
    description: 'Sign your PDF documents securely in your browser. Add drawn or uploaded signatures, 100% private.',
    url: 'https://imageslayer.com/sign-pdf',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: new Date().toISOString(),
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Sign PDF' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign PDF',
    description: 'Sign your PDF documents securely in your browser. Add drawn or uploaded signatures, 100% private.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Sign PDF',
      description: 'Sign your PDF documents securely in your browser. Add drawn or uploaded signatures, 100% private.',
      url: 'https://imageslayer.com/sign-pdf',
      publisher: {
        '@type': 'Organization',
        name: 'Debali Printing',
        logo: {
          '@type': 'ImageObject',
          url: 'https://imageslayer.com/image-slayer-artwork.webp',
        },
      },
    }),
  },
};

export default function Page() {
  return <SignPDF />;
}
