import { Routes, Route, Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { Layers } from 'lucide-react';
import WebpCrusher from './pages/WebpCrusher';
import ConvertFormat from './pages/ConvertFormat';
import CompressImage from './pages/CompressImage';
import RotateImage from './pages/RotateImage';
import CropImage from './pages/CropImage';
import WatermarkImage from './pages/WatermarkImage';
import Home from './pages/Home';
import ComingSoon from './pages/ComingSoon';
import './App.css';

export default function App() {
  return (
    <div style={s.root}>
      {/* Global Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <Link style={s.logo} to="/">
            <div style={s.logoIcon}><Layers size={18} color="#fff" /></div>
            <span style={s.logoText}>Media Tools</span>
          </Link>
          <span style={s.headerBadge}>Client-Side · Private</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={s.content}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/webp-crusher" element={<WebpCrusher />} />
          <Route path="/convert" element={<ConvertFormat />} />
          <Route path="/compress" element={<CompressImage />} />
          <Route path="/rotate" element={<RotateImage />} />
          <Route path="/crop" element={<CropImage />} />
          <Route path="/watermark" element={<WatermarkImage />} />
          <Route path="*" element={<ComingSoon />} />
        </Routes>
      </div>

      <footer style={s.footer}>
        All processing happens in your browser — files never leave your device.
      </footer>
    </div>
  );
}

const s: Record<string, CSSProperties> = {
  root: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' },
  header: {
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    position: 'sticky', top: 0, zIndex: 10,
  },
  headerInner: {
    maxWidth: 1000, margin: '0 auto', padding: '13px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  logoIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 14px var(--accent-glow)',
  },
  logoText: { fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' },
  headerBadge: {
    fontSize: 11, color: 'var(--text-muted)',
    background: 'var(--bg-elevated)', padding: '3px 10px',
    borderRadius: 20, border: '1px solid var(--border)',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  footer: {
    padding: '14px 24px', textAlign: 'center',
    fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)',
    marginTop: 'auto'
  },
};
