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
  Maximize2,
  Percent
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import { formatBytes } from '../utils/format';
import '../App.css';

const MAX_FILES = 10;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB

interface ResizedFile {
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
  resizedSize: number | null;
  dataUrl: string | null;
  error?: string;
}

const FORMAT_OPTIONS = [
  { label: 'Keep Original', value: 'original' },
  { label: 'PNG (Lossless)', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'WebP', value: 'webp' },
];

export default function ResizeImage() {
  const [files, setFiles] = useState<ResizedFile[]>([]);
  const [resizeMode, setResizeMode] = useState<'percentage' | 'dimensions'>('percentage');
  const [percentage, setPercentage] = useState<number>(50);
  const [targetWidth, setTargetWidth] = useState<number | ''>(800);
  const [targetHeight, setTargetHeight] = useState<number | ''>(600);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<string>('original');
  const [quality, setQuality] = useState<number>(90);
  const [processing, setProcessing] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [trimmed, setTrimmed] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const totalCurrentSize = files.reduce((acc, f) => acc + f.originalSize, 0);
  const isLocked = files.length >= MAX_FILES;

  const clearAll = () => {
    files.forEach(f => {
      if (f.dataUrl) URL.revokeObjectURL(f.dataUrl);
    });
    setFiles([]);
    setTrimmed(false);
    setSizeError(false);
  };

  const getEstimatedDimensions = useCallback((origW: number, origH: number) => {
    if (resizeMode === 'percentage') {
      const factor = percentage / 100;
      return {
        w: Math.max(Math.round(origW * factor), 1),
        h: Math.max(Math.round(origH * factor), 1)
      };
    } else {
      let w = Number(targetWidth);
      let h = Number(targetHeight);

      if (maintainAspectRatio) {
        if (w && !h) {
          return { w, h: Math.max(Math.round(w * (origH / origW)), 1) };
        } else if (h && !w) {
          return { w: Math.max(Math.round(h * (origW / origH)), 1), h };
        } else if (w && h) {
          // Bounding box contain
          const ratio = Math.min(w / origW, h / origH);
          return {
            w: Math.max(Math.round(origW * ratio), 1),
            h: Math.max(Math.round(origH * ratio), 1)
          };
        }
      }
      return { w: w || origW, h: h || origH };
    }
  }, [resizeMode, percentage, targetWidth, targetHeight, maintainAspectRatio]);

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

      const newFiles: ResizedFile[] = [];

      for (const file of validFiles) {
        try {
          const dims = await getImageDimensions(file);
          newFiles.push({
            id: crypto.randomUUID(),
            name: file.name,
            originalFile: file,
            originalSize: file.size,
            originalWidth: dims.width,
            originalHeight: dims.height,
            targetWidth: dims.width,
            targetHeight: dims.height,
            status: 'pending',
            blob: null,
            resizedSize: null,
            dataUrl: null,
          });
        } catch (err) {
          console.error("Failed to parse image dimensions", file.name, err);
        }
      }

      setFiles(prev => [...prev, ...newFiles]);
    },
    [files.length, isLocked, totalCurrentSize]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled: isLocked || processing,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/avif': ['.avif'],
    },
    multiple: true,
  });

  const resizeAll = async () => {
    setProcessing(true);
    // Reset output data URLs if any exist from a previous run
    setFiles(prev => prev.map(f => {
      if (f.dataUrl) URL.revokeObjectURL(f.dataUrl);
      return { ...f, status: 'pending', blob: null, resizedSize: null, dataUrl: null };
    }));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'processing' } : f));

      try {
        const dims = getEstimatedDimensions(file.originalWidth, file.originalHeight);
        
        // Load image
        const img = new Image();
        const src = URL.createObjectURL(file.originalFile);
        img.src = src;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        canvas.width = dims.w;
        canvas.height = dims.h;
        const ctx = canvas.getContext('2d');

        if (!ctx) throw new Error("Could not initialize canvas context");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, dims.w, dims.h);

        URL.revokeObjectURL(src);

        const mime = outputFormat === 'original' 
          ? file.originalFile.type 
          : (outputFormat === 'png' ? 'image/png' : (outputFormat === 'webp' ? 'image/webp' : 'image/jpeg'));

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), mime, quality / 100);
        });

        if (!blob) throw new Error("Resizing failed to export image blob");

        const dataUrl = URL.createObjectURL(blob);

        setFiles(prev => prev.map(f => f.id === file.id ? {
          ...f,
          status: 'done',
          blob,
          resizedSize: blob.size,
          dataUrl,
          targetWidth: dims.w,
          targetHeight: dims.h,
        } : f));
      } catch (err) {
        console.error(`Failed to resize ${file.name}:`, err);
        setFiles(prev => prev.map(f => f.id === file.id ? {
          ...f,
          status: 'error',
          error: (err as Error).message || "Resizing failed"
        } : f));
      }
    }
    setProcessing(false);
  };

  const downloadOne = (file: ResizedFile) => {
    if (!file.blob) return;
    const origName = file.name;
    const lastDot = origName.lastIndexOf('.');
    const base = lastDot !== -1 ? origName.slice(0, lastDot) : origName;
    const ext = outputFormat === 'original' 
      ? origName.substring(lastDot + 1).toLowerCase() 
      : outputFormat;
    saveAs(file.blob, `${base}_resized.${ext}`);
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
        zip.file(`${base}_resized.${ext}`, f.blob!);
      });
      const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(content, 'resized-images.zip');
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
        <h1 style={s.toolTitle}>Image Resizer</h1>
        <p style={s.toolDesc}>
          Adjust dimensions of your images quickly. <strong>100% private</strong> — all resizing happens locally inside your browser, keeping your files completely secure.
        </p>
      </div>

      {/* ── Configuration Bar */}
      <div style={s.configContainer}>
        {/* Resize Mode */}
        <div style={s.configBar}>
          <span style={s.configLabel}><Settings size={14} /> Resize Mode:</span>
          <div style={s.optionList}>
            <button
              style={{ ...s.optionBtn, ...(resizeMode === 'percentage' ? s.optionBtnActive : {}) }}
              onClick={() => setResizeMode('percentage')}
            >
              <Percent size={13} style={{ marginRight: 4 }} />
              By Percentage
            </button>
            <button
              style={{ ...s.optionBtn, ...(resizeMode === 'dimensions' ? s.optionBtnActive : {}) }}
              onClick={() => setResizeMode('dimensions')}
            >
              <Maximize2 size={13} style={{ marginRight: 4 }} />
              By Dimensions (px)
            </button>
          </div>
        </div>

        {/* Option Inputs depending on mode */}
        {resizeMode === 'percentage' ? (
          <div style={s.configBar}>
            <span style={s.configLabel}><Target size={14} /> Scale Factor:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
              <input
                type="range"
                min="10"
                max="200"
                value={percentage}
                onChange={e => setPercentage(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent)' }}
              />
              <span style={s.valueDisplay}>{percentage}%</span>
            </div>
          </div>
        ) : (
          <div style={s.configBar}>
            <span style={s.configLabel}><Target size={14} /> Dimensions:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>W:</span>
                <input
                  type="number"
                  placeholder="Width"
                  value={targetWidth}
                  onChange={e => setTargetWidth(e.target.value === '' ? '' : Number(e.target.value))}
                  style={s.numberInput}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>px</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>H:</span>
                <input
                  type="number"
                  placeholder="Height"
                  value={targetHeight}
                  onChange={e => setTargetHeight(e.target.value === '' ? '' : Number(e.target.value))}
                  style={s.numberInput}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>px</span>
              </div>
              <label style={s.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={maintainAspectRatio}
                  onChange={e => setMaintainAspectRatio(e.target.checked)}
                  style={{ accentColor: 'var(--accent)' }}
                />
                Maintain Aspect Ratio
              </label>
            </div>
          </div>
        )}

        {/* Output format & Quality */}
        <div style={s.configBar}>
          <span style={s.configLabel}><Settings size={14} /> Output Format:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', flex: 1 }}>
            <select
              value={outputFormat}
              onChange={e => setOutputFormat(e.target.value)}
              style={s.selectInput}
            >
              {FORMAT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {outputFormat !== 'png' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Quality:</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={e => setQuality(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent)' }}
                />
                <span style={s.valueDisplay}>{quality}%</span>
              </div>
            )}
          </div>
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
        }}
      >
        <input {...getInputProps()} />
        <div style={s.dropContent}>
          <div style={{
            ...s.dropIcon,
            ...(isLocked ? s.dropIconLocked : {}),
            ...(!isLocked && isDragActive ? s.dropIconActive : {}),
          }}>
            <Upload size={26} color={isLocked ? 'var(--text-dim)' : isDragReject ? 'var(--error)' : 'var(--accent)'} />
          </div>
          <p style={s.dropTitle}>
            {isLocked
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
              : files.length > 0
              ? `${MAX_FILES - files.length} slot${MAX_FILES - files.length !== 1 ? 's' : ''} remaining`
              : 'Accepts JPG, PNG, WebP, AVIF'}
          </p>
        </div>
      </div>

      {trimmed && <div style={s.notice}>Some files were skipped — slots are full.</div>}
      {sizeError && <div style={s.notice}>Some files were skipped to stay under 100MB.</div>}

      {/* ── Toolbar */}
      {total > 0 && (
        <div style={s.toolbar}>
          <div style={s.toolbarLeft}>
            <span style={s.counter}>{total} / {MAX_FILES}</span>
            {processing ? (
              <span style={s.statBusy}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Resizing images… ({activeProcessing} active)
              </span>
            ) : doneCount > 0 ? (
              <span style={s.statDone}>
                <CheckCircle2 size={14} />
                Resized {doneCount} of {total} images
              </span>
            ) : (
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
                Ready to resize
              </span>
            )}
          </div>
          <div style={s.toolbarRight}>
            {pendingCount > 0 && (
              <button
                style={s.btnPrimary}
                onClick={resizeAll}
                disabled={processing}
              >
                <Maximize2 size={14} />
                Resize Images
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

      {/* ── Resized Files List */}
      {total > 0 && (
        <ul style={s.list}>
          {files.map(file => {
            const dims = getEstimatedDimensions(file.originalWidth, file.originalHeight);
            return (
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
                      <span style={s.sizeNew}>{dims.w}x{dims.h} (Est.)</span>
                    </div>
                  )}

                  {file.status === 'processing' && (
                    <div style={s.progressWrap}>
                      <div style={s.progressTrack}>
                        <div style={s.progressBar} />
                      </div>
                      <span style={s.progressLabel}>Processing…</span>
                    </div>
                  )}

                  {file.status === 'done' && file.resizedSize !== null && (
                    <div style={s.sizeRow}>
                      <span style={s.sizeOrig}>{file.originalWidth}x{file.originalHeight}</span>
                      <span style={s.sizeArrow}>→</span>
                      <span style={s.sizeNew}>{file.targetWidth}x{file.targetHeight}</span>
                      <span style={s.savingsPill}>
                        {formatBytes(file.resizedSize)}
                      </span>
                    </div>
                  )}

                  {file.status === 'error' && (
                    <span style={s.errorRow} title={file.error}>
                      <XCircle size={13} />
                      {file.error || 'Failed'}
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
            );
          })}
        </ul>
      )}

      <OtherTools currentToolId="resize" />
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
  valueDisplay: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text)',
    background: 'var(--bg-elevated)',
    padding: '2px 8px',
    borderRadius: 6,
    minWidth: 46,
    textAlign: 'center',
    border: '1px solid var(--border)',
  },
  numberInput: {
    width: 80,
    padding: '4px 8px',
    fontSize: 13,
    fontWeight: 500,
    background: 'var(--bg)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'inherit',
  },
  checkboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-muted)',
    cursor: 'pointer',
    userSelect: 'none',
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
  progressTrack: { height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', position: 'relative' },
  progressBar: {
    position: 'absolute',
    inset: 0,
    width: '50%',
    background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
    animation: 'shimmer 1.4s ease infinite',
    borderRadius: 2,
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
