"use client";
import dynamic from 'next/dynamic';

const RemoveBackground = dynamic(() => import('../../views/RemoveBackground'), { ssr: false });

export default function RemoveBgClient() {
  return <RemoveBackground />;
}
