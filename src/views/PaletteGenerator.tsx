"use client";
import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import { Vibrant } from 'node-vibrant/browser';
import {
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  Palette,
  Copy,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import '../App.css';

type Status = 'idle' | 'loading' | 'done' | 'error';

interface SwatchData {
  name: string;
  hex: string;
  rgb: [number, number, number];
  titleTextHex: string;
}

export default function PaletteGenerator() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [swatches, setSwatches] = useState<SwatchData[]>([]);
  const [copiedHex, setCopiedHex] = useState<string>('');

  const clearAll = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
    setSwatches([]);
    setStatus('idle');
    setError('');
    setCopiedHex('');
  }, [previewUrl]);

  const extractPalette = async (imageUrl: string) => {
    setStatus('loading');
    setError('');
    
    try {
      // In the browser, node-vibrant uses an Image element
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = imageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const palette = await Vibrant.from(img).getPalette();
      
      const newSwatches: SwatchData[] = [];
      
      const map = {
        'Vibrant': palette.Vibrant,
        'Muted': palette.Muted,
        'Dark Vibrant': palette.DarkVibrant,
        'Dark Muted': palette.DarkMuted,
        'Light Vibrant': palette.LightVibrant,
        'Light Muted': palette.LightMuted,
      };

      for (const [name, swatch] of Object.entries(map)) {
        if (swatch) {
          newSwatches.push({
            name,
            hex: swatch.hex,
            rgb: swatch.rgb as [number, number, number],
            titleTextHex: swatch.titleTextColor || '#000',
          });
        }
      }

      setSwatches(newSwatches);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setError('Failed to extract colors. The image might be corrupted or unsupported.');
      setStatus('error');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;

    clearAll();
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    
    await extractPalette(url);
  }, [clearAll]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/bmp': ['.bmp'],
    },
    multiple: false,
    disabled: status === 'loading',
  });

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(''), 2000);
  };

  const isBusy = status === 'loading';

  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>Palette Generator</h1>
        <p style={s.toolDesc}>
          Extract the dominant colors from any image to generate beautiful CSS hex palettes instantly. <strong>100% locally in your browser.</strong>
        </p>
      </div>

      {!file && (
        <div
          {...getRootProps()}
          style={{
            ...s.dropzone,
            ...(isDragActive && !isDragReject ? s.dropzoneActive : {}),
            ...(isDragReject ? s.dropzoneReject : {}),
            ...(isBusy ? s.dropzoneLocked : {}),
          }}
        >
          <input {...getInputProps()} />
          <div style={s.dropContent}>
            <div style={{ ...s.dropIcon, ...(isDragActive ? s.dropIconActive : {}) }}>
              <Upload size={26} color={isDragReject ? 'var(--error)' : 'var(--accent)'} />
            </div>
            <p style={s.dropTitle}>
              {isDragReject
                ? 'Only images are supported'
                : isDragActive
                  ? 'Release to extract palette!'
                  : 'Drop an image here, or click to browse'}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div style={s.errorNotice}>
          <XCircle size={14} style={{ marginRight: 6, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {file && (
        <div style={s.resultsGrid}>
          {/* Image Preview */}
          <div style={s.previewCard}>
            <img src={previewUrl} style={s.previewImg} alt="Original" />
            <button style={s.clearBtn} onClick={clearAll} disabled={isBusy}>
              Clear & Upload New
            </button>
          </div>

          {/* Color Palette */}
          <div style={s.paletteCard}>
            <div style={s.paletteHeader}>
              <h3 style={s.paletteTitle}><Palette size={16} /> Extracted Palette</h3>
              {status === 'done' && <span style={s.paletteHint}>Click to copy HEX</span>}
            </div>
            
            <div style={s.swatchList}>
              {status === 'loading' ? (
                <div style={s.loadingState}>
                  <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                  <span>Analyzing pixels...</span>
                </div>
              ) : (
                swatches.map(swatch => (
                  <div 
                    key={swatch.name} 
                    style={{ ...s.swatch, background: swatch.hex, color: swatch.titleTextHex }}
                    onClick={() => copyToClipboard(swatch.hex)}
                  >
                    <div style={s.swatchInfo}>
                      <span style={s.swatchName}>{swatch.name}</span>
                      <span style={s.swatchHex}>{swatch.hex.toUpperCase()}</span>
                    </div>
                    {copiedHex === swatch.hex ? (
                      <span style={s.copyFeedback}><CheckCircle2 size={16} /> Copied</span>
                    ) : (
                      <Copy size={16} style={{ opacity: 0.5 }} className="copyIcon" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <OtherTools currentToolId="palette" />
    </main>
  );
}

const s: Record<string, CSSProperties> = {
  main: {
    flex: 1, maxWidth: 900, width: '100%', margin: '0 auto',
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
  dropzoneLocked: { cursor: 'not-allowed', opacity: 0.55 },
  dropContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' },
  dropIcon: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'var(--accent-subtle)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4, transition: 'all 250ms ease',
  },
  dropIconActive: { background: 'var(--accent-glow)', border: '1px solid var(--accent)', transform: 'scale(1.1)' },
  dropTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },

  errorNotice: {
    display: 'flex', alignItems: 'center', padding: '10px 16px',
    background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--error)', fontWeight: 500,
  },

  resultsGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
    marginTop: 8,
  },
  previewCard: {
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  previewImg: {
    width: '100%', height: 'auto', maxHeight: 400,
    objectFit: 'contain', borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)', background: 'var(--bg-surface)',
    boxShadow: 'var(--shadow-card)',
  },
  clearBtn: {
    padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
    color: 'var(--text)', cursor: 'pointer', transition: 'background 150ms ease',
  },
  
  paletteCard: {
    display: 'flex', flexDirection: 'column',
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', overflow: 'hidden',
    boxShadow: 'var(--shadow-card)',
  },
  paletteHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', borderBottom: '1px solid var(--border)',
  },
  paletteTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text)' },
  paletteHint: { fontSize: 12, color: 'var(--text-muted)' },
  
  swatchList: {
    display: 'flex', flexDirection: 'column', flex: 1,
  },
  loadingState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 40, color: 'var(--text-muted)', fontSize: 14, flex: 1,
  },
  swatch: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', cursor: 'pointer', transition: 'all 150ms ease',
    flex: 1, minHeight: 60,
  },
  swatchInfo: { display: 'flex', flexDirection: 'column', gap: 2 },
  swatchName: { fontSize: 13, fontWeight: 700, opacity: 0.9 },
  swatchHex: { fontSize: 12, fontWeight: 500, opacity: 0.75, fontFamily: 'monospace' },
  copyFeedback: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, opacity: 0.9 },
};
