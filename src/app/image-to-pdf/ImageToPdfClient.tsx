"use client";
import dynamic from 'next/dynamic';

const ImageToPdf = dynamic(() => import('../../views/ImageToPdf'), { ssr: false });

export default function ImageToPdfClient() {
  return <ImageToPdf />;
}
