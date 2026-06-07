"use client";
import { useState, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  Upload,
  Download,
  Archive,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  FileImage,
  Target,
  Settings,
  Sparkles
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import { formatBytes } from '../utils/format';
import '../App.css';

const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB

interface UpscaledFile {
  id: string;
  name: string;
  originalFile: File;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  targetWidth: number;
  targetHeight: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  blob: Blob | null;
  upscaledSize: number | null;
  progress: number;
  error?: string;
}

const SCALE_OPTIONS = [
  { label: '2x Upscale', value: 2 },
  { label: '4x Upscale', value: 4 },
];

const FORMAT_OPTIONS = [
  { label: 'Keep Original', value: 'original' },
  { label: 'PNG (Lossless)', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'WebP', value: 'webp' },
];

export default function UpscaleImage() {
  const [upscalerModule, setUpscalerModule] = useState<any | null>(null);
  const [model2x, setModel2x] = useState<any | null>(null);
  const [model4x, setModel4x] = useState<any | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState('');

  const [files, setFiles] = useState<UpscaledFile[]>([]);
  const [scaleFactor, setScaleFactor] = useState<number>(2);
  const [outputFormat, setOutputFormat] = useState<string>('original');
  const [processing, setProcessing] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [trimmed, setTrimmed] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [resolutionError, setResolutionError] = useState(false);

  const totalCurrentSize = files.reduce((acc, f) => acc + f.originalSize, 0);
  const isLocked = files.length >= MAX_FILES;

  // Load TensorFlow.js and UpscalerJS client-side only
  useEffect(() => {
    let active = true;
    const loadAI = async () => {
      try {
        const [upscalerLib, tfjs, esrgan2x, esrgan4x] = await Promise.all([
          import('upscaler'),
          import('@tensorflow/tfjs'),
          import('@upscalerjs/esrgan-slim/2x'),
          import('@upscalerjs/esrgan-slim/4x'),
        ]);

        if (!active) return;

        // Try WebGL backend for GPU acceleration
        try {
          await tfjs.setBackend('webgl');
        } catch (e) {
          console.warn("WebGL failed, falling back to CPU execution", e);
          await tfjs.setBackend('cpu');
        }

        setUpscalerModule(upscalerLib);
        setModel2x(esrgan2x.default);
        setModel4x(esrgan4x.default);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load TensorFlow or Upscaler library", err);
        if (active) {
          setLoadingError("Failed to initialize AI upscaler libraries. Please ensure WebGL is enabled in your browser.");
        }
      }
    };
    loadAI();
    return () => {
      active = false;
    };
  }, []);

  const clearAll = () => {
    setFiles([]);
    setTrimmed(false);
    setSizeError(false);
    setResolutionError(false);
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const src = URL.createObjectURL(file);
      img.src = src;
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(src);
      };
      img.onerror = (err) => {
        reject(err);
        URL.revokeObjectURL(src);
      };
    });
  };

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length || isLocked) return;
      setSizeError(false);
      setResolutionError(false);

      const slotsLeft = MAX_FILES - files.length;
      const sliced = accepted.slice(0, slotsLeft);
      setTrimmed(accepted.length > slotsLeft);

      let currentSize = totalCurrentSize;
      const validFiles: File[] = [];
      let skippedSize = false;

      for (const file of sliced) {
        if (currentSize + file.size <= MAX_TOTAL_BYTES) {
          validFiles.push(file);
          currentSize += file.size;
        } else {
          skippedSize = true;
        }
      }

      if (skippedSize) {
        setSizeError(true);
      }

      if (!validFiles.length) return;

      const newFiles: UpscaledFile[] = [];
      let skippedResolution = false;

      for (const file of validFiles) {
        try {
          const dims = await getImageDimensions(file);
          // Block images larger than 5 Megapixels (e.g. 2500x2000) or 5MB file size to prevent WebGL crash
          if (dims.width * dims.height > 5000000 || file.size > 5 * 1024 * 1024) {
            skippedResolution = true;
            continue;
          }
          newFiles.push({
            id: crypto.randomUUID(),
            name: file.name,
            originalFile: file,
            originalSize: file.size,
            originalWidth: dims.width,
            originalHeight: dims.height,
            targetWidth: dims.width * scaleFactor,
            targetHeight: dims.height * scaleFactor,
            status: 'pending',
            blob: null,
            upscaledSize: null,
            progress: 0,
          });
        } catch (err) {
          console.error("Failed to parse dimensions", file.name, err);
        }
      }

      if (skippedResolution) {
        setResolutionError(true);
      }

      setFiles(prev => [...prev, ...newFiles]);
    },
    [files.length, isLocked, totalCurrentSize, scaleFactor]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled: isLocked || processing || !modelsLoaded,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/avif': ['.avif'],
    },
    multiple: true,
  });

  // Synchronize target dimensions if scale factor changes before conversion
  useEffect(() => {
    setFiles(prev =>
      prev.map(f =>
        f.status === 'pending'
          ? {
              ...f,
              targetWidth: f.originalWidth * scaleFactor,
              targetHeight: f.originalHeight * scaleFactor,
            }
          : f
      )
    );
  }, [scaleFactor]);

  const runUpscale = async () => {
    if (!modelsLoaded || processing) return;
    setProcessing(true);

    // Reset files states
    setFiles(prev =>
      prev.map(f => ({
        ...f,
        status: 'pending',
        progress: 0,
        blob: null,
        upscaledSize: null,
      }))
    );

    const activeModel = scaleFactor === 4 ? model4x : model2x;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setFiles(prev =>
        prev.map(f => (f.id === file.id ? { ...f, status: 'processing' } : f))
      );

      try {
        // Load image onto Image object
        const img = new Image();
        const src = URL.createObjectURL(file.originalFile);
        img.src = src;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        // Initialize Upscaler
        const upscaler = new upscalerModule.default({
          model: activeModel,
        });

        // Run client-side inference using standard tiling configs
        const resDataUrl = await upscaler.upscale(img, {
          patchSize: 128, // Standard safety patch size to avoid WebGL context loss
          padding: 8,
          progress: (percent: number) => {
            setFiles(prev =>
              prev.map(f => (f.id === file.id ? { ...f, progress: Math.round(percent) } : f))
            );
          },
        });

        URL.revokeObjectURL(src);

        // Convert DataURL output to Blob
        const response = await fetch(resDataUrl);
        const blob = await response.blob();

        setFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? {
                  ...f,
                  status: 'done',
                  blob,
                  upscaledSize: blob.size,
                  progress: 100,
                  targetWidth: file.originalWidth * scaleFactor,
                  targetHeight: file.originalHeight * scaleFactor,
                }
              : f
          )
        );
      } catch (err) {
        console.error(`AI Upscaling failed for ${file.name}:`, err);
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? {
                  ...f,
                  status: 'error',
                  error: (err as Error).message || "Upscaling failed",
                }
              : f
          )
        );
      }
    }
    setProcessing(false);
  };

  const downloadOne = (file: UpscaledFile) => {
    if (!file.blob) return;
    const origName = file.name;
    const lastDot = origName.lastIndexOf('.');
    const base = lastDot !== -1 ? origName.slice(0, lastDot) : origName;
    const ext = outputFormat === 'original' 
      ? origName.substring(lastDot + 1).toLowerCase() 
      : outputFormat;
    saveAs(file.blob, `${base}_upscaled_${scaleFactor}x.${ext}`);
  };

  const downloadAll = async () => {
    const done = files.filter(f => f.status === 'done' && f.blob);
    if (!done.length) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      done.forEach(f => {
        const origName = f.name;
        const lastDot = origName.lastIndexOf('.');
        const base = lastDot !== -1 ? origName.slice(0, lastDot) : origName;
        const ext = outputFormat === 'original' 
          ? origName.substring(lastDot + 1).toLowerCase() 
          : outputFormat;
        zip.file(`${base}_upscaled_${scaleFactor}x.${ext}`, f.blob!);
      });
      const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(content, `upscaled-images-${scaleFactor}x.zip`);
    } finally {
      setZipping(false);
    }
  };

  const total = files.length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const pendingCount = files.filter(f => f.status === 'pending').length;
  const activeProcessing = files.filter(f => f.status === 'processing').length;

  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>AI Image Upscaler</h1>
        <p style={s.toolDesc}>
          Increase resolution of your images using high-quality Super-Resolution neural models. <strong>100% private</strong> — all processing runs locally inside your browser GPU/CPU.
        </p>
        <div style={{ ...s.notice, marginTop: 12, display: 'inline-flex' }}>
          <Settings size={14} style={{ marginRight: 6 }} />
          AI Upscaling is hardware intensive. To prevent browser crashes, input images are limited to 5 Megapixels (e.g. 2500x2000px) or 5MB.
        </div>
      </div>

      {/* ── Configuration Bar */}
      <div style={s.configContainer}>
        {/* Fixed Upscale Scale Option */}
        <div style={s.configBar}>
          <span style={s.configLabel}><Target size={14} /> Scale Factor:</span>
          <div style={s.optionList}>
            {SCALE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                style={{
                  ...s.optionBtn,
                  ...(scaleFactor === opt.value ? s.optionBtnActive : {}),
                }}
                onClick={() => setScaleFactor(opt.value)}
                disabled={processing}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Output format dropdown */}
        <div style={s.configBar}>
          <span style={s.configLabel}><Settings size={14} /> Output Format:</span>
          <select
            value={outputFormat}
            onChange={e => setOutputFormat(e.target.value)}
            style={s.selectInput}
            disabled={processing}
          >
            {FORMAT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Drop Zone */}
      <div
        {...getRootProps()}
        style={{
          ...s.dropzone,
          ...(isLocked ? s.dropzoneLocked : {}),
          ...(!isLocked && isDragActive && !isDragReject ? s.dropzoneActive : {}),
          ...(!isLocked && isDragReject ? s.dropzoneReject : {}),
          ...(!modelsLoaded ? s.dropzoneLocked : {}),
        }}
      >
        <input {...getInputProps()} />
        <div style={s.dropContent}>
          <div style={{
            ...s.dropIcon,
            ...(isLocked || !modelsLoaded ? s.dropIconLocked : {}),
            ...(!isLocked && isDragActive ? s.dropIconActive : {}),
          }}>
            {!modelsLoaded ? (
              <Loader2 size={26} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-dim)' }} />
            ) : (
              <Upload size={26} color={isLocked ? 'var(--text-dim)' : isDragReject ? 'var(--error)' : 'var(--accent)'} />
            )}
          </div>
          <p style={s.dropTitle}>
            {!modelsLoaded
              ? 'Loading AI models (please wait)…'
              : isLocked
              ? 'Clear all files below to start a new batch'
              : isDragReject
              ? 'Only valid images are accepted'
              : isDragActive
              ? 'Release to upload!'
              : `Drop up to ${MAX_FILES} images here (Max 100MB)`}
          </p>
          <p style={s.dropSub}>
            {isLocked
              ? 'Clear files to free up slots'
              : !modelsLoaded
              ? 'Downloading model engine locally to your browser...'
              : files.length > 0
              ? `${MAX_FILES - files.length} slot${MAX_FILES - files.length !== 1 ? 's' : ''} remaining`
              : 'Accepts JPG, PNG, WebP, AVIF'}
          </p>
        </div>
      </div>

      {trimmed && <div style={s.notice}>Some files were skipped — slots are full.</div>}
      {sizeError && <div style={s.notice}>Some files were skipped to stay under 100MB.</div>}
      {resolutionError && <div style={s.notice}>Some images were skipped because they exceed the 5 Megapixel or 5MB limit.</div>}
      {loadingError && <div style={s.errorNotice}><XCircle size={14} style={{ marginRight: 6 }} />{loadingError}</div>}

      {/* ── Toolbar */}
      {total > 0 && (
        <div style={s.toolbar}>
          <div style={s.toolbarLeft}>
            <span style={s.counter}>{total} / {MAX_FILES}</span>
            {processing ? (
              <span style={s.statBusy}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                AI Upscaling queue running… ({activeProcessing} active)
              </span>
            ) : doneCount > 0 ? (
              <span style={s.statDone}>
                <CheckCircle2 size={14} />
                Upscaled {doneCount} of {total} images
              </span>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
                Ready to upscale
              </span>
            )}
          </div>
          <div style={s.toolbarRight}>
            {pendingCount > 0 && (
              <button
                style={s.btnPrimary}
                onClick={runUpscale}
                disabled={processing || !modelsLoaded}
              >
                <Sparkles size={14} />
                Upscale Images
              </button>
            )}
            {doneCount > 1 && (
              <button
                style={s.btnDownloadAll}
                onClick={downloadAll}
                disabled={zipping}
              >
                {zipping ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Archive size={14} />
                )}
                Download All ZIP
              </button>
            )}
            <button style={s.btnGhostDanger} onClick={clearAll} disabled={processing}>
              <Trash2 size={14} />
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* ── Files List (No visual images displayed, just direct download button) */}
      {total > 0 && (
        <ul style={s.list}>
          {files.map(file => (
            <li key={file.id} className="file-card">
              <div className="fc-left" style={s.cardLeft}>
                <div style={{ color: 'var(--accent)', flexShrink: 0 }}>
                  <FileImage size={20} />
                </div>
                <div style={s.fileNames}>
                  <span style={s.fileOut} title={file.name}>{file.name}</span>
                  <span style={s.fileIn}>
                    {file.originalWidth}x{file.originalHeight} · {formatBytes(file.originalSize)}
                  </span>
                </div>
              </div>

              <div className="fc-mid" style={s.cardMid}>
                {file.status === 'pending' && (
                  <div style={s.sizeRow}>
                    <span style={s.sizeOrig}>{file.originalWidth}x{file.originalHeight}</span>
                    <span style={s.sizeArrow}>→</span>
                    <span style={s.sizeNew}>{file.targetWidth}x{file.targetHeight} ({scaleFactor}x)</span>
                  </div>
                )}

                {file.status === 'processing' && (
                  <div style={s.progressWrap}>
                    <div style={s.progressTrack}>
                      <div style={{ ...s.progressBar, width: `${file.progress}%` }} />
                    </div>
                    <span style={s.progressLabel}>Processing model: {file.progress}%</span>
                  </div>
                )}

                {file.status === 'done' && file.upscaledSize !== null && (
                  <div style={s.sizeRow}>
                    <span style={s.sizeOrig}>{file.originalWidth}x{file.originalHeight}</span>
                    <span style={s.sizeArrow}>→</span>
                    <span style={s.sizeNew}>{file.targetWidth}x{file.targetHeight}</span>
                    <span style={s.savingsPill}>
                      {formatBytes(file.upscaledSize)}
                    </span>
                  </div>
                )}

                {file.status === 'error' && (
                  <span style={s.errorRow} title={file.error}>
                    <XCircle size={13} />
                    {file.error || 'Upscale failed'}
                  </span>
                )}
              </div>

              <div className="fc-right" style={s.cardRight}>
                {file.status === 'done' && (
                  <button style={s.btnDownload} onClick={() => downloadOne(file)}>
                    <Download size={13} />
                    Download
                  </button>
                )}
                {file.status === 'processing' && (
                  <Loader2 size={17} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <OtherTools currentToolId="upscale" />
    </main>
  );
}

const s: Record<string, CSSProperties> = {
  main: {
    flex: 1,
    maxWidth: 860,
    width: '100%',
    margin: '0 auto',
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  toolHero: {
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--text)',
    marginBottom: 8,
    letterSpacing: '-0.5px',
  },
  toolDesc: {
    fontSize: 15,
    color: 'var(--text-muted)',
    lineHeight: 1.5,
  },
  configContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  configBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    padding: '10px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  configLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
  optionList: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  optionBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '5px 14px',
    fontSize: 13,
    fontWeight: 500,
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    fontFamily: 'inherit',
  },
  optionBtnActive: {
    background: 'var(--accent-subtle)',
    color: 'var(--accent-hover)',
    border: '1px solid var(--accent)',
    fontWeight: 600,
  },
  selectInput: {
    padding: '6px 10px',
    fontSize: '13px',
    fontWeight: 500,
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--bg)',
    color: 'var(--text)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  dropzone: {
    border: '2px dashed var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '44px 24px',
    textAlign: 'center',
    cursor: 'pointer',
    background: 'var(--bg-surface)',
    outline: 'none',
    userSelect: 'none',
    transition: 'all 250ms ease',
  },
  dropzoneActive: {
    border: '2px dashed var(--accent)',
    background: 'var(--accent-subtle)',
    boxShadow: 'var(--shadow-glow)',
  },
  dropzoneReject: { border: '2px dashed var(--error)', background: 'var(--error-subtle)' },
  dropzoneLocked: {
    border: '2px dashed var(--border)',
    background: 'var(--bg)',
    cursor: 'not-allowed',
    opacity: 0.55,
  },
  dropContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' },
  dropIcon: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'var(--accent-subtle)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    transition: 'all 250ms ease',
  },
  dropIconActive: { background: 'var(--accent-glow)', border: '1px solid var(--accent)', transform: 'scale(1.1)' },
  dropIconLocked: { background: 'var(--bg-elevated)', border: '1px solid var(--border)' },
  dropTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },
  dropSub: { fontSize: 13, color: 'var(--text-muted)' },
  notice: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    background: 'rgba(245,158,11,0.10)',
    border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 'var(--radius)',
    fontSize: 12,
    color: 'var(--warning)',
    fontWeight: 500,
  },
  errorNotice: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'rgba(239,68,68,0.10)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius)',
    fontSize: 13,
    color: 'var(--error)',
    fontWeight: 500,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    padding: '10px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: 8 },
  counter: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-muted)',
    background: 'var(--bg-elevated)',
    padding: '3px 9px',
    borderRadius: 20,
    border: '1px solid var(--border)',
    letterSpacing: '0.3px',
  },
  statBusy: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--accent)' },
  statDone: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--success)' },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 15px',
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 150ms ease',
  },
  btnDownloadAll: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 15px',
    background: 'var(--success-subtle)',
    color: 'var(--success)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  btnGhostDanger: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '7px 13px',
    background: 'rgba(239,68,68,0.06)',
    color: 'var(--error)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  list: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '12px 16px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-card)',
    animation: 'slide-in 200ms ease',
  },
  cardLeft: { display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto', maxWidth: 230, minWidth: 0 },
  fileNames: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  fileOut: { fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileIn: { fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardMid: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  progressWrap: { display: 'flex', flexDirection: 'column', gap: 4, width: '100%', maxWidth: 210 },
  progressTrack: { height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', position: 'relative' },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
    borderRadius: 2,
    transition: 'width 200ms ease-out',
  },
  progressLabel: { fontSize: 11, color: 'var(--accent)', textAlign: 'center' },
  sizeRow: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  sizeOrig: { fontSize: 12, color: 'var(--text-muted)' },
  sizeArrow: { fontSize: 12, color: 'var(--border-hover)' },
  sizeNew: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  savingsPill: {
    background: 'var(--bg-elevated)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    padding: '2px 8px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 700,
  },
  errorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 12,
    color: 'var(--error)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 200,
  },
  cardRight: { flex: '0 0 auto', display: 'flex', alignItems: 'center' },
  btnDownload: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 11px',
    background: 'var(--success-subtle)',
    color: 'var(--success)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
  },
};
