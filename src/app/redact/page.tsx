import type { Metadata } from 'next';
import RedactClient from './RedactClient';

export const metadata: Metadata = {
  title: 'Blur & Redact Image',
  description: 'Blur, pixelate, or black out sensitive information in your images (like faces or documents). 100% private and secure image redaction.',
  alternates: { canonical: '/redact' },
};

export default function Page() {
  return <RedactClient />;
}
