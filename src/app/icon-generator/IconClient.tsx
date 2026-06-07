"use client";
import dynamic from 'next/dynamic';

const IconGenerator = dynamic(() => import('../../views/IconGenerator'), { ssr: false });

export default function IconClient() {
  return <IconGenerator />;
}
