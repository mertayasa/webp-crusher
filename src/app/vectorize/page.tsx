import type { Metadata } from 'next';
import VectorizeClient from './VectorizeClient';

export const metadata: Metadata = {
  title: 'Image Vectorizer',
  description: 'Convert PNG, JPG, and WebP images to scalable SVG vector files. Free, private, 100% in-browser.',
};

export default function Page() {
  return <VectorizeClient />;
}
