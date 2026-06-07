"use client";
import dynamic from 'next/dynamic';

const AddText = dynamic(() => import('../../views/AddText'), { ssr: false });

export default function AddTextClient() {
  return <AddText />;
}
