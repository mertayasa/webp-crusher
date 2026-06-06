import type { Metadata } from 'next';
import PaletteClient from './PaletteClient';

export const metadata: Metadata = {
  title: 'Palette Generator',
  description: 'Extract dominant colors and generate beautiful CSS palettes from any image, locally in your browser.',
};

export default function Page() {
  return <PaletteClient />;
}
