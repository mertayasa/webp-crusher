import type { Metadata } from 'next';
import ComingSoon from '../../views/ComingSoon';

export const metadata: Metadata = {
  title: 'PDF to Image',
  description: 'Extract pages from PDF to images.',
};

export default function Page() {
  return <ComingSoon />;
}
