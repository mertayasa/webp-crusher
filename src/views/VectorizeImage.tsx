"use client";
import { useState, useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import {
  Upload,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Sliders,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import { formatBytes } from '../utils/format';
import '../App.css';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

type Status = 'idle' | 'loading' | 'tracing' | 'done' | 'error';

const THRESHOLD_OPTIONS = [
  { label: 'Auto (Best)', value: 'auto', desc: 'Automatically calculates the perfect cutoff to preserve detail.' },
  { label: 'Light', value: 'light', desc: 'Makes lines thicker and heavier. Good for faint sketches.' },
  { label: 'Dark', value: 'dark', desc: 'Makes lines thinner. Good for thick, bleeding ink.' },
];

export default function VectorizeImage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [svgOutput, setSvgOutput] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [stylePreset, setStylePreset] = useState<string>('auto');
  const [originalSize, setOriginalSize] = useState<number>(0);

  const clearAll = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
    setSvgOutput('');
    setStatus('idle');
    setError('');
    setOriginalSize(0);
  }, [previewUrl]);

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;

    if (f.size > MAX_FILE_BYTES) {
      setError('File exceeds the 10MB limit. Please use a smaller image.');
      return;
    }

    clearAll();
    setFile(f);
    setOriginalSize(f.size);
    setPreviewUrl(URL.createObjectURL(f));
    setStatus('idle');
    setError('');
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
    disabled: status === 'loading' || status === 'tracing',
  });

  const runVectorize = useCallback(async () => {
    if (!file || status === 'tracing') return;

    setStatus('loading');
    setError('');
    setSvgOutput('');

    try {
      // Dynamically import potrace-ts client-side
      const { 
        traceBitmap, 
        getSVG, 
        imageDataToBitmap,
        calculateAutoThreshold
      } = await import('@cadit-app/potrace-ts');

      setStatus('tracing');

      // Pre-load into an HTMLImageElement
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = objectUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
      });

      // Max trace dim for performance
      const MAX_TRACE_DIM = 800;
      let width = img.naturalWidth || img.width || 0;
      let height = img.naturalHeight || img.height || 0;

      if (width > MAX_TRACE_DIM || height > MAX_TRACE_DIM) {
        const ratio = width / height;
        if (ratio > 1) {
          width = MAX_TRACE_DIM;
          height = Math.round(MAX_TRACE_DIM / ratio);
        } else {
          height = MAX_TRACE_DIM;
          width = Math.round(MAX_TRACE_DIM * ratio);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2D canvas context');
      
      // Fill background with white in case of transparency
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      // Determine threshold
      let thresholdValue = 128;
      if (stylePreset === 'auto') {
        thresholdValue = calculateAutoThreshold(imageData);
      } else if (stylePreset === 'light') {
        thresholdValue = 160;
      } else if (stylePreset === 'dark') {
        thresholdValue = 90;
      }

      // Convert to pure Potrace binary bitmap
      const bitmap = imageDataToBitmap(imageData, thresholdValue);
      
      // Trace using the pure JS Peter Selinger Potrace algorithm
      const paths = traceBitmap(bitmap, {
        turdsize: 2,
        optcurve: true,
        opttolerance: 0.2,
        alphamax: 1,
      });

      // Generate SVG
      let svgString = getSVG(paths, 1);

      // Remove hardcoded width and height attributes which cause the SVG to crop
      // when placed inside a smaller constrained container.
      svgString = svgString.replace(/width="[0-9.]+"/, '');
      svgString = svgString.replace(/height="[0-9.]+"/, '');

      // Inject viewBox and inline responsive styles so it scales cleanly within the preview box
      svgString = svgString.replace(
        '<svg ',
        `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" style="max-width: 100%; max-height: 300px; width: 100%; height: auto;" `
      );

      URL.revokeObjectURL(objectUrl);

      setSvgOutput(svgString);
      setStatus('done');
    } catch (err) {
      console.error('Vectorization failed:', err);
      setError((err as Error).message || 'Vectorization failed. The image may be too complex or unsupported.');
      setStatus('error');
    }
  }, [file, stylePreset, status]);

  const downloadSvg = () => {
    if (!svgOutput || !file) return;
    const base = file.name.replace(/\.[^.]+$/, '');
    const blob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, `${base}.svg`);
  };

  const svgSize = svgOutput ? new Blob([svgOutput]).size : 0;

  const isBusy = status === 'loading' || status === 'tracing';

  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>Image Vectorizer</h1>
        <p style={s.toolDesc}>
          Convert raster images into scalable SVG vector files. <strong>100% private</strong> — all processing runs locally in your browser using WebAssembly.
        </p>

        {/* Disclaimer */}
        <div style={s.disclaimer}>
          <div style={s.disclaimerRow}>
            <CheckCircle2 size={14} color="var(--success)" />
            <span><strong>Works great for:</strong> Logos, icons, line art, flat illustrations, and vectors</span>
          </div>
          <div style={s.disclaimerRow}>
            <XCircle size={14} color="var(--error)" />
            <span><strong>Not suitable for:</strong> High-res photos, complex textures, or heavy gradients</span>
          </div>
        </div>
      </div>

      {/* ── Controls */}
      <div style={s.configBar}>
        <span style={s.configLabel}><Sliders size={14} /> Threshold:</span>
        <div style={s.optionList}>
          {THRESHOLD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              title={opt.desc}
              style={{ ...s.optionBtn, ...(stylePreset === opt.value ? s.optionBtnActive : {}) }}
              onClick={() => setStylePreset(opt.value)}
              disabled={isBusy}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span style={s.configHint}>
          <Info size={12} />
          Controls black & white cutoff. Hover options for details.
        </span>
      </div>

      {/* ── Drop Zone */}
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
                ? 'Only PNG, JPG, WebP, BMP images are accepted'
                : isDragActive
                  ? 'Release to vectorize!'
                  : 'Drop image here, or click to browse'}
            </p>
            <p style={s.dropSub}>PNG, JPG, WebP, BMP · Max 10MB</p>
          </div>
        </div>
      )}

      {error && (
        <div style={s.errorNotice}>
          <XCircle size={14} style={{ marginRight: 6, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* ── Image + SVG preview side by side */}
      {file && (
        <div style={s.previewGrid}>
          {/* Original */}
          <div style={s.previewCard}>
            <div style={s.previewLabel}>
              <span style={s.previewLabelText}>Original · {formatBytes(originalSize)}</span>
            </div>
            <div style={s.previewArea}>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Original"
                  style={s.previewImg}
                />
              )}
            </div>
          </div>

          {/* SVG Output */}
          <div style={s.previewCard}>
            <div style={s.previewLabel}>
              <span style={s.previewLabelText}>
                {status === 'done' ? `SVG Output · ${formatBytes(svgSize)}` : 'SVG Output'}
              </span>
            </div>
            <div style={{ ...s.previewArea, background: '#fff' }}>
              {status === 'idle' || status === 'error' ? (
                <div style={s.previewPlaceholder}>
                  <Sparkles size={28} color="var(--border)" />
                  <span style={s.previewPlaceholderText}>Click "Vectorize" to convert</span>
                </div>
              ) : isBusy ? (
                <div style={s.previewPlaceholder}>
                  <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                  <span style={s.previewPlaceholderText}>
                    {status === 'loading' ? 'Loading WASM engine...' : 'Tracing paths...'}
                  </span>
                </div>
              ) : svgOutput ? (
                <div
                  style={s.svgContainer}
                  dangerouslySetInnerHTML={{ __html: svgOutput }}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ── Toolbar */}
      {file && (
        <div style={s.toolbar}>
          <div style={s.toolbarLeft}>
            <span style={s.fileName} title={file.name}>{file.name}</span>
            {status === 'done' && (
              <span style={s.statDone}>
                <CheckCircle2 size={14} />
                Vectorization complete
              </span>
            )}
            {isBusy && (
              <span style={s.statBusy}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                {status === 'loading' ? 'Initializing WebAssembly...' : 'Tracing vector paths...'}
              </span>
            )}
          </div>
          <div style={s.toolbarRight}>
            {(status === 'idle' || status === 'error' || status === 'done') && (
              <button style={s.btnPrimary} onClick={runVectorize} disabled={isBusy}>
                <Sparkles size={14} />
                {status === 'done' ? 'Re-vectorize' : 'Vectorize'}
              </button>
            )}
            {status === 'done' && (
              <button style={s.btnDownload} onClick={downloadSvg}>
                <Download size={13} />
                Download SVG
              </button>
            )}
            <button style={s.btnGhostDanger} onClick={clearAll} disabled={isBusy}>
              <Trash2 size={14} />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Photo warning */}
      {status === 'done' && (
        <div style={s.warningNotice}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          <span>
            Result looks messy? This tool works best on <strong>high-contrast logos and line art</strong>. Photos and complex images do not vectorize well with free algorithms.
          </span>
        </div>
      )}

      <OtherTools currentToolId="vectorize" />
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
  disclaimer: {
    display: 'flex', flexDirection: 'column', gap: 6,
    padding: '12px 16px',
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', fontSize: 13,
  },
  disclaimerRow: { display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--text-muted)', lineHeight: 1.5 },
  configBar: {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    padding: '10px 16px', background: 'var(--bg-surface)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  },
  configLabel: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap',
  },
  configHint: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto',
  },
  optionList: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  optionBtn: {
    padding: '5px 14px', fontSize: 13, fontWeight: 500,
    background: 'transparent', color: 'var(--text-muted)',
    border: '1px solid var(--border)', borderRadius: 20,
    cursor: 'pointer', transition: 'all 150ms ease', fontFamily: 'inherit',
  },
  optionBtnActive: {
    background: 'var(--accent-subtle)', color: 'var(--accent-hover)',
    border: '1px solid var(--accent)', fontWeight: 600,
  },
  dropzone: {
    border: '2px dashed var(--border)', borderRadius: 'var(--radius-xl)',
    padding: '56px 24px', textAlign: 'center', cursor: 'pointer',
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
  dropSub: { fontSize: 13, color: 'var(--text-muted)' },
  errorNotice: {
    display: 'flex', alignItems: 'center', padding: '10px 16px',
    background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--error)', fontWeight: 500,
  },
  warningNotice: {
    display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 16px',
    background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--warning)', fontWeight: 500, lineHeight: 1.5,
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  previewCard: {
    display: 'flex', flexDirection: 'column',
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-card)',
  },
  previewLabel: {
    padding: '8px 14px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)',
  },
  previewLabelText: { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' },
  previewArea: {
    flex: 1, minHeight: 240,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16, background: 'transparent',
  },
  previewImg: { maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 4 },
  previewPlaceholder: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    color: 'var(--text-muted)',
  },
  previewPlaceholderText: { fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' },
  svgContainer: {
    width: '100%', height: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    '& svg': { maxWidth: '100%', maxHeight: 300 },
  },
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 10, padding: '10px 16px',
    background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  fileName: { fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 },
  statBusy: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--accent)' },
  statDone: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--success)' },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 15px',
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 150ms ease',
  },
  btnDownload: {
    display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px',
    background: 'var(--success-subtle)', color: 'var(--success)',
    border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px',
    background: 'rgba(239,68,68,0.06)', color: 'var(--error)',
    border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
};
