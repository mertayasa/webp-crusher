import type { Metadata } from 'next';
import RemoveBgClient from './RemoveBgClient';

export const metadata: Metadata = {
  title: 'AI Background Remover',
  description: 'Remove the background from any image automatically using local, browser-based AI models. 100% private and free.',
  alternates: { canonical: '/remove-bg' },
};

export default function Page() {
  return <RemoveBgClient />;
}
