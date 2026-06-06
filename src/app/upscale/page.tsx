import type { Metadata } from 'next';
import UpscaleClient from './UpscaleClient';

export const metadata: Metadata = {
  title: 'AI Image Upscaler',
  description: 'Upscale your images 2x or 4x without losing quality using private, browser-based AI models (Real-ESRGAN).',
  alternates: { canonical: '/upscale' },
};

export default function Page() {
  return <UpscaleClient />;
}
