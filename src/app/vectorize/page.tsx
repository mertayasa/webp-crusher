import type { Metadata } from 'next';
import VectorizeClient from './VectorizeClient';

export const metadata: Metadata = {
  title: 'Vectorize Image to SVG',
  description: 'Convert raster images (PNG, JPG) to scalable vector graphics (SVG) instantly. High-quality tracing running 100% locally.',
  alternates: { canonical: '/vectorize' },
};

export default function Page() {
  return <VectorizeClient />;
}
