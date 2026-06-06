"use client";
import { useState, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';
import {
  Upload,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Scissors,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import { formatBytes } from '../utils/format';
import '../App.css';

type Status = 'idle' | 'loading' | 'rendering' | 'processing' | 'done' | 'error';
type Mode = 'keep' | 'remove';

interface PdfPagePreview {
  pageNumber: number;
  status: 'pending' | 'rendering' | 'done' | 'error';
  dataUrl: string | null;
  selected: boolean;
}

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [mode, setMode] = useState<Mode>('keep');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [pdfjs, setPdfjs] = useState<any | null>(null);
  const [pdfJsDoc, setPdfJsDoc] = useState<any | null>(null);
  const [pages, setPages] = useState<PdfPagePreview[]>([]);

  useEffect(() => {
    import('pdfjs-dist').then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      setPdfjs(pdfjsLib);
    }).catch((err) => {
      console.error("Failed to load pdfjs-dist dynamically:", err);
    });
  }, []);

  const clearAll = useCallback(() => {
    pages.forEach((p) => {
      if (p.dataUrl) URL.revokeObjectURL(p.dataUrl);
    });
    setFile(null);
    setStatus('idle');
    setError('');
    setTotalPages(0);
    setOriginalSize(0);
    setPdfJsDoc(null);
    setPages([]);
  }, [pages]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f || !pdfjs) return;

    clearAll();
    setStatus('loading');
    setFile(f);
    setOriginalSize(f.size);

    try {
      const arrayBuffer = await f.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setTotalPages(pdf.numPages);
      setPdfJsDoc(pdf);
      setStatus('rendering');
    } catch (err) {
      console.error(err);
      setError('Failed to read PDF. It might be corrupted or password protected.');
      setFile(null);
      setStatus('error');
    }
  }, [clearAll, pdfjs]);

  // Handle rendering of PDF pages
  useEffect(() => {
    if (!pdfJsDoc) return;

    let active = true;
    const renderPages = async () => {
      const numPages = pdfJsDoc.numPages;
      const initialPages: PdfPagePreview[] = Array.from({ length: numPages }, (_, i) => ({
        pageNumber: i + 1,
        status: 'pending',
        dataUrl: null,
        selected: false,
      }));
      setPages(initialPages);

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (!active) break;
        setPages((prev) => prev.map((p) => (p.pageNumber === pageNum ? { ...p, status: 'rendering' } : p)));

        try {
          const page = await pdfJsDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: 0.5 }); // Low res for fast preview
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error("No context");

          await page.render({ canvasContext: context, viewport }).promise;
          if (!active) break;

          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.8));
          if (!blob) throw new Error("No blob");
          const dataUrl = URL.createObjectURL(blob);

          if (!active) {
            URL.revokeObjectURL(dataUrl);
            break;
          }
          setPages((prev) => prev.map((p) => p.pageNumber === pageNum ? { ...p, status: 'done', dataUrl } : p));
        } catch (err) {
          if (active) {
            setPages((prev) => prev.map((p) => p.pageNumber === pageNum ? { ...p, status: 'error' } : p));
          }
        }
      }
      if (active) setStatus('idle');
    };

    renderPages();
    return () => { active = false; };
  }, [pdfJsDoc]);

  const togglePage = (pageNum: number) => {
    setPages(prev => prev.map(p => p.pageNumber === pageNum ? { ...p, selected: !p.selected } : p));
  };

  const selectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: true })));
  const deselectAll = () => setPages(prev => prev.map(p => ({ ...p, selected: false })));

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    disabled: status === 'loading' || status === 'processing',
  });

  const parsePageString = (input: string, maxPages: number): number[] => {
    const pageSet = new Set<number>();
    const parts = input.split(',').map(p => p.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (!isNaN(start) && !isNaN(end) && start <= end && start >= 1 && end <= maxPages) {
          for (let i = start; i <= end; i++) {
            pageSet.add(i - 1); // 0-indexed for pdf-lib
          }
        } else {
          throw new Error(`Invalid range: ${part}`);
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
          pageSet.add(pageNum - 1);
        } else {
          throw new Error(`Invalid page number: ${part}`);
        }
      }
    }

    return Array.from(pageSet).sort((a, b) => a - b);
  };

  const processPdf = async () => {
    const selectedIndices = pages.filter(p => p.selected).map(p => p.pageNumber - 1);
    
    if (selectedIndices.length === 0) {
      setError('Please select at least one page.');
      return;
    }

    setStatus('processing');
    setError('');

    try {
      let finalIndicesToKeep: number[] = [];

      if (mode === 'keep') {
        finalIndicesToKeep = selectedIndices;
      } else {
        // mode === 'remove'
        const allIndices = Array.from({ length: totalPages }, (_, i) => i);
        finalIndicesToKeep = allIndices.filter(i => !selectedIndices.includes(i));
      }

      if (finalIndicesToKeep.length === 0) {
        throw new Error('You cannot remove all pages from the document.');
      }

      // Read original doc
      const arrayBuffer = await file!.arrayBuffer();
      const sourceDoc = await PDFDocument.load(arrayBuffer);

      // Create new doc
      const newDoc = await PDFDocument.create();

      // Copy selected pages
      const copiedPages = await newDoc.copyPages(sourceDoc, finalIndicesToKeep);
      copiedPages.forEach((page) => newDoc.addPage(page));

      // Save
      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      const baseName = file!.name.replace(/\.pdf$/i, '');
      const actionLabel = mode === 'keep' ? 'extracted' : 'trimmed';
      saveAs(blob, `${baseName}-${actionLabel}.pdf`);

      setStatus('done');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process PDF.');
      setStatus('error');
    }
  };

  const isBusy = status === 'loading' || status === 'rendering' || status === 'processing';
  const selectedCount = pages.filter(p => p.selected).length;

  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>Split & Extract PDF</h1>
        <p style={s.toolDesc}>
          Extract specific pages or remove unwanted pages from your PDF document. 
          Everything runs <strong>100% locally in your browser</strong>.
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
                ? 'Only PDF files are supported'
                : isDragActive
                  ? 'Release to upload!'
                  : 'Drop a PDF here, or click to browse'}
            </p>
            <p style={s.dropSub}>PDF · Max 100MB</p>
          </div>
        </div>
      )}

      {error && (
        <div style={s.errorNotice}>
          <XCircle size={14} style={{ marginRight: 6, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {file && status !== 'loading' && (
        <div style={s.editorBox}>
          
          <div style={s.fileHeader}>
            <div style={s.fileInfo}>
              <div style={s.fileIcon}><Scissors size={20} color="var(--accent)" /></div>
              <div style={s.fileDetails}>
                <span style={s.fileName} title={file.name}>{file.name}</span>
                <span style={s.fileMeta}>
                  {totalPages} pages • {formatBytes(originalSize)}
                </span>
              </div>
            </div>
            <button style={s.btnGhostDanger} onClick={clearAll} disabled={isBusy}>
              Change File
            </button>
          </div>

          <div style={s.controls}>
            <div style={s.modeSelector}>
              <div style={s.radioGroup}>
                <label style={s.radioLabel}>
                  <input 
                    type="radio" 
                    name="mode" 
                    checked={mode === 'keep'} 
                    onChange={() => setMode('keep')}
                    style={s.radio}
                  />
                  Extract/Keep Selected
                </label>
                <label style={s.radioLabel}>
                  <input 
                    type="radio" 
                    name="mode" 
                    checked={mode === 'remove'} 
                    onChange={() => setMode('remove')}
                    style={s.radio}
                  />
                  Remove Selected
                </label>
              </div>
              <div style={s.selectionActions}>
                <button style={s.btnText} onClick={selectAll}>Select All</button>
                <span style={{ color: 'var(--border)' }}>|</span>
                <button style={s.btnText} onClick={deselectAll}>Deselect All</button>
              </div>
            </div>

            <div style={s.pageGrid}>
              {pages.map((p) => (
                <div 
                  key={p.pageNumber} 
                  style={{
                    ...s.pageThumbWrapper,
                    ...(p.selected ? s.pageThumbSelected : {}),
                    ...(mode === 'remove' && p.selected ? s.pageThumbRemove : {})
                  }}
                  onClick={() => togglePage(p.pageNumber)}
                >
                  <div style={s.pageThumbInner}>
                    {p.status === 'done' && p.dataUrl ? (
                      <img src={p.dataUrl} alt={`Page ${p.pageNumber}`} style={s.pageThumbImg} />
                    ) : (
                      <div style={s.pageThumbLoading}>
                        {p.status === 'error' ? <XCircle size={16} color="var(--error)" /> : <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                      </div>
                    )}
                  </div>
                  <div style={s.pageThumbLabel}>
                    <input 
                      type="checkbox" 
                      checked={p.selected} 
                      readOnly 
                      style={{ accentColor: mode === 'remove' ? 'var(--error)' : 'var(--accent)', pointerEvents: 'none' }}
                    />
                    <span>Pg {p.pageNumber}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.actions}>
            {status === 'done' ? (
              <span style={s.successText}>
                <CheckCircle2 size={16} /> PDF processed successfully!
              </span>
            ) : (
              <span style={s.selectionInfo}>
                {selectedCount} page{selectedCount !== 1 ? 's' : ''} selected
              </span>
            )}
            <button style={s.btnPrimary} onClick={processPdf} disabled={isBusy || selectedCount === 0}>
              {isBusy ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={15} />}
              {isBusy ? 'Processing...' : `Process & Download`}
            </button>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div style={s.loadingState}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
          <span>Parsing PDF Document...</span>
        </div>
      )}

      <OtherTools currentToolId="split-pdf" />
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

  loadingState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '40px 0', gap: 12, color: 'var(--text-muted)', fontSize: 14,
  },

  editorBox: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', overflow: 'hidden',
    boxShadow: 'var(--shadow-card)',
  },
  fileHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid var(--border)',
    background: 'var(--bg-surface)',
  },
  fileInfo: { display: 'flex', alignItems: 'center', gap: 14 },
  fileIcon: {
    width: 40, height: 40, borderRadius: 8, background: 'var(--accent-subtle)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  fileDetails: { display: 'flex', flexDirection: 'column', gap: 2 },
  fileName: { fontSize: 15, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 },
  fileMeta: { fontSize: 13, color: 'var(--text-muted)' },
  
  controls: {
    padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20,
  },
  modeSelector: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
    background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)'
  },
  radioGroup: { display: 'flex', gap: 24 },
  radioLabel: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 14, fontWeight: 600, color: 'var(--text)', cursor: 'pointer',
  },
  radio: {
    width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer',
  },
  selectionActions: { display: 'flex', alignItems: 'center', gap: 12 },
  btnText: { background: 'none', border: 'none', color: 'var(--accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer' },

  pageGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 16,
    maxHeight: 400, overflowY: 'auto', padding: '4px',
  },
  pageThumbWrapper: {
    display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer',
    padding: 8, borderRadius: 'var(--radius-md)', border: '2px solid transparent',
    transition: 'all 150ms ease', background: 'var(--bg-surface)',
  },
  pageThumbSelected: {
    border: '2px solid var(--accent)', background: 'var(--accent-subtle)', boxShadow: 'var(--shadow-glow)'
  },
  pageThumbRemove: {
    border: '2px solid var(--error)', background: 'var(--error-subtle)'
  },
  pageThumbInner: {
    aspectRatio: '0.707', background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
  },
  pageThumbImg: { width: '100%', height: '100%', objectFit: 'contain' },
  pageThumbLoading: { color: 'var(--text-muted)' },
  pageThumbLabel: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontSize: 12, fontWeight: 600, color: 'var(--text-muted)'
  },

  actions: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
  },
  selectionInfo: { fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' },
  successText: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--success)' },

  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease',
  },
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
    background: 'rgba(239,68,68,0.06)', color: 'var(--error)',
    border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
};
