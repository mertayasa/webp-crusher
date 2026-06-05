import type { Metadata } from 'next';
import CropImage from '../../views/CropImage';

export const metadata: Metadata = {
  title: 'Crop Image',
  description: 'Crop out unwanted parts of an image locally.',
};

export default function Page() {
  return <CropImage />;
}
