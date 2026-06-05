import type { Metadata } from 'next';
import ConvertFormat from '../../views/ConvertFormat';

export const metadata: Metadata = {
  title: 'Convert Format',
  description: 'Convert between various image formats securely.',
};

export default function Page() {
  return <ConvertFormat />;
}
