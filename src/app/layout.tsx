import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/react';
import { Layers } from 'lucide-react';
import Link from 'next/link';

// Import global styles (we will move index.css to globals.css or just import it)
import '../index.css';
import '../App.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Image Slayer',
    default: 'Image Slayer | Private & Free Browser Image Tools',
  },
  description: '100% private, client-side media tools. Compress, resize, convert, crop, and watermark images securely in your browser.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Image Slayer | Private & Free Browser Image Tools',
    description: '100% private, client-side media tools. Compress, resize, convert, crop, and watermark images securely in your browser.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="root-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'transparent' }}>
          {/* Global Header */}
          <header style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            position: 'sticky', top: 0, zIndex: 10,
          }}>
            <div style={{
              maxWidth: 1000, margin: '0 auto', padding: '13px 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                <img 
                  src="/image-slayer-artwork.webp" 
                  alt="Image Slayer Logo" 
                  style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: 8, 
                    objectFit: 'cover', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    boxShadow: '0 0 12px var(--accent-glow)' 
                  }} 
                />
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                  Image Slayer
                </span>
              </Link>
              <span style={{
                fontSize: 11, color: 'var(--text-muted)',
                background: 'var(--bg-elevated)', padding: '3px 10px',
                borderRadius: 20, border: '1px solid var(--border)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}>
                Client-Side · Private
              </span>
            </div>
          </header>

          {/* Main Content Area */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {children}
          </div>

          <footer style={{
            padding: '14px 24px', textAlign: 'center',
            fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)',
            marginTop: 'auto'
          }}>
            All processing happens in your browser — files never leave your device.
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
