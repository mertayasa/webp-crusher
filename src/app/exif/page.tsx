import type { Metadata } from 'next';
import ExifClient from './ExifClient';

export const metadata: Metadata = {
  title: 'EXIF Viewer & Metadata Stripper',
  description: 'View hidden EXIF metadata (GPS, Camera, Dates) in your photos and securely strip it all out before sharing online. 100% private and local.',
  alternates: { canonical: '/exif' },
};

export default function Page() {
  return <ExifClient />;
}
