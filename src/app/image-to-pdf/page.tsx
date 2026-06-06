import type { Metadata } from 'next';
import ImageToPdfClient from './ImageToPdfClient';

export const metadata: Metadata = {
  title: 'Image to PDF',
  description: 'Convert multiple images into a single PDF document locally in your browser.',
};

export default function Page() {
  return <ImageToPdfClient />;
}
