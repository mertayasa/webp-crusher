import type { Metadata } from 'next';
import WatermarkImage from '../../views/WatermarkImage';

export const metadata: Metadata = {
  title: 'Watermark Image | Debali Printing Blog',
  description: 'Protect your images by adding custom text or logo watermarks. Your files remain 100% private and are processed locally.',
  keywords: ["image tools","client-side","private","watermark image","watermark"],
  alternates: {
    canonical: 'https://imageslayer.com/watermark',
  },
  openGraph: {
    title: 'Watermark Image',
    description: 'Protect your images by adding custom text or logo watermarks. Your files remain 100% private and are processed locally.',
    url: 'https://imageslayer.com/watermark',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: '2026-06-21T23:30:57.488Z',
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Watermark Image' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Watermark Image',
    description: 'Protect your images by adding custom text or logo watermarks. Your files remain 100% private and are processed locally.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Watermark Image',
      description: 'Protect your images by adding custom text or logo watermarks. Your files remain 100% private and are processed locally.',
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
      mainEntityOfPage: 'https://imageslayer.com/watermark',
    }),
  },
};

export default function Page() {
  return <WatermarkImage />;
}
