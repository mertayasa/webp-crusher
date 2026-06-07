import type { Metadata } from 'next';
import IconClient from './IconClient';

export const metadata: Metadata = {
  title: 'Favicon & App Icon Generator',
  description: 'Instantly generate every required icon size for iOS, Android, and Web Favicons from a single image. Runs 100% locally in your browser.',
  alternates: { canonical: '/icon-generator' },
};

export default function Page() {
  return <IconClient />;
}
