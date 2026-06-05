import type { Metadata } from 'next';
import ComingSoon from '../../views/ComingSoon';

export const metadata: Metadata = {
  title: 'Resize Image',
  description: 'Change dimensions of your images.',
};

export default function Page() {
  return <ComingSoon />;
}
