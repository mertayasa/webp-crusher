"use client";
import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import {
  Upload,
  Download,
  Trash2,
  AppWindow,
  CheckCircle2,
  Package,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import '../App.css';

const ICON_CONFIGS = [
  // Web Favicons
  { name: 'web/favicon.ico', size: 32, isIco: true },
  { name: 'web/favicon-16x16.png', size: 16 },
  { name: 'web/favicon-32x32.png', size: 32 },
  { name: 'web/apple-touch-icon.png', size: 180 },
  { name: 'web/android-chrome-192x192.png', size: 192 },
  { name: 'web/android-chrome-512x512.png', size: 512 },
  
  // iOS App Icons
  { name: 'ios/Icon-App-20x20@1x.png', size: 20 },
  { name: 'ios/Icon-App-20x20@2x.png', size: 40 },
  { name: 'ios/Icon-App-20x20@3x.png', size: 60 },
  { name: 'ios/Icon-App-29x29@1x.png', size: 29 },
  { name: 'ios/Icon-App-29x29@2x.png', size: 58 },
  { name: 'ios/Icon-App-29x29@3x.png', size: 87 },
  { name: 'ios/Icon-App-40x40@1x.png', size: 40 },
  { name: 'ios/Icon-App-40x40@2x.png', size: 80 },
  { name: 'ios/Icon-App-40x40@3x.png', size: 120 },
  { name: 'ios/Icon-App-60x60@2x.png', size: 120 },
  { name: 'ios/Icon-App-60x60@3x.png', size: 180 },
  { name: 'ios/Icon-App-76x76@1x.png', size: 76 },
  { name: 'ios/Icon-App-76x76@2x.png', size: 152 },
  { name: 'ios/Icon-App-83.5x83.5@2x.png', size: 167 },
  { name: 'ios/Icon-App-1024x1024@1x.png', size: 1024 },
  
  // Android (Legacy / Standardized formats for manifest)
  { name: 'android/mipmap-mdpi/ic_launcher.png', size: 48 },
  { name: 'android/mipmap-hdpi/ic_launcher.png', size: 72 },
  { name: 'android/mipmap-xhdpi/ic_launcher.png', size: 96 },
  { name: 'android/mipmap-xxhdpi/ic_launcher.png', size: 144 },
  { name: 'android/mipmap-xxxhdpi/ic_launcher.png', size: 192 },
  { name: 'android/playstore-icon.png', size: 512 },
];

export default function IconGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const clearAll = useCallback(() => {
    setFile(null);
    setImageSrc(null);
    setProgress(0);
    setIsGenerating(false);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const droppedFile = acceptedFiles[0];
    if (!droppedFile) return;

    setFile(droppedFile);
    const url = URL.createObjectURL(droppedFile);
    setImageSrc(url);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    multiple: false,
  });

  const generateZip = async () => {
    if (!imageSrc) return;
    setIsGenerating(true);
    setProgress(0);

    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      const zip = new JSZip();
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!ctx) throw new Error('Canvas 2D context not available');

      // We will iterate and generate each size sequentially
      for (let i = 0; i < ICON_CONFIGS.length; i++) {
        const config = ICON_CONFIGS[i];
        
        canvas.width = config.size;
        canvas.height = config.size;
        
        ctx.clearRect(0, 0, config.size, config.size);
        
        // High quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(img, 0, 0, config.size, config.size);

        // Convert to blob
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        
        if (blob) {
          if ((config as any).isIco) {
            const pngBuffer = await blob.arrayBuffer();
            const pngSize = pngBuffer.byteLength;
            const icoBuffer = new ArrayBuffer(22 + pngSize);
            const view = new DataView(icoBuffer);
            
            // ICO Header (6 bytes)
            view.setUint16(0, 0, true); // Reserved
            view.setUint16(2, 1, true); // Type (1 = ICO)
            view.setUint16(4, 1, true); // Count (1 image)
            
            // Image Directory (16 bytes)
            view.setUint8(6, config.size); // Width
            view.setUint8(7, config.size); // Height
            view.setUint8(8, 0); // Color count
            view.setUint8(9, 0); // Reserved
            view.setUint16(10, 1, true); // Planes
            view.setUint16(12, 32, true); // BPP
            view.setUint32(14, pngSize, true); // Size
            view.setUint32(18, 22, true); // Offset
            
            // Copy PNG data
            new Uint8Array(icoBuffer, 22).set(new Uint8Array(pngBuffer));
            
            zip.file(config.name, new Blob([icoBuffer], { type: 'image/x-icon' }));
          } else {
            zip.file(config.name, blob);
          }
        }

        // Update progress UI (artificially slowed down slightly if it's too fast, so user sees it working)
        setProgress(Math.round(((i + 1) / ICON_CONFIGS.length) * 100));
        // Small yield to allow React to render progress
        await new Promise(r => setTimeout(r, 10)); 
      }

      // Add a simple index.html for web favicons demo
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Favicon Preview</title>
  <link rel="icon" type="image/x-icon" href="/web/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/web/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/web/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/web/favicon-16x16.png">
</head>
<body>
  <h1>Your Favicons are ready!</h1>
</body>
</html>
      `.trim();
      zip.file('web/index.html', htmlContent);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, 'ImageSlayer-Icons.zip');

    } catch (e) {
      console.error(e);
      alert('Failed to generate icons.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>Icon Set Generator</h1>
        <p style={s.toolDesc}>
          Upload a single 1024x1024 logo and instantly download a <strong>ZIP file</strong> containing every icon size needed for iOS, Android, and Web Favicons.
        </p>
      </div>

      {!file && (
        <div
          {...getRootProps()}
          style={{
            ...s.dropzone,
            ...(isDragActive && !isDragReject ? s.dropzoneActive : {}),
            ...(isDragReject ? s.dropzoneReject : {}),
          }}
        >
          <input {...getInputProps()} />
          <div style={s.dropContent}>
            <div style={{ ...s.dropIcon, ...(isDragActive ? s.dropIconActive : {}) }}>
              <Upload size={26} color={isDragReject ? 'var(--error)' : 'var(--accent)'} />
            </div>
            <p style={s.dropTitle}>
              {isDragReject
                ? 'Only images (JPG, PNG) are supported'
                : isDragActive
                  ? 'Release to upload logo!'
                  : 'Drop your high-res logo here (1024x1024 recommended)'}
            </p>
          </div>
        </div>
      )}

      {file && (
        <div style={s.resultBox}>
          <div style={s.previewHeader}>
            <div style={s.previewInfo}>
              <div style={s.previewThumbWrap}>
                <img src={imageSrc || ''} alt="Preview" style={s.previewThumb} />
              </div>
              <div>
                <h3 style={s.fileName}>{file.name}</h3>
                <span style={s.fileBadge}>Ready to generate {ICON_CONFIGS.length} icons</span>
              </div>
            </div>
            <button style={s.btnGhostDanger} onClick={clearAll} disabled={isGenerating}>
              <Trash2 size={16} /> Cancel
            </button>
          </div>

          <div style={s.contentArea}>
            <div style={s.iconGrid}>
              <div style={s.platformCard}>
                <div style={s.platformIcon}><AppWindow size={24} color="#3b82f6"/></div>
                <h4>Web Favicons</h4>
                <p>16x16, 32x32, 192x192, 512x512, Apple Touch Icon</p>
              </div>
              <div style={s.platformCard}>
                <div style={s.platformIcon}><Package size={24} color="#8b5cf6"/></div>
                <h4>iOS App Icons</h4>
                <p>All standard resolutions from 20x20 up to 1024x1024 (@1x, @2x, @3x)</p>
              </div>
              <div style={s.platformCard}>
                <div style={s.platformIcon}><Package size={24} color="#10b981"/></div>
                <h4>Android Icons</h4>
                <p>Standard mipmap sizes (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi) and Play Store</p>
              </div>
            </div>
            
            {isGenerating && (
              <div style={s.progressWrap}>
                <div style={s.progressBar}><div style={{...s.progressFill, width: `${progress}%`}} /></div>
                <span style={s.progressText}>Generating... {progress}%</span>
              </div>
            )}
          </div>

          <div style={s.actions}>
            <p style={s.actionDesc}>
              This runs entirely in your browser using local canvas processing.
            </p>
            <button 
              style={{...s.btnPrimary, ...(isGenerating ? s.btnDisabled : {})}} 
              onClick={generateZip}
              disabled={isGenerating}
            >
              {isGenerating ? <><CheckCircle2 size={16} /> Packaging...</> : <><Download size={16} /> Generate & Download ZIP</>}
            </button>
          </div>
        </div>
      )}

      <OtherTools currentToolId="icon-generator" />
    </main>
  );
}

const s: Record<string, CSSProperties> = {
  main: {
    flex: 1, maxWidth: 800, width: '100%', margin: '0 auto',
    padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16,
  },
  toolHero: { marginBottom: 4 },
  toolTitle: { fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.5px' },
  toolDesc: { fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 },
  
  dropzone: {
    border: '2px dashed var(--border)', borderRadius: 'var(--radius-xl)',
    padding: '60px 24px', textAlign: 'center', cursor: 'pointer',
    background: 'var(--bg-surface)', outline: 'none', userSelect: 'none',
    transition: 'all 250ms ease',
  },
  dropzoneActive: { border: '2px dashed var(--accent)', background: 'var(--accent-subtle)', boxShadow: 'var(--shadow-glow)' },
  dropzoneReject: { border: '2px dashed var(--error)', background: 'var(--error-subtle)' },
  dropContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' },
  dropIcon: {
    width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-subtle)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, transition: 'all 250ms ease',
  },
  dropIconActive: { background: 'var(--accent-glow)', border: '1px solid var(--accent)', transform: 'scale(1.1)' },
  dropTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },

  resultBox: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', overflow: 'hidden',
    boxShadow: 'var(--shadow-card)',
  },
  
  previewHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
  },
  previewInfo: { display: 'flex', alignItems: 'center', gap: 16 },
  previewThumbWrap: { 
    width: 64, height: 64, borderRadius: 16, background: '#f8fafc',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    border: '1px solid var(--border)' 
  },
  previewThumb: { width: '100%', height: '100%', objectFit: 'contain' },
  fileName: { fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 },
  fileBadge: { fontSize: 12, fontWeight: 600, padding: '2px 8px', background: 'var(--accent-subtle)', border: '1px solid var(--accent)', borderRadius: 12, color: 'var(--accent)' },
  
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
    background: 'rgba(239,68,68,0.06)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },

  contentArea: { padding: 24, display: 'flex', flexDirection: 'column', gap: 24 },
  
  iconGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16,
  },
  platformCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    padding: 20, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', gap: 8,
  },
  platformIcon: { marginBottom: 4 },

  progressWrap: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%' },
  progressBar: { width: '100%', height: 8, background: 'var(--bg-surface)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' },
  progressFill: { height: '100%', background: 'var(--accent)', transition: 'width 100ms ease' },
  progressText: { fontSize: 12, fontWeight: 600, color: 'var(--accent)', textAlign: 'center' },

  actions: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
  },
  actionDesc: { fontSize: 13, color: 'var(--text-muted)', maxWidth: 400 },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease',
  },
  btnDisabled: { opacity: 0.7, cursor: 'not-allowed' }
};
