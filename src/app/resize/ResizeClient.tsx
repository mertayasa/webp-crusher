"use client";
import dynamic from 'next/dynamic';

const ResizeImage = dynamic(() => import('../../views/ResizeImage'), { ssr: false });

export default function ResizeClient() {
  return <ResizeImage />;
}
