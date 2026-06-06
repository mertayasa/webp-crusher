"use client";
import dynamic from 'next/dynamic';

const VectorizeImage = dynamic(() => import('../../views/VectorizeImage'), { ssr: false });

export default function VectorizeClient() {
  return <VectorizeImage />;
}
