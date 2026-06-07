import type { Metadata } from 'next';
import AddTextClient from './AddTextClient';

export const metadata: Metadata = {
  title: 'Add Text & Captions to Image',
  description: 'Add text, memes, and captions to your images instantly. Fully private, browser-based image annotation tool.',
  alternates: { canonical: '/add-text' },
};

export default function Page() {
  return <AddTextClient />;
}
