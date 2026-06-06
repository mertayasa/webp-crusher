import type { Metadata } from 'next';
import ImageToPdfClient from './ImageToPdfClient';

export const metadata: Metadata = {
  title: 'Image to PDF Converter',
  description: 'Compile multiple images into a single PDF document locally in your browser. Fast, secure, and 100% private.',
  alternates: { canonical: '/image-to-pdf' },
};

export default function Page() {
  return <ImageToPdfClient />;
}
