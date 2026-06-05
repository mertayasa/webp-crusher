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
  Zap,
  Target,
} from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';
import type { ImageFile, FileStatus } from './types';
import { compressToWebP, compressToTargetBytes } from './utils/compress';
import { formatBytes, calcSavings, toWebpName } from './utils/format';
import './App.css';

const CONCURRENCY = 3;
const MAX_FILES   = 10;

// Target size options — null means "quality mode" (fixed 82%)
const SIZE_OPTIONS: Array<{ label: string; kb: number | null }> = [
  { label: '50 KB',  kb: 50   },
  { label: '100 KB', kb: 100  },
  { label: '200 KB', kb: 200  },
  { label: '500 KB', kb: 500  },
  { label: 'No limit', kb: null },
];

const DEFAULT_TARGET_KB = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: FileStatus): string {
  switch (status) {
    case 'done':       return 'var(--success)';
    case 'error':      return 'var(--error)';
    case 'processing': return 'var(--accent)';
    default:           return 'var(--text-muted)';
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [files, setFiles]         = useState<ImageFile[]>([]);
  const [zipping, setZipping]     = useState(false);
  const [targetKB, setTargetKB]   = useState<number | null>(DEFAULT_TARGET_KB);
  const [trimmed, setTrimmed]     = useState(false); // true when we had to drop files over the limit

  // Locked only when the 10-file cap is reached
  const isLocked = files.length >= MAX_FILES;

  // ── Process a single file
  const processFile = useCallback(async (
    id: string,
    file: File,
    kb: number | null,
  ) => {
    setFiles(prev =>
      prev.map(f => f.id === id ? { ...f, status: 'processing' as FileStatus } : f),
    );
    try {
      const blob = kb !== null
        ? await compressToTargetBytes(file, kb * 1024)
        : await compressToWebP(file, 0.82);

      // Detect if the engine fell back to the original (blob.type won't be webp)
      const keptOriginal = blob.type !== 'image/webp';

      setFiles(prev =>
        prev.map(f =>
          f.id === id
            ? {
                ...f,
                status: 'done',
                blob,
                compressedSize: blob.size,
                keptOriginal,
                // Update filename: keep original ext if we couldn't beat it
                webpName: keptOriginal ? file.name : toWebpName(file.name),
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

  // ── Drop handler
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted.length || isLocked) return;

      const currentTarget = targetKB; // capture at drop time

      // Calculate how many slots are still available
      const slotsLeft = MAX_FILES - files.length;
      const sliced    = accepted.slice(0, slotsLeft);
      setTrimmed(accepted.length > slotsLeft);

      const newFiles: ImageFile[] = sliced.map(file => ({
        id: crypto.randomUUID(),
        name: file.name,
        originalFile: file,
        originalSize: file.size,
        blob: null,
        compressedSize: null,
        status: 'pending',
        webpName: toWebpName(file.name),
        keptOriginal: false,
      }));

      // Append to existing queue (don't replace it)
      setFiles(prev => [...prev, ...newFiles]);

      const run = async () => {
        for (let i = 0; i < newFiles.length; i += CONCURRENCY) {
          const batch = newFiles.slice(i, i + CONCURRENCY);
          await Promise.all(
            batch.map(f => processFile(f.id, f.originalFile, currentTarget)),
          );
        }
      };
      run();
    },
    [processFile, targetKB, isLocked, files.length],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled: isLocked,
    accept: {
      'image/png':  ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    multiple: true,
  });

  // ── Download single
  const downloadOne = (file: ImageFile) => {
    if (!file.blob) return;
    saveAs(file.blob, file.webpName);
  };

  // ── Download all ZIP
  const downloadAll = async () => {
    const done = files.filter(f => f.status === 'done' && f.blob);
    if (!done.length) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      done.forEach(f => zip.file(f.webpName, f.blob!));
      const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(content, 'webp-images.zip');
    } finally {
      setZipping(false);
    }
  };

  const clearAll = () => { setFiles([]); setTrimmed(false); };

  // ── Derived stats
  const total              = files.length;
  const doneCount          = files.filter(f => f.status === 'done').length;
  const processingCount    = files.filter(f => f.status === 'processing' || f.status === 'pending').length;
  const doneFiles          = files.filter(f => f.status === 'done');
  const compressedFiles    = doneFiles.filter(f => !f.keptOriginal);
  const keptOriginalCount  = doneFiles.filter(f => f.keptOriginal).length;
  const totalCompressed    = compressedFiles.reduce((a, f) => a + (f.compressedSize ?? 0), 0);
  const totalOriginal      = compressedFiles.reduce((a, f) => a + f.originalSize, 0);
  const overallSavings     = compressedFiles.length > 0 ? calcSavings(totalOriginal, totalCompressed) : 0;

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={s.root}>
      {/* ── Header */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo}>
            <div style={s.logoIcon}><Zap size={18} color="#fff" /></div>
            <span style={s.logoText}>WebP Crusher</span>
          </div>
          <span style={s.headerBadge}>PNG &amp; JPG → WebP · Client-Side · Private</span>
        </div>
      </header>

      <main style={s.main}>
        {/* ── Target Size Selector */}
        <div style={s.targetBar}>
          <span style={s.targetLabel}><Target size={13} /> Target size:</span>
          <div style={s.targetOptions} role="group" aria-label="Target output file size">
            {SIZE_OPTIONS.map(opt => (
              <button
                key={opt.label}
                style={{
                  ...s.targetBtn,
                  ...(targetKB === opt.kb ? s.targetBtnActive : {}),
                }}
                onClick={() => setTargetKB(opt.kb)}
                aria-pressed={targetKB === opt.kb}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {targetKB !== null && (
            <span style={s.targetNote}>
              Binary search quality + auto-resize to fit ≤ {targetKB} KB
            </span>
          )}
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
          aria-label={isLocked ? 'Clear files to start a new batch' : 'Drop PNG or JPG files here'}
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
                  ? 'Only PNG and JPG files are accepted'
                  : isDragActive
                    ? 'Release to compress!'
                    : `Drop up to ${MAX_FILES} PNG or JPG files here`}
            </p>
            <p style={s.dropSub}>
              {isLocked
                ? 'Clear files to free up slots'
                : !isDragReject
                  ? files.length > 0
                    ? `${MAX_FILES - files.length} slot${MAX_FILES - files.length !== 1 ? 's' : ''} remaining · click or drop more`
                    : `or click to browse · up to ${MAX_FILES} files`
                  : ''}
            </p>
          </div>
        </div>

        {/* ── Trimmed notice */}
        {trimmed && (
          <div style={s.notice}>
            Some files were skipped — only {MAX_FILES - files.length} slot{MAX_FILES - files.length !== 1 ? 's' : ''} were available.
          </div>
        )}

        {/* ── Toolbar */}
        {total > 0 && (
          <div style={s.toolbar}>
            <div style={s.toolbarLeft}>
              {/* File counter */}
              <span style={s.counter}>
                {total} / {MAX_FILES}
              </span>
              {processingCount > 0 ? (
                <span style={s.statBusy}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  {targetKB ? `Searching optimal quality…` : 'Converting…'}
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
              {compressedFiles.length > 0 && (
                <span style={s.sizes}>
                  {formatBytes(totalOriginal)} → {formatBytes(totalCompressed)}
                </span>
              )}
            </div>
            <div style={s.toolbarRight}>
              {doneCount > 1 && (
                <button
                  style={s.btnPrimary}
                  onClick={downloadAll}
                  disabled={zipping}
                  aria-label="Download all as ZIP"
                >
                  {zipping
                    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Archive size={14} />}
                  {zipping ? 'Zipping…' : 'Download All ZIP'}
                </button>
              )}
              <button style={s.btnGhostDanger} onClick={clearAll} aria-label="Clear all files to start new batch">
                <Trash2 size={14} />
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* ── File List */}
        {files.length > 0 && (
          <ul style={s.list} aria-label="File conversion queue">
            {files.map(file => (
              <li key={file.id} style={s.card}>
                {/* Left: icon + filenames */}
                <div style={s.cardLeft}>
                  <div style={{ color: statusColor(file.status), flexShrink: 0 }}>
                    <FileImage size={20} />
                  </div>
                  <div style={s.fileNames}>
                    <span style={s.fileOut} title={file.webpName}>{file.webpName}</span>
                    <span style={s.fileIn}  title={file.name}>{file.name}</span>
                  </div>
                </div>

                {/* Middle: status / progress / sizes */}
                <div style={s.cardMid}>
                  {file.status === 'pending' && (
                    <span style={s.pillMuted}>Queued</span>
                  )}

                  {file.status === 'processing' && (
                    <div style={s.progressWrap}>
                      <div style={s.progressTrack}>
                        <div style={s.progressBar} />
                      </div>
                      <span style={s.progressLabel}>
                        {targetKB ? `Optimizing to ≤${targetKB} KB…` : 'Converting…'}
                      </span>
                    </div>
                  )}

                  {file.status === 'done' && file.compressedSize !== null && (
                    <div style={s.sizeRow}>
                      <span style={s.sizeOrig}>{formatBytes(file.originalSize)}</span>
                      <span style={s.sizeArrow}>→</span>
                      <span style={s.sizeNew}>{formatBytes(file.compressedSize)}</span>
                      {file.keptOriginal ? (
                        <span style={s.keptPill} title="WebP would be larger — original format kept">
                          Original kept
                        </span>
                      ) : (
                        <span style={{
                          ...s.savingsPill,
                          ...(targetKB && file.compressedSize > targetKB * 1024
                            ? s.savingsPillWarn : {}),
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
                      {file.error ?? 'Conversion failed'}
                    </span>
                  )}
                </div>

                {/* Right: action */}
                <div style={s.cardRight}>
                  {file.status === 'done' && (
                    <button
                      style={s.btnDownload}
                      onClick={() => downloadOne(file)}
                      aria-label={`Download ${file.webpName}`}
                    >
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

        {/* ── Empty state */}
        {files.length === 0 && (
          <div style={s.empty}>
            <FileImage size={38} color="var(--text-dim)" />
            <p style={s.emptyText}>No files yet — drop some images above</p>
          </div>
        )}
      </main>

      <footer style={s.footer}>
        All processing happens in your browser — files never leave your device.
      </footer>
      <Analytics />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  root: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' },

  // Header
  header: {
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    position: 'sticky', top: 0, zIndex: 10,
  },
  headerInner: {
    maxWidth: 860, margin: '0 auto', padding: '13px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
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

  // Main
  main: {
    flex: 1, maxWidth: 860, width: '100%', margin: '0 auto',
    padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16,
  },

  // Target size bar
  targetBar: {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    padding: '10px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  targetLabel: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
  targetOptions: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  targetBtn: {
    padding: '4px 12px', fontSize: 12, fontWeight: 500,
    background: 'transparent', color: 'var(--text-muted)',
    border: '1px solid var(--border)', borderRadius: 20,
    cursor: 'pointer', transition: 'all 150ms ease', fontFamily: 'inherit',
  },
  targetBtnActive: {
    background: 'var(--accent-subtle)', color: 'var(--accent-hover)',
    border: '1px solid var(--accent)', fontWeight: 600,
  },
  targetNote: {
    fontSize: 11, color: 'var(--text-muted)',
    borderLeft: '1px solid var(--border)', paddingLeft: 12,
    flexShrink: 0,
  },

  // Drop zone
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

  // Trimmed notice
  notice: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '8px 16px',
    background: 'rgba(245,158,11,0.10)',
    border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 'var(--radius)',
    fontSize: 12, color: 'var(--warning)', fontWeight: 500,
  },

  // Toolbar
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
  sizes: { fontSize: 12, color: 'var(--text-muted)' },

  // Buttons
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 15px', background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 150ms ease',
  },
  btnGhost: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 13px', background: 'transparent', color: 'var(--text-muted)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
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

  // File list
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

  // Empty
  empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '44px 0', color: 'var(--text-dim)' },
  emptyText: { fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' },

  // Footer
  footer: {
    padding: '14px 24px', textAlign: 'center',
    fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)',
  },
};
