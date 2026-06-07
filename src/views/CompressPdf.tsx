"use client";
import { useState, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  Upload,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  Settings,
  Archive
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import { formatBytes } from '../utils/format';
import '../App.css';

interface CompressionPreset {
  scale: number;
  quality: number;
  label: string;
}

const PRESETS: Record<string, CompressionPreset> = {
  low: { scale: 1.5, quality: 0.75, label: 'Low (Max Quality)' },
  medium: { scale: 1.2, quality: 0.60, label: 'Medium (Balanced)' },
  high: { scale: 1.0, quality: 0.45, label: 'High (Smallest Size)' },
};

const MAX_FILES = 10;
// We remove MAX_TOTAL_BYTES limit for PDFs as requested by user.

type FileStatus = 'pending' | 'processing' | 'done' | 'error';

interface PdfJob {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  status: FileStatus;
  progress: number;
  progressText: string;
  compressedSize: number | null;
  compressedBlob: Blob | null;
  error?: string;
  totalPages?: number;
}

function statusColor(status: FileStatus): string {
  switch (status) {
    case 'done':       return 'var(--success)';
    case 'error':      return 'var(--error)';
    case 'processing': return 'var(--accent)';
    default:           return 'var(--text-muted)';
  }
}

export default function CompressPdf() {
  const [pdfjs, setPdfjs] = useState<any | null>(null);
  const [files, setFiles] = useState<PdfJob[]>([]);
  const [presetKey, setPresetKey] = useState<string>('medium');
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string>('');
  
  const isLocked = files.length >= MAX_FILES;
  const processingCount = files.filter(f => f.status === 'processing' || f.status === 'pending').length;

  // Dynamically load PDF.js
  useEffect(() => {
    import('pdfjs-dist').then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      setPdfjs(pdfjsLib);
    }).catch((err) => {
      console.error("Failed to load pdfjs-dist dynamically:", err);
      setError("Failed to initialize PDF engine. Please reload the page.");
    });
  }, []);

  const processFile = useCallback(async (
    id: string,
    file: File,
    preset: CompressionPreset
  ) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'processing', progress: 0, progressText: 'Loading PDF...' } : f));
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const totalPages = pdfDoc.numPages;

      setFiles(prev => prev.map(f => f.id === id ? { ...f, totalPages } : f));

      const { scale, quality } = preset;
      const compressedPageBlobs: Blob[] = [];

      // 1. Render pages to compressed JPEG blobs sequentially
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, progressText: `Compressing page ${pageNum} / ${totalPages}…`, progress: Math.round((pageNum - 1) / totalPages * 90) } : f));

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');

        if (!context) throw new Error("Could not initialize canvas context");

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
        });

        if (!blob) throw new Error(`Failed to compress page ${pageNum}`);
        compressedPageBlobs.push(blob);
      }

      // 2. Recompile pages into a clean PDF using pdf-lib
      setFiles(prev => prev.map(f => f.id === id ? { ...f, progressText: 'Compiling PDF...', progress: 92 } : f));

      const { PDFDocument } = await import('pdf-lib');
      const newPdf = await PDFDocument.create();

      for (let i = 0; i < compressedPageBlobs.length; i++) {
        const pageBlob = compressedPageBlobs[i];
        const imgBytes = await pageBlob.arrayBuffer();
        const img = await newPdf.embedJpg(imgBytes);

        const page = newPdf.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }

      setFiles(prev => prev.map(f => f.id === id ? { ...f, progressText: 'Saving...', progress: 98 } : f));

      const pdfBytes = await newPdf.save();
      const outputBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      setFiles(prev => prev.map(f => f.id === id ? {
        ...f,
        status: 'done',
        progress: 100,
        compressedBlob: outputBlob,
        compressedSize: outputBlob.size
      } : f));
      
    } catch (err) {
      console.error("PDF Compression failed:", err);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, status: 'error', error: (err as Error).message || "An error occurred." } : f));
    }
  }, [pdfjs]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length || isLocked || !pdfjs) return;

    const currentPreset = PRESETS[presetKey];
    const slotsLeft = MAX_FILES - files.length;
    const sliced = acceptedFiles.slice(0, slotsLeft);

    const newJobs: PdfJob[] = sliced.map(file => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      originalSize: file.size,
      status: 'pending',
      progress: 0,
      progressText: 'Queued',
      compressedSize: null,
      compressedBlob: null,
    }));

    setFiles(prev => [...prev, ...newJobs]);

    // Sequential Queue Processor
    const run = async () => {
      for (const job of newJobs) {
        await processFile(job.id, job.file, currentPreset);
      }
    };
    run();
  }, [pdfjs, isLocked, files.length, presetKey, processFile]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    disabled: isLocked || !pdfjs,
  });

  const downloadOne = (job: PdfJob) => {
    if (!job.compressedBlob) return;
    const baseName = job.name.replace(/\.pdf$/i, '');
    saveAs(job.compressedBlob, `${baseName}_compressed.pdf`);
  };

  const downloadAll = async () => {
    const done = files.filter(f => f.status === 'done' && f.compressedBlob);
    if (!done.length) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      done.forEach(f => {
        const baseName = f.name.replace(/\.pdf$/i, '');
        zip.file(`${baseName}_compressed.pdf`, f.compressedBlob!);
      });
      const content = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(content, 'compressed-pdfs.zip');
    } finally {
      setZipping(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setError('');
  };

  const total = files.length;
  const doneCount = files.filter(f => f.status === 'done').length;
  
  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>PDF Compressor</h1>
        <p style={s.toolDesc}>
          Compress and optimize your PDF files. <strong>100% private</strong> — all compression occurs locally in your browser, files are never uploaded.
        </p>
      </div>

      {/* ── Configuration Bar */}
      <div style={s.configContainer}>
        <div style={s.configBar}>
          <span style={s.configLabel}><Settings size={14} /> Compression Preset:</span>
          <div style={s.optionList}>
            {Object.keys(PRESETS).map((key) => (
              <button
                key={key}
                style={{
                  ...s.optionBtn,
                  ...(presetKey === key ? s.optionBtnActive : {}),
                }}
                onClick={() => setPresetKey(key)}
                disabled={processingCount > 0}
              >
                {PRESETS[key].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Drop Zone */}
      <div
        {...getRootProps()}
        style={{
          ...s.dropzone,
          ...(isLocked || !pdfjs ? s.dropzoneLocked : {}),
          ...(!(isLocked || !pdfjs) && isDragActive && !isDragReject ? s.dropzoneActive : {}),
          ...(!(isLocked || !pdfjs) && isDragReject ? s.dropzoneReject : {}),
        }}
      >
        <input {...getInputProps()} />
        <div style={s.dropContent}>
          <div style={{
            ...s.dropIcon,
            ...(isLocked || !pdfjs ? s.dropIconLocked : {}),
            ...(!(isLocked || !pdfjs) && isDragActive ? s.dropIconActive : {}),
          }}>
            {!pdfjs ? (
              <Loader2 size={26} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
            ) : (
              <Upload size={26} color={isLocked ? 'var(--text-dim)' : isDragReject ? 'var(--error)' : 'var(--accent)'} />
            )}
          </div>
          <p style={{ ...s.dropTitle, ...(isLocked ? { color: 'var(--text-muted)' } : {}) }}>
            {!pdfjs 
              ? 'Initializing PDF engine...'
              : isLocked
              ? 'Clear files below to start a new batch'
              : isDragReject
                ? 'Only PDF documents are accepted'
                : isDragActive
                  ? 'Release to compress!'
                  : `Drop up to ${MAX_FILES} PDFs here (No size limit)`}
          </p>
          <p style={s.dropSub}>
            {!pdfjs 
              ? ''
              : isLocked
              ? 'Clear files to free up slots'
              : !isDragReject
                ? files.length > 0
                  ? `${MAX_FILES - files.length} slot${MAX_FILES - files.length !== 1 ? 's' : ''} remaining`
                  : `Accepts standard PDF files`
                : ''}
          </p>
        </div>
      </div>

      {error && (
        <div style={s.errorNotice}>
          <XCircle size={14} style={{ marginRight: 6 }} />
          {error}
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
                Compressing PDFs… ({processingCount} remaining)
              </span>
            ) : (
              <span style={s.statDone}>
                <CheckCircle2 size={14} />
                {doneCount} of {total} done
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
            <button style={s.btnGhostDanger} onClick={clearAll} disabled={processingCount > 0}>
              <Trash2 size={14} />
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* ── File List */}
      {files.length > 0 && (
        <ul style={s.list}>
          {files.map(job => (
            <li key={job.id} className="file-card">
              <div className="fc-left" style={s.cardLeft}>
                <div style={{ color: statusColor(job.status), flexShrink: 0 }}>
                  <FileText size={20} />
                </div>
                <div style={s.fileNames}>
                  <span style={s.fileOut} title={job.name}>{job.name}</span>
                  <span style={s.fileIn}>{formatBytes(job.originalSize)}</span>
                </div>
              </div>

              <div className="fc-mid" style={s.cardMid}>
                {job.status === 'pending' && <span style={s.pillMuted}>Queued</span>}
                
                {job.status === 'processing' && (
                  <div style={s.progressWrap}>
                    <div style={s.progressTrack}>
                      <div style={{ ...s.progressBar, width: `${job.progress}%` }} />
                    </div>
                    <span style={s.progressLabel}>{job.progressText}</span>
                  </div>
                )}

                {job.status === 'done' && job.compressedSize !== null && (
                  <div style={s.sizeRow}>
                    <span style={s.sizeOrig}>{formatBytes(job.originalSize)}</span>
                    <span style={s.sizeArrow}>→</span>
                    <span style={s.sizeNew}>{formatBytes(job.compressedSize)}</span>
                    <span style={s.savingsPill}>
                      {job.compressedSize < job.originalSize 
                        ? `−${((job.originalSize - job.compressedSize) / job.originalSize * 100).toFixed(1)}%`
                        : '+0%'}
                    </span>
                  </div>
                )}

                {job.status === 'error' && (
                  <span style={s.errorRow} title={job.error}>
                    <XCircle size={13} />
                    {job.error ?? 'Failed'}
                  </span>
                )}
              </div>

              <div className="fc-right" style={s.cardRight}>
                {job.status === 'done' && (
                  <button style={s.btnDownload} onClick={() => downloadOne(job)}>
                    <Download size={13} />
                    Download
                  </button>
                )}
                {(job.status === 'processing' || job.status === 'pending') && (
                  <Loader2
                    size={17}
                    color={job.status === 'processing' ? 'var(--accent)' : 'var(--text-dim)'}
                    style={{ animation: job.status === 'processing' ? 'spin 1s linear infinite' : 'none' }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {files.length === 0 && (
        <div style={s.empty}>
          <FileText size={38} color="var(--text-dim)" />
          <p style={s.emptyText}>No PDFs yet — drop some files above</p>
        </div>
      )}

      <OtherTools currentToolId="compress-pdf" />
    </main>
  );
}

const s: Record<string, CSSProperties> = {
  main: {
    flex: 1, maxWidth: 860, width: '100%', margin: '0 auto',
    padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16,
  },
  toolHero: { marginBottom: 8 },
  toolTitle: {
    fontSize: 28, fontWeight: 800, color: 'var(--text)',
    marginBottom: 8, letterSpacing: '-0.5px',
  },
  toolDesc: { fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.5 },
  configContainer: { display: 'flex', flexDirection: 'column', gap: 12 },
  configBar: {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    padding: '10px 16px', background: 'var(--bg-surface)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  },
  configLabel: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap',
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
    border: '2px dashed var(--border)', background: 'var(--bg)',
    cursor: 'not-allowed', opacity: 0.55,
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
  dropSub: { fontSize: 13, color: 'var(--text-muted)' },
  errorNotice: {
    display: 'flex', alignItems: 'center', padding: '8px 16px',
    background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--error)', fontWeight: 500,
  },
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    flexWrap: 'wrap', gap: 10, padding: '10px 16px',
    background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: 8 },
  counter: {
    fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
    background: 'var(--bg-elevated)', padding: '3px 9px',
    borderRadius: 20, border: '1px solid var(--border)', letterSpacing: '0.3px',
  },
  statBusy: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--accent)' },
  statDone: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--success)' },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 15px', background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 150ms ease',
  },
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 13px', background: 'rgba(239,68,68,0.06)', color: 'var(--error)',
    border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)',
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
    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-card)', animation: 'slide-in 200ms ease',
  },
  cardLeft: { display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto', maxWidth: 230, minWidth: 0 },
  fileNames: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  fileOut: { fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileIn: { fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardMid: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  pillMuted: {
    fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-elevated)',
    padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)',
  },
  progressWrap: { display: 'flex', flexDirection: 'column', gap: 4, width: '100%', maxWidth: 210 },
  progressTrack: { height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', position: 'relative' },
  progressBar: {
    position: 'absolute', inset: 0, width: '0%',
    background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
    borderRadius: 2, transition: 'width 200ms ease',
  },
  progressLabel: { fontSize: 11, color: 'var(--accent)', textAlign: 'center' },
  sizeRow: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  sizeOrig: { fontSize: 12, color: 'var(--text-muted)' },
  sizeArrow: { fontSize: 12, color: 'var(--border-hover)' },
  sizeNew: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  savingsPill: {
    background: 'var(--success-subtle)', color: 'var(--success)',
    padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
  },
  errorRow: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 12, color: 'var(--error)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200,
  },
  cardRight: { flex: '0 0 auto', display: 'flex', alignItems: 'center' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '44px 0', color: 'var(--text-dim)' },
  emptyText: { fontSize: 14, color: 'var(--text-muted)', textAlign: 'center' },
};
