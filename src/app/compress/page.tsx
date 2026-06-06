import type { Metadata } from 'next';
import CompressImage from '../../views/CompressImage';

export const metadata: Metadata = {
  title: 'Compress Image',
  description: 'Reduce image file size instantly without losing quality. 100% private, runs entirely in your browser.',
  alternates: { canonical: '/compress' },
};

export default function Page() {
  return <CompressImage />;
}
