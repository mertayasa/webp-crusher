import type { Metadata } from 'next';
import HomeView from '../views/Home';

export const metadata: Metadata = {
  title: 'Image Slayer | Private & Free Browser Image Tools',
  description: '100% private, client-side media tools. Compress, resize, convert, crop, and watermark images securely in your browser.',
};

export default function Page() {
  return <HomeView />;
}
