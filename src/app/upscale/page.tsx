import type { Metadata } from 'next';
import ComingSoon from '../../views/ComingSoon';

export const metadata: Metadata = {
  title: 'Upscale Image',
  description: 'Increase resolution with AI.',
};

export default function Page() {
  return <ComingSoon />;
}
