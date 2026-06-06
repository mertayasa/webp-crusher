import type { Metadata } from 'next';
import PdfToImageClient from './PdfToImageClient';

export const metadata: Metadata = {
  title: 'PDF to Image',
  description: 'Extract pages from PDF to images.',
};

export default function Page() {
  return <PdfToImageClient />;
}
