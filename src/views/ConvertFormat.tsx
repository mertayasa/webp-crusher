"use client";
import { useState, useCallback } from 'react';
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
  Play,
  PlayCircle
} from 'lucide-react';
import type { ImageFile, FileStatus } from '../types';
import { formatBytes } from '../utils/format';
import { convertImageFormat, getNewFilename, type SupportedFormat } from '../utils/convertFormat';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import '../App.css';

const CONCURRENCY = 3;
const MAX_FILES   = 10;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB

const FORMAT_OPTIONS: Array<{ label: string; value: SupportedFormat }> = [
  { label: 'PNG', value: 'png' },
  { label: 'JPG', value: 'jpg' },
  { label: 'WebP', value: 'webp' },
  { label: 'AVIF', value: 'avif' },
  { label: 'SVG', value: 'svg' },
];

function statusColor(status: FileStatus): string {
  switch (status) {
    case 'done':       return 'var(--success)';
    case 'error':      return 'var(--error)';
    case 'processing': return 'var(--accent)';
    default:           return 'var(--text-muted)';
  }
}

interface ConvertFile extends ImageFile {
  targetFormat: SupportedFormat;
}

export default function ConvertFormat() {
  const [files, setFiles] = useState<ConvertFile[]>([]);
  const [zipping, setZipping] = useState(false);
  const [trimmed, setTrimmed] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const totalCurrentSize = files.reduce((acc, f) => acc + f.originalSize, 0);
  const isLocked = files.length >= MAX_FILES;

  const processFile = useCallback(async (
    id: string,
    file: File,
    format: SupportedFormat
  ) => {
    setFiles(prev =>
      prev.map(f => f.id === id ? { ...f, status: 'processing' as FileStatus } : f),
    );
    try {
      const blob = await convertImageFormat(file, format, 0.9);
      const newName = getNewFilename(file.name, format);

      setFiles(prev =>
        prev.map(f =>
          f.id === id
            ? {
                ...f,
                status: 'done',
                blob,
                compressedSize: blob.size,
                keptOriginal: false,
                webpName: newName,
              }
            : f,
        ),
      );
    } catch (err) {
      setFiles(prev =>
        prev.map(f =>
          f.id === id
            ? { ...f, status: 'error', error: (err as Error).message }
            : f,
        ),
      );
    }
  }, []);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted.length || isLocked) return;
      setSizeError(false);

      const slotsLeft = MAX_FILES - files.length;
      let sliced = accepted.slice(0, slotsLeft);
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

      const newFiles: ConvertFile[] = validFiles.map(file => ({
        id: crypto.randomUUID(),
        name: file.name,
        originalFile: file,
        originalSize: file.size,
        blob: null,
        compressedSize: null,
        status: 'pending',
        webpName: file.name, 
        keptOriginal: false,
        targetFormat: 'webp', // default target format
      }));

      setFiles(prev => [...prev, ...newFiles]);
    },
    [isLocked, files.length, totalCurrentSize],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled: isLocked,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/avif': ['.avif'],
      'image/svg+xml': ['.svg'],
    },
    multiple: true,
  });

  const handleFormatChange = (id: string, format: SupportedFormat) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, targetFormat: format } : f));
  };

  const convertOne = (f: ConvertFile) => {
    processFile(f.id, f.originalFile, f.targetFormat);
  };

  const convertAll = async () => {
    setIsProcessingAll(true);
    const pendings = files.filter(f => f.status === 'pending' || f.status === 'error');
    
    // Process in batches of CONCURRENCY
    for (let i = 0; i < pendings.length; i += CONCURRENCY) {
      const batch = pendings.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(f => processFile(f.id, f.originalFile, f.targetFormat))
      );
    }
    setIsProcessingAll(false);
  };

  const downloadOne = (file: ConvertFile) => {
    if (!file.blob) return;
    saveAs(file.blob, file.webpName);
  };

  const downloadAll = async () => {
    const done = files.filter(f => f.status === 'done' && f.blob);
    if (!done.length) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      done.forEach(f => zip.file(f.webpName, f.blob!));
      const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(content, 'converted-images.zip');
    } finally {
      setZipping(false);
    }
  };

  const clearAll = () => { 
    setFiles([]); 
    setTrimmed(false); 
    setSizeError(false);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const total = files.length;
  const doneCount = files.filter(f => f.status === 'done').length;
  const processingCount = files.filter(f => f.status === 'processing').length;
  const pendingCount = files.filter(f => f.status === 'pending' || f.status === 'error').length;

  return (
    <>
      <main style={s.main}>
        <BackButton />
        
        <div style={s.toolHero}>
          <h1 style={s.toolTitle}>Image Format Converter</h1>
          <p style={s.toolDesc}>
            Convert images between PNG, JPG, WebP, AVIF, and SVG formats. <strong>100% private</strong> — all processing happens directly in your browser, and your files never leave your device.
          </p>
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
            <p style={{ ...s.dropTitle, ...(isLocked ? { color: 'var(--text-muted)' } : {}) }}>
              {isLocked
                ? 'Clear all files below to start a new batch'
                : isDragReject
                  ? 'Only valid images are accepted'
                  : isDragActive
                    ? 'Release to add files!'
                    : `Drop up to ${MAX_FILES} images here (Max 100MB total)`}
            </p>
            <p style={s.dropSub}>
              {isLocked
                ? 'Clear files to free up slots'
                : !isDragReject
                  ? files.length > 0
                    ? `${MAX_FILES - files.length} slot${MAX_FILES - files.length !== 1 ? 's' : ''} remaining · click or drop more`
                    : `Accepts PNG, JPG, WebP, AVIF, SVG`
                  : ''}
            </p>
          </div>
        </div>

        {/* ── Notices */}
        {trimmed && (
          <div style={s.notice}>
            Some files were skipped — only {MAX_FILES - files.length} slot{MAX_FILES - files.length !== 1 ? 's' : ''} were available.
          </div>
        )}
        {sizeError && (
          <div style={s.notice}>
            Some files were skipped to stay under the 100MB total limit.
          </div>
        )}

        {/* ── Toolbar */}
        {total > 0 && (
          <div style={s.toolbar}>
            <div style={s.toolbarLeft}>
              <span style={s.counter}>
                {total} / {MAX_FILES}
              </span>
              {processingCount > 0 ? (
                <span style={s.statBusy}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  Converting…
                  &nbsp;({processingCount} remaining)
                </span>
              ) : doneCount === total ? (
                <span style={s.statDone}>
                  <CheckCircle2 size={14} />
                  {doneCount} of {total} done
                </span>
              ) : (
                <span style={s.statPending}>
                  {pendingCount} file{pendingCount !== 1 ? 's' : ''} ready
                </span>
              )}
            </div>
            <div style={s.toolbarRight}>
              {pendingCount > 0 && (
                <button
                  style={s.btnPrimary}
                  onClick={convertAll}
                  disabled={isProcessingAll}
                >
                  {isProcessingAll
                    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    : <PlayCircle size={14} />}
                  Convert All
                </button>
              )}
              {doneCount > 1 && (
                <button
                  style={s.btnSuccess}
                  onClick={downloadAll}
                  disabled={zipping}
                >
                  {zipping
                    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Archive size={14} />}
                  {zipping ? 'Zipping…' : 'Download All ZIP'}
                </button>
              )}
              <button style={s.btnGhostDanger} onClick={clearAll}>
                <Trash2 size={14} />
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* ── File List */}
        {files.length > 0 && (
          <ul style={s.list}>
            {files.map(file => (
              <li key={file.id} className="file-card">
                <div className="fc-left" style={s.cardLeft}>
                  <div style={{ color: statusColor(file.status), flexShrink: 0 }}>
                    <FileImage size={20} />
                  </div>
                  <div style={s.fileNames}>
                    <span style={s.fileOut} title={file.status === 'done' ? file.webpName : file.name}>
                      {file.status === 'done' ? file.webpName : file.name}
                    </span>
                    <span style={s.fileIn}>{formatBytes(file.originalSize)}</span>
                  </div>
                </div>

                <div className="fc-mid" style={s.cardMid}>
                  {(file.status === 'pending' || file.status === 'error') && (
                    <div style={s.formatSelectWrap}>
                      <span style={s.toLabel}>to:</span>
                      <select 
                        value={file.targetFormat}
                        onChange={e => handleFormatChange(file.id, e.target.value as SupportedFormat)}
                        style={s.formatSelect}
                      >
                        {FORMAT_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {file.status === 'processing' && (
                    <div style={s.progressWrap}>
                      <div style={s.progressTrack}>
                        <div style={s.progressBar} />
                      </div>
                      <span style={s.progressLabel}>Converting to {file.targetFormat.toUpperCase()}…</span>
                    </div>
                  )}

                  {file.status === 'done' && file.compressedSize !== null && (
                    <div style={s.sizeRow}>
                      <span style={s.sizeOrig}>{formatBytes(file.originalSize)}</span>
                      <span style={s.sizeArrow}>→</span>
                      <span style={s.sizeNew}>{formatBytes(file.compressedSize)}</span>
                    </div>
                  )}

                  {file.status === 'error' && (
                    <span style={s.errorRow} title={file.error}>
                      <XCircle size={13} />
                      {file.error ?? 'Conversion failed'}
                    </span>
                  )}
                </div>

                <div className="fc-right" style={s.cardRight}>
                  {(file.status === 'pending' || file.status === 'error') && (
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button style={s.btnConvert} onClick={() => convertOne(file)}>
                        <Play size={12} /> Convert
                      </button>
                      <button style={s.btnIconDanger} onClick={() => removeFile(file.id)} aria-label="Remove file">
                        <XCircle size={16} />
                      </button>
                    </div>
                  )}
                  {file.status === 'done' && (
                    <button style={s.btnDownload} onClick={() => downloadOne(file)}>
                      <Download size={13} />
                      Download
                    </button>
                  )}
                  {file.status === 'processing' && (
                    <Loader2
                      size={17}
                      color="var(--accent)"
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* ── Empty state */}
        {files.length === 0 && (
          <div style={s.empty}>
            <FileImage size={38} color="var(--text-dim)" />
            <p style={s.emptyText}>No files yet — drop some images above</p>
          </div>
        )}

        <OtherTools currentToolId="convert" />
      </main>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  main: {
    flex: 1, maxWidth: 860, width: '100%', margin: '0 auto',
    padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16,
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
  dropzone: {
    border: '2px dashed var(--border)', borderRadius: 'var(--radius-xl)',
    padding: '44px 24px', textAlign: 'center', cursor: 'pointer',
    background: 'var(--bg-surface)', outline: 'none', userSelect: 'none',
    transition: 'all 250ms ease',
  },
  dropzoneActive: {
    border: '2px dashed var(--accent)', background: 'var(--accent-subtle)',
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
    width: 56, height: 56, borderRadius: '50%',
    background: 'var(--accent-subtle)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4, transition: 'all 250ms ease',
  },
  dropIconActive: { background: 'var(--accent-glow)', border: '1px solid var(--accent)', transform: 'scale(1.1)' },
  dropIconLocked: { background: 'var(--bg-elevated)', border: '1px solid var(--border)' },
  dropTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },
  dropSub:   { fontSize: 13, color: 'var(--text-muted)' },
  notice: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '8px 16px',
    background: 'rgba(245,158,11,0.10)',
    border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 'var(--radius)',
    fontSize: 12, color: 'var(--warning)', fontWeight: 500,
  },
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 10,
    padding: '10px 16px',
    background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  },
  toolbarLeft:  { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: 8 },
  counter: {
    fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
    background: 'var(--bg-elevated)', padding: '3px 9px',
    borderRadius: 20, border: '1px solid var(--border)',
    letterSpacing: '0.3px',
  },
  statBusy: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--accent)' },
  statDone: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--success)' },
  statPending: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 15px', background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 150ms ease',
  },
  btnSuccess: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 15px', background: 'var(--success)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 150ms ease',
  },
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 13px',
    background: 'rgba(239,68,68,0.06)',
    color: 'var(--error)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnDownload: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 11px', background: 'var(--success-subtle)', color: 'var(--success)',
    border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-sm)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  btnConvert: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 11px', background: 'var(--accent-subtle)', color: 'var(--accent)',
    border: '1px solid rgba(139,92,246,0.3)', borderRadius: 'var(--radius-sm)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  btnIconDanger: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '5px', background: 'transparent', color: 'var(--error)',
    border: 'none', cursor: 'pointer',
  },
  list: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 },
  card: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '12px 16px',
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-card)', animation: 'slide-in 200ms ease',
  },
  cardLeft: { display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto', maxWidth: 230, minWidth: 0 },
  fileNames: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  fileOut: { fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileIn:  { fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardMid: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  formatSelectWrap: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  toLabel: {
    fontSize: 12, color: 'var(--text-muted)', fontWeight: 500,
  },
  formatSelect: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    color: 'var(--text)',
    fontSize: 12,
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
  },
  progressWrap:  { display: 'flex', flexDirection: 'column', gap: 4, width: '100%', maxWidth: 210 },
  progressTrack: { height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', position: 'relative' },
  progressBar:   {
    position: 'absolute', inset: 0, width: '50%',
    background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
    animation: 'shimmer 1.4s ease infinite', borderRadius: 2,
  },
  progressLabel: { fontSize: 11, color: 'var(--accent)', textAlign: 'center' },
  sizeRow: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  sizeOrig:  { fontSize: 12, color: 'var(--text-muted)' },
  sizeArrow: { fontSize: 12, color: 'var(--border-hover)' },
  sizeNew:   { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  errorRow: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 12, color: 'var(--error)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200,
  },
  cardRight: { flex: '0 0 auto', display: 'flex', alignItems: 'center' },
  empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '44px 0', color: 'var(--text-dim)' },
  emptyText: { fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' },
};
