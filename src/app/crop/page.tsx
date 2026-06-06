import type { Metadata } from 'next';
import CropImage from '../../views/CropImage';

export const metadata: Metadata = {
  title: 'Crop Image',
  description: 'Crop out unwanted parts of an image easily. A fast, browser-based, 100% private image cropper.',
  alternates: { canonical: '/crop' },
};

export default function Page() {
  return <CropImage />;
}
