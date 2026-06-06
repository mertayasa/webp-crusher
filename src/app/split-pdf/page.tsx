import type { Metadata } from 'next';
import SplitPdfClient from './SplitPdfClient';

export const metadata: Metadata = {
  title: 'Split & Extract PDF Pages',
  description: 'Extract specific pages or remove unwanted pages from a PDF document locally in your browser. Fast and completely private.',
  alternates: { canonical: '/split-pdf' },
};

export default function Page() {
  return <SplitPdfClient />;
}
