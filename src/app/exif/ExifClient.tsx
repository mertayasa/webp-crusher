"use client";
import dynamic from 'next/dynamic';

const ExifViewer = dynamic(() => import('../../views/ExifViewer'), { ssr: false });

export default function ExifClient() {
  return <ExifViewer />;
}
