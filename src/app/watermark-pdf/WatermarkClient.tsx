"use client";
import dynamic from 'next/dynamic';

const WatermarkPdf = dynamic(() => import('../../views/WatermarkPdf'), { ssr: false });

export default function WatermarkClient() {
  return <WatermarkPdf />;
}
