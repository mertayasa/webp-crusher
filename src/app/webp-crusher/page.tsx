import type { Metadata } from 'next';
import WebpCrusher from '../../views/WebpCrusher';

export const metadata: Metadata = {
  title: 'WebP Crusher',
  description: 'Convert PNG & JPG to WebP efficiently and locally.',
};

export default function Page() {
  return <WebpCrusher />;
}
