"use client";
import dynamic from 'next/dynamic';

const SplitPdf = dynamic(() => import('../../views/SplitPdf'), { ssr: false });

export default function SplitPdfClient() {
  return <SplitPdf />;
}
