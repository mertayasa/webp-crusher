"use client";
import dynamic from 'next/dynamic';

const CompressPdf = dynamic(() => import('../../views/CompressPdf'), { ssr: false });

export default function CompressPdfClient() {
  return <CompressPdf />;
}
