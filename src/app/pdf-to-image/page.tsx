import type { Metadata } from 'next';
import PdfToImageClient from './PdfToImageClient';

export const metadata: Metadata = {
  title: 'PDF to Image Converter',
  description: 'Convert PDF document pages into high-quality JPG or PNG images instantly. 100% private and runs locally in your browser.',
  alternates: { canonical: '/pdf-to-image' },
};

export default function Page() {
  return <PdfToImageClient />;
}
