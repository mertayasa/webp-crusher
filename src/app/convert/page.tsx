import type { Metadata } from 'next';
import ConvertFormat from '../../views/ConvertFormat';

export const metadata: Metadata = {
  title: 'Convert Image Format',
  description: 'Convert images between JPG, PNG, WebP, and BMP formats instantly and securely without uploading to a server.',
  alternates: { canonical: '/convert' },
};

export default function Page() {
  return <ConvertFormat />;
}
