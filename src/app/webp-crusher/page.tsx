import type { Metadata } from 'next';
import WebpCrusher from '../../views/WebpCrusher';

export const metadata: Metadata = {
  title: 'WebP Crusher',
  description: 'Convert PNG and JPG images to the highly efficient WebP format locally in your browser for maximum compression.',
  alternates: { canonical: '/webp-crusher' },
};

export default function Page() {
  return <WebpCrusher />;
}
