"use client";
import dynamic from 'next/dynamic';

const QrCode = dynamic(() => import('../../views/QrCode'), { ssr: false });

export default function QrClient() {
  return <QrCode />;
}
