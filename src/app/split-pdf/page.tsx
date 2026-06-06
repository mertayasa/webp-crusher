import type { Metadata } from 'next';
import SplitPdfClient from './SplitPdfClient';

export const metadata: Metadata = {
  title: 'Split PDF',
  description: 'Extract specific pages or remove unwanted pages from a PDF document locally in your browser.',
};

export default function Page() {
  return <SplitPdfClient />;
}
