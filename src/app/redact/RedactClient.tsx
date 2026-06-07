"use client";
import dynamic from 'next/dynamic';

const RedactImage = dynamic(() => import('../../views/RedactImage'), { ssr: false });

export default function RedactClient() {
  return <RedactImage />;
}
