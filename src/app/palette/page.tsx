import type { Metadata } from 'next';
import PaletteClient from './PaletteClient';

export const metadata: Metadata = {
  title: 'Color Palette Generator',
  description: 'Extract dominant colors and generate beautiful CSS hex palettes from any image, running instantly and securely in your browser.',
  alternates: { canonical: '/palette' },
};

export default function Page() {
  return <PaletteClient />;
}
