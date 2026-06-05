import type { Metadata } from 'next';
import WatermarkImage from '../../views/WatermarkImage';

export const metadata: Metadata = {
  title: 'Watermark Image',
  description: 'Add text or logo watermarks completely private and client-side.',
};

export default function Page() {
  return <WatermarkImage />;
}
