import type { Metadata } from 'next';
import CompressPdfClient from './CompressPdfClient';

export const metadata: Metadata = {
  title: 'Compress PDF',
  description: 'Reduce PDF file sizes instantly and securely right in your browser. No files are ever uploaded to a server.',
  alternates: { canonical: '/compress-pdf' },
};

export default function Page() {
  return <CompressPdfClient />;
}
