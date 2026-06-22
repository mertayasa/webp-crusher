import type { Metadata } from 'next';
import { Mail, MessageSquare, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us | Debali Printing Blog',
  description: 'Get in touch with Image Slayer. We would love to hear your feedback, feature requests, or help with any issues.',
  keywords: ["contact us", "support", "email", "image slayer", "debali printing"],
  alternates: {
    canonical: 'https://imageslayer.com/contact',
  },
  openGraph: {
    title: 'Contact Us',
    description: 'Get in touch with Image Slayer. We would love to hear your feedback, feature requests, or help with any issues.',
    url: 'https://imageslayer.com/contact',
    siteName: 'Debali Printing',
    type: 'article',
    publishedTime: new Date().toISOString(),
    authors: ['Debali Printing'],
    images: [{ url: 'https://imageslayer.com/image-slayer-artwork.webp', width: 800, height: 400, alt: 'Contact Us' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us',
    description: 'Get in touch with Image Slayer. We would love to hear your feedback, feature requests, or help with any issues.',
    images: ['https://imageslayer.com/image-slayer-artwork.webp'],
  },
  other: {
    'script:ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Us',
      description: 'Get in touch with Image Slayer. We would love to hear your feedback, feature requests, or help with any issues.',
      url: 'https://imageslayer.com/contact',
      publisher: {
        '@type': 'Organization',
        name: 'Debali Printing',
        logo: {
          '@type': 'ImageObject',
          url: 'https://imageslayer.com/image-slayer-artwork.webp',
        },
      },
    }),
  },
};

export default function ContactPage() {
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
      
      {/* Header Section */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h1 style={{ fontSize: '42px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>
          Get In <span style={{ color: 'var(--accent)' }}>Touch</span>
        </h1>
        <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto', lineHeight: '1.6' }}>
          Have questions, feature requests, or just want to say hi? We'd love to hear from you.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        
        {/* Contact Info Card */}
        <div className="glass-panel" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
            Contact Information
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: 'var(--accent)', background: 'var(--accent-subtle)', padding: '12px', borderRadius: '50%' }}>
              <Mail size={24} />
            </div>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Email Us</p>
              <a href="mailto:infodebali@gmail.com" style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', textDecoration: 'none', transition: 'color var(--transition)' }}>
                infodebali@gmail.com
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: 'var(--success)', background: 'var(--success-subtle)', padding: '12px', borderRadius: '50%' }}>
              <MessageSquare size={24} />
            </div>
            <div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Support Hours</p>
              <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', margin: 0 }}>
                24/7 Mon-Sun (Usually within 24h)
              </p>
            </div>
          </div>
          
        </div>

        {/* Message Form (Visual Only Placeholder or direct mailto action) */}
        <div className="glass-panel" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
            Send a message
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
            Prefer to reach out directly? Click the button below to open your default email client and drop us a line. We're always eager to improve Image Slayer based on your feedback.
          </p>
          
          <a href="mailto:infodebali@gmail.com?subject=Inquiry from Image Slayer" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: 'var(--accent)',
            color: '#ffffff',
            padding: '14px 24px',
            borderRadius: 'var(--radius)',
            fontSize: '16px',
            fontWeight: 600,
            textDecoration: 'none',
            marginTop: 'auto',
            transition: 'background var(--transition)',
            border: 'none',
            cursor: 'pointer'
          }}>
            <Mail size={18} />
            Email Support
          </a>
        </div>

      </div>
    </div>
  );
}
