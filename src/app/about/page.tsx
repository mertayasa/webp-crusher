import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Zap, Lock, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Debali Printing Blog',
  description: 'Learn more about Image Slayer. The ultimate suite of fast, free, and 100% private browser-based image and PDF tools.',
  keywords: ["about us", "image tools", "client-side", "private", "image slayer", "debali printing"],
  alternates: {
    canonical: 'https://imageslayer.com/about',
  },
  openGraph: {
    title: 'About Us',
    description: 'Learn more about Image Slayer. The ultimate suite of fast, free, and 100% private browser-based image and PDF tools.',
    url: 'https://imageslayer.com/about',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: new Date().toISOString(),
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'About Us' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us',
    description: 'Learn more about Image Slayer. The ultimate suite of fast, free, and 100% private browser-based image and PDF tools.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'About Us',
      description: 'Learn more about Image Slayer. The ultimate suite of fast, free, and 100% private browser-based image and PDF tools.',
      image: ['https://imageslayer.com/image-slayer-artwork.webp'],
      author: {
        '@type': 'Organization',
        name: 'Debali Printing',
      },
      publisher: {
        '@type': 'Organization',
        name: 'Debali Printing',
        logo: {
          '@type': 'ImageObject',
          url: 'https://imageslayer.com/image-slayer-artwork.webp',
        },
      },
      mainEntityOfPage: 'https://imageslayer.com/about',
    }),
  },
};

export default function AboutPage() {
  return (
    <div style={{
      maxWidth: 900,
      margin: '0 auto',
      padding: '60px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '40px',
      animation: 'fade-in 0.5s ease-out'
    }}>
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--accent-glow)',
          border: '1px solid var(--accent)',
          marginBottom: '24px'
        }}>
          <img src="/logo-image-slayer-white-min.webp" alt="Logo" style={{ width: 44, height: 44, objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>
          About <span style={{ color: 'var(--accent)' }}>Image Slayer</span>
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto', lineHeight: '1.6' }}>
          We believe in a web where essential tools are fast, free, and most importantly—private.
        </p>
      </div>

      {/* Main Content */}
      <div className="glass-panel" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '40px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          Our Mission
        </h2>
        <p style={{ fontSize: '16px', color: 'var(--text)', lineHeight: '1.8', marginBottom: '20px' }}>
          Image Slayer was born out of frustration with online tools that force you to upload your sensitive documents and private photos to remote servers. We wanted a solution that was entirely client-side.
        </p>
        <p style={{ fontSize: '16px', color: 'var(--text)', lineHeight: '1.8' }}>
          By leveraging the power of WebAssembly and modern browser APIs, we've built a comprehensive suite of image and PDF tools that run entirely on your own device. Your files never leave your computer, ensuring absolute privacy and lightning-fast processing speeds.
        </p>
      </div>

      {/* Core Values Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px'
      }}>
        {/* Value 1 */}
        <div className="glass-panel" style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '12px', borderRadius: '50%', width: 'fit-content' }}>
            <Lock size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>100% Private</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            No uploads, no cloud servers. Everything is processed locally in your browser.
          </p>
        </div>

        {/* Value 2 */}
        <div className="glass-panel" style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '50%', width: 'fit-content' }}>
            <Zap size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Blazing Fast</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Utilizing your device's CPU instead of waiting for network uploads and downloads.
          </p>
        </div>

        {/* Value 3 */}
        <div className="glass-panel" style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '50%', width: 'fit-content' }}>
            <Shield size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Secure & Free</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            No sign-ups, no paywalls, and no watermarks on your processed files.
          </p>
        </div>
      </div>

    </div>
  );
}
