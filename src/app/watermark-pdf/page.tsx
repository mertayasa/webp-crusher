import type { Metadata } from 'next';
import WatermarkClient from './WatermarkClient';

export const metadata: Metadata = {
  title: 'Watermark PDF',
  description: 'Add a custom text watermark to every page of your PDF instantly. Runs 100% locally in your browser for total privacy.',
  alternates: { canonical: '/watermark-pdf' },
};

export default function Page() {
  return <WatermarkClient />;
}
