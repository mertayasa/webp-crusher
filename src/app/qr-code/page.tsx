import type { Metadata } from 'next';
import QrClient from './QrClient';

export const metadata: Metadata = {
  title: 'QR Code Generator & Reader',
  description: 'Generate or scan QR codes completely offline. Protect your privacy by scanning suspicious QR codes without uploading them.',
  alternates: { canonical: '/qr-code' },
};

export default function Page() {
  return <QrClient />;
}
