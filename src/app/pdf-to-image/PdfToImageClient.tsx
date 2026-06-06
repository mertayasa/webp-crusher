"use client";
import dynamic from 'next/dynamic';

const PdfToImage = dynamic(() => import('../../views/PdfToImage'), { ssr: false });

export default function PdfToImageClient() {
  return <PdfToImage />;
}
