"use client";
import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import { removeBackground } from '@imgly/background-removal';
import {
  Upload,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Wand2,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import { formatBytes } from '../utils/format';
import '../App.css';

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB

type Status = 'idle' | 'loading_model' | 'processing' | 'done' | 'error';

export default function RemoveBackground() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [outputUrl, setOutputUrl] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [originalSize, setOriginalSize] = useState(0);
  const [outputSize, setOutputSize] = useState(0);

  const clearAll = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    setFile(null);
    setPreviewUrl('');
    setOutputUrl('');
    setStatus('idle');
    setError('');
    setProgressMsg('');
    setOriginalSize(0);
    setOutputSize(0);
  }, [previewUrl, outputUrl]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;

    if (f.size > MAX_FILE_BYTES) {
      setError('File exceeds 15MB. Please choose a smaller image.');
      return;
    }

    clearAll();
    setFile(f);
    setOriginalSize(f.size);
    setPreviewUrl(URL.createObjectURL(f));
  }, [clearAll]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    multiple: false,
    disabled: status === 'loading_model' || status === 'processing',
  });

  const processImage = async () => {
    if (!file || !previewUrl) return;

    setStatus('loading_model');
    setError('');
    setProgressMsg('Downloading AI model (first time only, ~40MB)...');

    try {
      // Configuration for imgly
      const config = {
        progress: (key: string, current: number, total: number) => {
          if (key.includes('fetch')) {
            const percent = Math.round((current / total) * 100);
            setProgressMsg(`Downloading AI model: ${percent}%`);
          } else if (key.includes('compute')) {
            setStatus('processing');
            setProgressMsg('AI is removing background...');
          }
        }
      };

      // Call the AI
      const blob = await removeBackground(previewUrl, config);
      
      const outUrl = URL.createObjectURL(blob);
      setOutputUrl(outUrl);
      setOutputSize(blob.size);
      setStatus('done');
      setProgressMsg('');
    } catch (err) {
      console.error(err);
      setError('AI failed to process this image. It might be too complex or an unsupported format.');
      setStatus('error');
      setProgressMsg('');
    }
  };

  const downloadResult = () => {
    if (!outputUrl || !file) return;
    const base = file.name.replace(/\.[^.]+$/, '');
    saveAs(outputUrl, `${base}-nobg.png`);
  };

  const isBusy = status === 'loading_model' || status === 'processing';

  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>AI Background Remover</h1>
        <p style={s.toolDesc}>
          Automatically detect subjects and wipe out backgrounds instantly. 
          <strong> Runs 100% locally in your browser</strong> using WebAssembly AI models.
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
                ? 'Only standard images (PNG, JPG, WebP) are supported'
                : isDragActive
                  ? 'Release to upload!'
                  : 'Drop an image here, or click to browse'}
            </p>
            <p style={s.dropSub}>PNG, JPG, WebP · Max 15MB</p>
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
        <div style={s.previewGrid}>
          {/* Original Card */}
          <div style={s.previewCard}>
            <div style={s.previewHeader}>
              <span style={s.previewLabel}>Original</span>
              <span style={s.previewSize}>{formatBytes(originalSize)}</span>
            </div>
            <div style={s.previewArea}>
              <img src={previewUrl} style={s.previewImg} alt="Original" />
            </div>
          </div>

          {/* Result Card */}
          <div style={s.previewCard}>
            <div style={s.previewHeader}>
              <span style={s.previewLabel}>Result</span>
              {status === 'done' && <span style={s.previewSize}>{formatBytes(outputSize)}</span>}
            </div>
            
            <div style={{ ...s.previewArea, background: status === 'done' ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQYcAP3uCTZhw1gGGYhAGBZIA/ENhMWA0gMTQp4B9M+Bg1gGGYhAEA0wAR2720+wAAAABJRU5ErkJggg==")' : 'transparent' }}>
              {status === 'idle' || status === 'error' ? (
                <div style={s.placeholderState}>
                  <Wand2 size={32} color="var(--border)" />
                  <span style={s.placeholderText}>Click process to remove background</span>
                </div>
              ) : isBusy ? (
                <div style={s.placeholderState}>
                  <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                  <span style={s.placeholderText}>{progressMsg}</span>
                </div>
              ) : outputUrl ? (
                <img src={outputUrl} style={s.previewImg} alt="No Background" />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {file && (
        <div style={s.toolbar}>
          <div style={s.toolbarLeft}>
            <span style={s.fileName} title={file.name}>{file.name}</span>
            {status === 'done' && (
              <span style={s.statDone}>
                <CheckCircle2 size={14} /> Background removed
              </span>
            )}
            {isBusy && (
              <span style={s.statBusy}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                {progressMsg || 'Processing...'}
              </span>
            )}
          </div>
          
          <div style={s.toolbarRight}>
            {(status === 'idle' || status === 'error' || status === 'done') && (
              <button style={s.btnPrimary} onClick={processImage} disabled={isBusy}>
                <Wand2 size={14} />
                {status === 'done' ? 'Re-process' : 'Remove Background'}
              </button>
            )}
            {status === 'done' && (
              <button style={s.btnDownload} onClick={downloadResult}>
                <Download size={13} />
                Download PNG
              </button>
            )}
            <button style={s.btnGhostDanger} onClick={clearAll} disabled={isBusy}>
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {status === 'idle' && file && (
        <div style={s.disclaimerBox}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            <strong>First time using this tool?</strong> It will take a moment to download the ~40MB AI model into your browser cache. After that, it runs instantly offline!
          </span>
        </div>
      )}

      <OtherTools currentToolId="remove-bg" />
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
  dropSub: { fontSize: 13, color: 'var(--text-muted)' },

  errorNotice: {
    display: 'flex', alignItems: 'center', padding: '10px 16px',
    background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--error)', fontWeight: 500,
  },

  disclaimerBox: {
    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5,
  },

  previewGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
  },
  previewCard: {
    display: 'flex', flexDirection: 'column',
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-card)',
  },
  previewHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)',
  },
  previewLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  previewSize: { fontSize: 12, color: 'var(--text-muted)' },
  previewArea: {
    flex: 1, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  },
  previewImg: { maxWidth: '100%', maxHeight: 340, objectFit: 'contain', borderRadius: 4 },
  placeholderState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    color: 'var(--text-muted)',
  },
  placeholderText: { fontSize: 13, textAlign: 'center', maxWidth: 200 },

  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 10, padding: '12px 16px',
    background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  fileName: { fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 },
  statBusy: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--accent)' },
  statDone: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--success)' },
  
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease',
  },
  btnDownload: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    background: 'var(--success-subtle)', color: 'var(--success)',
    border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
    background: 'rgba(239,68,68,0.06)', color: 'var(--error)',
    border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
};
