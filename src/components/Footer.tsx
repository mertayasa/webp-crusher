import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-surface)',
      padding: '48px 24px 24px',
      marginTop: 'auto'
    }}>
      <div style={{
        maxWidth: 1000, 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '40px',
        marginBottom: '48px'
      }}>
        {/* Brand Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img 
              src="/logo-image-slayer-white-min.webp" 
              alt="Image Slayer Logo" 
              style={{ width: 32, height: 32, objectFit: 'contain' }} 
            />
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              Image Slayer
            </span>
          </Link>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
            The ultimate suite of fast, free, and 100% private image & PDF tools. All processing happens entirely in your browser — your files never leave your device.
          </p>
        </div>

        {/* Image Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Image Tools</h3>
          <Link href="/compress" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Compress Image</Link>
          <Link href="/convert" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Convert Format</Link>
          <Link href="/resize" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Resize Image</Link>
          <Link href="/remove-bg" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Remove Background</Link>
          <Link href="/upscale" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Upscale Image</Link>
        </div>

        {/* PDF Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>PDF Tools</h3>
          <Link href="/compress-pdf" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Compress PDF</Link>
          <Link href="/split-pdf" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Split PDF</Link>
          <Link href="/image-to-pdf" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Image to PDF</Link>
          <Link href="/pdf-to-image" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>PDF to Image</Link>
          <Link href="/watermark-pdf" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Watermark PDF</Link>
          <Link href="/sign-pdf" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Sign PDF</Link>
        </div>

        {/* Legal & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Legal & Info</h3>
          <Link href="#" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="#" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/about" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>About Us</Link>
          <Link href="/contact" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</Link>
        </div>
      </div>

      <div style={{
        maxWidth: 1000, 
        margin: '0 auto',
        paddingTop: '24px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          © {currentYear} Image Slayer. All rights reserved. Built for speed and privacy.
        </p>
      </div>
    </footer>
  );
}
