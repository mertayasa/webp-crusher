import type { Metadata } from 'next';
import ResizeClient from './ResizeClient';

export const metadata: Metadata = {
  title: 'Resize Image',
  description: 'Change dimensions of your images.',
};

export default function Page() {
  return <ResizeClient />;
}
