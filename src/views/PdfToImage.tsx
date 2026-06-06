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
  FileText,
  Settings,
  Target
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import { formatBytes } from '../utils/format';
import '../App.css';

interface PdfPage {
  pageNumber: number;
  status: 'pending' | 'rendering' | 'done' | 'error';
  blob: Blob | null;
  dataUrl: string | null;
  width: number;
  height: number;
  error?: string;
}

const SCALE_OPTIONS = [
  { label: '1.0x (Web)', value: 1.0 },
  { label: '1.5x (Medium)', value: 1.5 },
  { label: '2.0x (High-Res)', value: 2.0 },
  { label: '3.0x (Ultra)', value: 3.0 },
];

const FORMAT_OPTIONS = [
  { label: 'PNG (Lossless)', value: 'png' },
  { label: 'JPEG (Standard)', value: 'jpeg' },
];

export default function PdfToImage() {
  const [pdfjs, setPdfjs] = useState<any | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  const [pdfSize, setPdfSize] = useState<number>(0);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [scaleMultiplier, setScaleMultiplier] = useState<number>(1.5);
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg'>('png');
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState<string>('');

  // Dynamically load PDF.js client-side only
  useEffect(() => {
    import('pdfjs-dist').then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      setPdfjs(pdfjsLib);
    }).catch((err) => {
      console.error("Failed to load pdfjs-dist dynamically:", err);
      setError("Failed to initialize PDF library. Please try reloading the page.");
    });
  }, []);

  const clearAll = useCallback(() => {
    pages.forEach((p) => {
      if (p.dataUrl) URL.revokeObjectURL(p.dataUrl);
    });
    setPages([]);
    setPdfDoc(null);
    setPdfName('');
    setPdfSize(0);
    setError('');
  }, [pages]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !pdfjs) return;

    clearAll();
    setLoadingPdf(true);
    setPdfName(file.name);
    setPdfSize(file.size);
    setError('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
    } catch (err) {
      console.error("Error loading PDF document:", err);
      setError((err as Error).message || "Failed to load PDF file. It may be corrupt or encrypted.");
      setPdfName('');
      setPdfSize(0);
    } finally {
      setLoadingPdf(false);
    }
  }, [clearAll, pdfjs]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    disabled: !pdfjs || loadingPdf,
  });

  // Handle rendering of PDF pages when doc, scale or format changes
  useEffect(() => {
    if (!pdfDoc) return;

    let active = true;

    const renderPages = async () => {
      // Revoke any existing object URLs to free memory
      pages.forEach((p) => {
        if (p.dataUrl) URL.revokeObjectURL(p.dataUrl);
      });

      const totalPages = pdfDoc.numPages;
      const initialPages: PdfPage[] = Array.from({ length: totalPages }, (_, i) => ({
        pageNumber: i + 1,
        status: 'pending',
        blob: null,
        dataUrl: null,
        width: 0,
        height: 0,
      }));
      setPages(initialPages);

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (!active) break;

        setPages((prev) =>
          prev.map((p) => (p.pageNumber === pageNum ? { ...p, status: 'rendering' } : p))
        );

        try {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: scaleMultiplier });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');

          if (!context) throw new Error("Could not initialize canvas context");

          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;

          if (!active) break;

          const mimeType = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), mimeType, 0.92);
          });

          if (!blob) throw new Error("Failed to export canvas blob");

          const dataUrl = URL.createObjectURL(blob);

          if (!active) {
            URL.revokeObjectURL(dataUrl);
            break;
          }

          setPages((prev) =>
            prev.map((p) =>
              p.pageNumber === pageNum
                ? {
                    ...p,
                    status: 'done',
                    blob,
                    dataUrl,
                    width: viewport.width,
                    height: viewport.height,
                  }
                : p
            )
          );
        } catch (err) {
          console.error(`Error rendering page ${pageNum}:`, err);
          if (active) {
            setPages((prev) =>
              prev.map((p) =>
                p.pageNumber === pageNum
                  ? { ...p, status: 'error', error: (err as Error).message }
                  : p
              )
            );
          }
        }
      }
    };

    renderPages();

    return () => {
      active = false;
    };
  }, [pdfDoc, scaleMultiplier, outputFormat]);

  const downloadOne = (page: PdfPage) => {
    if (!page.blob) return;
    const baseName = pdfName.replace(/\.pdf$/i, '');
    const ext = outputFormat;
    saveAs(page.blob, `${baseName}_page_${page.pageNumber}.${ext}`);
  };

  const downloadAll = async () => {
    const rendered = pages.filter((p) => p.status === 'done' && p.blob);
    if (rendered.length === 0) return;

    setZipping(true);
    try {
      const zip = new JSZip();
      const baseName = pdfName.replace(/\.pdf$/i, '');
      const ext = outputFormat;

      rendered.forEach((p) => {
        const fileName = `${baseName}_page_${p.pageNumber}.${ext}`;
        zip.file(fileName, p.blob!);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(zipBlob, `${baseName}-images.zip`);
    } catch (err) {
      console.error("ZIP Generation failed:", err);
    } finally {
      setZipping(false);
    }
  };

  const total = pages.length;
  const doneCount = pages.filter((p) => p.status === 'done').length;
  const renderingCount = pages.filter((p) => p.status === 'rendering' || p.status === 'pending').length;

  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>PDF to Image Converter</h1>
        <p style={s.toolDesc}>
          Convert PDF pages into high-quality PNG or JPEG images. <strong>100% private</strong> — all processing occurs locally in your browser, files never touch a server.
        </p>
      </div>

      {/* ── Configuration Bar */}
      <div style={s.configContainer}>
        {/* Output Format */}
        <div style={s.configBar}>
          <span style={s.configLabel}><Settings size={14} /> Output Format:</span>
          <div style={s.optionList}>
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                style={{
                  ...s.optionBtn,
                  ...(outputFormat === opt.value ? s.optionBtnActive : {}),
                }}
                onClick={() => setOutputFormat(opt.value as 'png' | 'jpeg')}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution Scale */}
        <div style={s.configBar}>
          <span style={s.configLabel}><Target size={14} /> Resolution Quality:</span>
          <div style={s.optionList}>
            {SCALE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                style={{
                  ...s.optionBtn,
                  ...(scaleMultiplier === opt.value ? s.optionBtnActive : {}),
                }}
                onClick={() => setScaleMultiplier(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Drop Zone */}
      {!pdfDoc && (
        <div
          {...getRootProps()}
          style={{
            ...s.dropzone,
            ...(isDragActive && !isDragReject ? s.dropzoneActive : {}),
            ...(isDragReject ? s.dropzoneReject : {}),
          }}
        >
          <input {...getInputProps()} />
          <div style={s.dropContent}>
            <div style={{
              ...s.dropIcon,
              ...(isDragActive ? s.dropIconActive : {}),
            }}>
              {loadingPdf || !pdfjs ? (
                <Loader2 size={26} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
              ) : (
                <FileText size={26} color={isDragReject ? 'var(--error)' : 'var(--accent)'} />
              )}
            </div>
            <p style={s.dropTitle}>
              {isDragReject
                ? 'Only PDF documents are accepted'
                : isDragActive
                ? 'Release to load PDF!'
                : !pdfjs
                ? 'Initializing PDF library…'
                : loadingPdf
                ? 'Reading PDF file…'
                : 'Drop PDF file here, or click to browse'}
            </p>
            <p style={s.dropSub}>
              Extract and convert pages locally
            </p>
          </div>
        </div>
      )}

      {error && (
        <div style={s.notice}>
          <XCircle size={14} style={{ marginRight: 6 }} />
          {error}
        </div>
      )}

      {/* ── Toolbar */}
      {pdfDoc && total > 0 && (
        <div style={s.toolbar}>
          <div style={s.toolbarLeft}>
            <div style={s.pdfInfo}>
              <span style={s.pdfName} title={pdfName}>{pdfName}</span>
              <span style={s.pdfSize}>{formatBytes(pdfSize)}</span>
            </div>
            {renderingCount > 0 ? (
              <span style={s.statBusy}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Converting pages… ({renderingCount} remaining)
              </span>
            ) : (
              <span style={s.statDone}>
                <CheckCircle2 size={14} />
                {doneCount} of {total} pages ready
              </span>
            )}
          </div>
          <div style={s.toolbarRight}>
            {doneCount > 0 && (
              <button
                style={s.btnPrimary}
                onClick={downloadAll}
                disabled={zipping}
              >
                {zipping ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Archive size={14} />
                )}
                {zipping ? 'Zipping…' : 'Download All (.ZIP)'}
              </button>
            )}
            <button style={s.btnGhostDanger} onClick={clearAll}>
              <Trash2 size={14} />
              Clear PDF
            </button>
          </div>
        </div>
      )}

      {/* ── Page Preview Grid */}
      {pdfDoc && total > 0 && (
        <div style={s.grid}>
          {pages.map((page) => (
            <div key={page.pageNumber} style={s.pageCard}>
              <div style={s.pagePreview}>
                {page.status === 'pending' && (
                  <div style={s.placeholder}>
                    <span style={s.pageLabel}>Page {page.pageNumber}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Queued</span>
                  </div>
                )}
                {page.status === 'rendering' && (
                  <div style={s.placeholder}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
                    <span style={s.pageLabel}>Rendering Page {page.pageNumber}…</span>
                  </div>
                )}
                {page.status === 'error' && (
                  <div style={s.placeholder}>
                    <XCircle size={24} color="var(--error)" />
                    <span style={s.pageLabel}>Page {page.pageNumber}</span>
                    <span style={{ fontSize: 11, color: 'var(--error)' }}>{page.error || 'Failed'}</span>
                  </div>
                )}
                {page.status === 'done' && page.dataUrl && (
                  <img src={page.dataUrl} alt={`Page ${page.pageNumber}`} style={s.thumbnail} />
                )}
              </div>
              <div style={s.pageFooter}>
                <span style={s.pageNum}>Page {page.pageNumber}</span>
                {page.status === 'done' && (
                  <button style={s.btnDownloadOne} onClick={() => downloadOne(page)}>
                    <Download size={12} />
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <OtherTools currentToolId="pdf-to-image" />
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
  dropzone: {
    border: '2px dashed var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '60px 24px',
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
  dropTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },
  dropSub: { fontSize: 13, color: 'var(--text-muted)' },
  notice: {
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
    gap: 12,
    padding: '10px 16px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', minWidth: 0, flex: 1 },
  toolbarRight: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  pdfInfo: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, maxWidth: 280 },
  pdfName: { fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  pdfSize: { fontSize: 11, color: 'var(--text-muted)' },
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 16,
    marginTop: 8,
  },
  pageCard: {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-card)',
    transition: 'all 200ms ease',
  },
  pagePreview: {
    position: 'relative',
    aspectRatio: '0.707',
    background: '#141722',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderBottom: '1px solid var(--border)',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    textAlign: 'center',
  },
  pageLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text)',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  pageFooter: {
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    background: 'var(--bg-surface)',
  },
  pageNum: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-muted)',
  },
  btnDownloadOne: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    background: 'var(--success-subtle)',
    color: 'var(--success)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 150ms ease',
  },
};
