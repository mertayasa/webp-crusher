import type { Metadata } from 'next';
import CompressImage from '../../views/CompressImage';

export const metadata: Metadata = {
  title: 'Compress Image',
  description: 'Reduce file size without losing quality locally in your browser.',
};

export default function Page() {
  return <CompressImage />;
}
