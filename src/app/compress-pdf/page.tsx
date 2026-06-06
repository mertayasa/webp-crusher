import type { Metadata } from 'next';
import CompressPdfClient from './CompressPdfClient';

export const metadata: Metadata = {
  title: 'Compress PDF',
  description: 'Compress and optimize PDF file sizes locally in your browser.',
};

export default function Page() {
  return <CompressPdfClient />;
}
