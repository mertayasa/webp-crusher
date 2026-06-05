import type { Metadata } from 'next';
import RotateImage from '../../views/RotateImage';

export const metadata: Metadata = {
  title: 'Rotate Image',
  description: 'Rotate or flip your images securely in your browser.',
};

export default function Page() {
  return <RotateImage />;
}
