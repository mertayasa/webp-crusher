import type { Metadata } from 'next';
import RemoveBgClient from './RemoveBgClient';

export const metadata: Metadata = {
  title: 'AI Background Remover',
  description: 'Remove the background from any image automatically using local AI models.',
};

export default function Page() {
  return <RemoveBgClient />;
}
