"use client";
import dynamic from 'next/dynamic';

const PaletteGenerator = dynamic(() => import('../../views/PaletteGenerator'), { ssr: false });

export default function PaletteClient() {
  return <PaletteGenerator />;
}
