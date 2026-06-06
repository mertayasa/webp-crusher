import type { Metadata } from 'next';
import WatermarkImage from '../../views/WatermarkImage';

export const metadata: Metadata = {
  title: 'Watermark Image',
  description: 'Protect your images by adding custom text or logo watermarks. Your files remain 100% private and are processed locally.',
  alternates: { canonical: '/watermark' },
};

export default function Page() {
  return <WatermarkImage />;
}
