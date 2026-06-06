import type { Metadata } from 'next';
import ResizeClient from './ResizeClient';

export const metadata: Metadata = {
  title: 'Resize Image',
  description: 'Change the dimensions of your images quickly and securely. 100% private client-side image resizer.',
  alternates: { canonical: '/resize' },
};

export default function Page() {
  return <ResizeClient />;
}
