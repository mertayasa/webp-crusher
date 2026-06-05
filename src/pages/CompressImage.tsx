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
  Target,
  Settings
} from 'lucide-react';
import type { ImageFile, FileStatus } from '../types';
import { compressToFormat, compressToTargetBytesFormat } from '../utils/compressGeneral';
import { formatBytes, calcSavings } from '../utils/format';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import '../App.css';

const CONCURRENCY = 3;
const MAX_FILES   = 10;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024; // 100MB

// Target size options — null means "quality mode" (fixed 82%)
const SIZE_OPTIONS: Array<{ label: string; kb: number | null }> = [
  { label: '50 KB',  kb: 50   },
  { label: '100 KB', kb: 100  },
  { label: '200 KB', kb: 200  },
  { label: '500 KB', kb: 500  },
  { label: 'No limit', kb: null },
];

const DEFAULT_TARGET_KB = 100;

type PngHandling = 'webp' | 'jpg' | 'png';

function statusColor(status: FileStatus): string {
  switch (status) {
    case 'done':       return 'var(--success)';
    case 'error':      return 'var(--error)';
    case 'processing': return 'var(--accent)';
    default:           return 'var(--text-muted)';
  }
}

export default function CompressImage() {
  const [files, setFiles]         = useState<ImageFile[]>([]);
  const [zipping, setZipping]     = useState(false);
  const [targetKB, setTargetKB]   = useState<number | null>(DEFAULT_TARGET_KB);
  const [pngHandling, setPngHandling] = useState<PngHandling>('webp');
  const [trimmed, setTrimmed]     = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const totalCurrentSize = files.reduce((acc, f) => acc + f.originalSize, 0);
  const isLocked = files.length >= MAX_FILES;

  const getTargetMime = (fileType: string, pngPref: PngHandling) => {
    if (fileType === 'image/png') {
      if (pngPref === 'webp') return 'image/webp';
      if (pngPref === 'jpg') return 'image/jpeg';
      return 'image/png';
    }
    return fileType;
  };

  const getNewExt = (mimeType: string, originalName: string) => {
    const extMatch = originalName.match(/\.([^.]+)$/);
    const originalExt = extMatch ? extMatch[1].toLowerCase() : '';
    if (mimeType === 'image/webp' && originalExt !== 'webp') return 'webp';
    if (mimeType === 'image/jpeg' && (originalExt !== 'jpg' && originalExt !== 'jpeg')) return 'jpg';
    if (mimeType === 'image/png' && originalExt !== 'png') return 'png';
    return originalExt || 'jpg';
  };

  const processFile = useCallback(async (
    id: string,
    file: File,
    kb: number | null,
    pngPref: PngHandling
  ) => {
    setFiles(prev =>
      prev.map(f => f.id === id ? { ...f, status: 'processing' as FileStatus } : f),
    );
    try {
      const mimeType = getTargetMime(file.type, pngPref);
      
      const blob = kb !== null
        ? await compressToTargetBytesFormat(file, kb * 1024, mimeType)
        : await compressToFormat(file, mimeType, 0.82);

      const keptOriginal = blob.size >= file.size;

      const finalMime = keptOriginal ? file.type : blob.type;
      const newExt = getNewExt(finalMime, file.name);
      
      const lastDot = file.name.lastIndexOf('.');
      const base = lastDot !== -1 ? file.name.slice(0, lastDot) : file.name;
      const outputName = keptOriginal ? file.name : `${base}.${newExt}`;

      setFiles(prev =>
        prev.map(f =>
          f.id === id
            ? {
                ...f,
                status: 'done',
                blob,
                compressedSize: blob.size,
                keptOriginal,
                webpName: outputName, 
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

      const currentTarget = targetKB;
      const currentPngHandling = pngHandling;

      const slotsLeft = MAX_FILES - files.length;
      const sliced    = accepted.slice(0, slotsLeft);
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

      const newFiles: ImageFile[] = validFiles.map(file => ({
        id: crypto.randomUUID(),
        name: file.name,
        originalFile: file,
        originalSize: file.size,
        blob: null,
        compressedSize: null,
        status: 'pending',
        webpName: file.name,
        keptOriginal: false,
      }));

      setFiles(prev => [...prev, ...newFiles]);

      const run = async () => {
        for (let i = 0; i < newFiles.length; i += CONCURRENCY) {
          const batch = newFiles.slice(i, i + CONCURRENCY);
          await Promise.all(
            batch.map(f => processFile(f.id, f.originalFile, currentTarget, currentPngHandling)),
          );
        }
      };
      run();
    },
    [processFile, targetKB, pngHandling, isLocked, files.length, totalCurrentSize],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled: isLocked,
    accept: {
      'image/png':  ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/avif': ['.avif'],
    },
    multiple: true,
  });

  const downloadOne = (file: ImageFile) => {
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
      saveAs(content, 'compressed-images.zip');
    } finally {
      setZipping(false);
    }
  };

  const clearAll = () => { 
    setFiles([]); 
    setTrimmed(false); 
    setSizeError(false); 
  };

  const total              = files.length;
  const doneCount          = files.filter(f => f.status === 'done').length;
  const processingCount    = files.filter(f => f.status === 'processing' || f.status === 'pending').length;
  const doneFiles          = files.filter(f => f.status === 'done');
  const compressedFiles    = doneFiles.filter(f => !f.keptOriginal);
  const keptOriginalCount  = doneFiles.filter(f => f.keptOriginal).length;
  const totalCompressed    = compressedFiles.reduce((a, f) => a + (f.compressedSize ?? 0), 0);
  const totalOriginal      = compressedFiles.reduce((a, f) => a + f.originalSize, 0);
  const overallSavings     = compressedFiles.length > 0 ? calcSavings(totalOriginal, totalCompressed) : 0;

  return (
    <>
      <main style={s.main}>
        <BackButton />
        
        <div style={s.toolHero}>
          <h1 style={s.toolTitle}>Image Compressor</h1>
          <p style={s.toolDesc}>
            Shrink image file sizes without losing noticeable quality. <strong>100% private</strong> — all processing happens directly in your browser, and your files never leave your device.
          </p>
        </div>

        {/* ── Configuration Bar */}
        <div style={s.configContainer}>
          {/* Target Size */}
          <div style={s.targetBar}>
            <span style={s.targetLabel}><Target size={14} /> Target size:</span>
            <div style={s.targetOptions}>
              {SIZE_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  style={{
                    ...s.targetBtn,
                    ...(targetKB === opt.kb ? s.targetBtnActive : {}),
                  }}
                  onClick={() => setTargetKB(opt.kb)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* PNG Handling */}
          <div style={s.pngBar}>
            <span style={s.targetLabel}><Settings size={14} /> PNG Handling:</span>
            <select 
              value={pngHandling} 
              onChange={e => setPngHandling(e.target.value as PngHandling)}
              style={s.selectInput}
            >
              <option value="webp">Convert to WebP (Recommended, smallest size)</option>
              <option value="jpg">Convert to JPG</option>
              <option value="png">Keep as PNG (Only shrinks by resizing)</option>
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
                    ? 'Release to compress!'
                    : `Drop up to ${MAX_FILES} images here (Max 100MB)`}
            </p>
            <p style={s.dropSub}>
              {isLocked
                ? 'Clear files to free up slots'
                : !isDragReject
                  ? files.length > 0
                    ? `${MAX_FILES - files.length} slot${MAX_FILES - files.length !== 1 ? 's' : ''} remaining`
                    : `Accepts JPG, PNG, WebP, AVIF`
                  : ''}
            </p>
          </div>
        </div>

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
                  {targetKB ? `Compressing to ≤${targetKB} KB…` : 'Compressing…'}
                  &nbsp;({processingCount} remaining)
                </span>
              ) : (
                <span style={s.statDone}>
                  <CheckCircle2 size={14} />
                  {doneCount} of {total} done
                  {compressedFiles.length > 0 && (
                    <span style={s.pill}>−{overallSavings.toFixed(1)}% overall</span>
                  )}
                  {keptOriginalCount > 0 && (
                    <span style={s.pillKept}>{keptOriginalCount} original kept</span>
                  )}
                </span>
              )}
            </div>
            <div style={s.toolbarRight}>
              {doneCount > 1 && (
                <button
                  style={s.btnPrimary}
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
              <li key={file.id} style={s.card}>
                <div style={s.cardLeft}>
                  <div style={{ color: statusColor(file.status), flexShrink: 0 }}>
                    <FileImage size={20} />
                  </div>
                  <div style={s.fileNames}>
                    <span style={s.fileOut} title={file.webpName}>{file.webpName}</span>
                    <span style={s.fileIn}  title={file.name}>{file.name}</span>
                  </div>
                </div>

                <div style={s.cardMid}>
                  {file.status === 'pending' && <span style={s.pillMuted}>Queued</span>}
                  
                  {file.status === 'processing' && (
                    <div style={s.progressWrap}>
                      <div style={s.progressTrack}>
                        <div style={s.progressBar} />
                      </div>
                      <span style={s.progressLabel}>
                        {targetKB ? `Compressing to ≤${targetKB} KB…` : 'Compressing…'}
                      </span>
                    </div>
                  )}

                  {file.status === 'done' && file.compressedSize !== null && (
                    <div style={s.sizeRow}>
                      <span style={s.sizeOrig}>{formatBytes(file.originalSize)}</span>
                      <span style={s.sizeArrow}>→</span>
                      <span style={s.sizeNew}>{formatBytes(file.compressedSize)}</span>
                      {file.keptOriginal ? (
                        <span style={s.keptPill} title="Compression couldn't shrink it further">
                          Original kept
                        </span>
                      ) : (
                        <span style={{
                          ...s.savingsPill,
                          ...(targetKB && file.compressedSize > targetKB * 1024 ? s.savingsPillWarn : {}),
                        }}>
                          {targetKB && file.compressedSize > targetKB * 1024
                            ? 'best effort'
                            : `−${calcSavings(file.originalSize, file.compressedSize).toFixed(1)}%`}
                        </span>
                      )}
                    </div>
                  )}

                  {file.status === 'error' && (
                    <span style={s.errorRow} title={file.error}>
                      <XCircle size={13} />
                      {file.error ?? 'Failed'}
                    </span>
                  )}
                </div>

                <div style={s.cardRight}>
                  {file.status === 'done' && (
                    <button style={s.btnDownload} onClick={() => downloadOne(file)}>
                      <Download size={13} />
                      Download
                    </button>
                  )}
                  {(file.status === 'processing' || file.status === 'pending') && (
                    <Loader2
                      size={17}
                      color={file.status === 'processing' ? 'var(--accent)' : 'var(--text-dim)'}
                      style={{ animation: file.status === 'processing' ? 'spin 1s linear infinite' : 'none' }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {files.length === 0 && (
          <div style={s.empty}>
            <FileImage size={38} color="var(--text-dim)" />
            <p style={s.emptyText}>No files yet — drop some images above</p>
          </div>
        )}

        <OtherTools currentToolId="compress" />
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
  configContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  targetBar: {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    padding: '10px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  pngBar: {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    padding: '10px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  targetLabel: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
  targetOptions: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  targetBtn: {
    padding: '5px 14px', fontSize: 13, fontWeight: 500,
    background: 'transparent', color: 'var(--text-muted)',
    border: '1px solid var(--border)', borderRadius: 20,
    cursor: 'pointer', transition: 'all 150ms ease', fontFamily: 'inherit',
  },
  targetBtnActive: {
    background: 'var(--accent-subtle)', color: 'var(--accent-hover)',
    border: '1px solid var(--accent)', fontWeight: 600,
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
  pill: {
    background: 'var(--success-subtle)', color: 'var(--success)',
    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginLeft: 2,
  },
  pillKept: {
    background: 'rgba(245,158,11,0.12)', color: 'var(--warning)',
    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginLeft: 2,
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 15px', background: 'var(--accent)', color: '#fff',
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
  pillMuted: {
    fontSize: 12, color: 'var(--text-muted)',
    background: 'var(--bg-elevated)', padding: '3px 10px',
    borderRadius: 20, border: '1px solid var(--border)',
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
  savingsPill: {
    background: 'var(--success-subtle)', color: 'var(--success)',
    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
  },
  savingsPillWarn: {
    background: 'rgba(245,158,11,0.12)', color: 'var(--warning)',
  },
  keptPill: {
    background: 'rgba(245,158,11,0.12)', color: 'var(--warning)',
    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    cursor: 'help',
  },
  errorRow: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 12, color: 'var(--error)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200,
  },
  cardRight: { flex: '0 0 auto', display: 'flex', alignItems: 'center' },
  empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '44px 0', color: 'var(--text-dim)' },
  emptyText: { fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' },
};
