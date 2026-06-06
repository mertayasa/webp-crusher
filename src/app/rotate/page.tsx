import type { Metadata } from 'next';
import RotateImage from '../../views/RotateImage';

export const metadata: Metadata = {
  title: 'Rotate Image',
  description: 'Rotate and flip your images locally and instantly without uploading them to any server.',
  alternates: { canonical: '/rotate' },
};

export default function Page() {
  return <RotateImage />;
}
