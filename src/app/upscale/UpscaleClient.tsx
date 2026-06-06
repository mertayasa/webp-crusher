"use client";
import dynamic from 'next/dynamic';

const UpscaleImage = dynamic(() => import('../../views/UpscaleImage'), { ssr: false });

export default function UpscaleClient() {
  return <UpscaleImage />;
}
