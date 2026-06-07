"use client";
import { useState, useCallback, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import Draggable, { type DraggableEvent, type DraggableData } from 'react-draggable';
import {
  Upload,
  Download,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Fingerprint,
  Type,
  Image as ImageIcon
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import WatermarkControls from '../components/WatermarkControls';
import { formatBytes } from '../utils/format';
import '../App.css';

function useWindowWidth() {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return width;
}

type Status = 'idle' | 'loading' | 'rendering' | 'processing' | 'done' | 'error';
type Mode = 'text' | 'image';
type TextPreset = 'cross-single' | 'cross-repeat' | 'center' | 'bottom';

export default function WatermarkPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(0);
  const [originalSize, setOriginalSize] = useState<number>(0);
  
  const [pdfjs, setPdfjs] = useState<any | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  const windowWidth = useWindowWidth();
  const isDesktop = windowWidth >= 768;

  const [mode, setMode] = useState<Mode>('text');

  // Text Config
  const [text, setText] = useState<string>('CONFIDENTIAL');
  const [color, setColor] = useState<string>('#ef4444');
  const [opacity, setOpacity] = useState<number>(0.3);
  const [fontSize, setFontSize] = useState<number>(64);
  const [rotation, setRotation] = useState<number>(-45);
  const [textPreset, setTextPreset] = useState<TextPreset>('cross-repeat');

  // Image Config
  const [wmFile, setWmFile] = useState<File | null>(null);
  const [wmImg, setWmImg] = useState<HTMLImageElement | null>(null);
  const [wmImgSrc, setWmImgSrc] = useState<string>('');
  const [wmScale, setWmScale] = useState<number>(0.3); // 0.05 to 1.0
  const [wmOpacity, setWmOpacity] = useState<number>(0.8);
  const [wmPosPercent, setWmPosPercent] = useState<{x: number, y: number}>({x: 10, y: 10});

  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import('pdfjs-dist').then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      setPdfjs(pdfjsLib);
    }).catch((err) => {
      console.error("Failed to load pdfjs-dist dynamically:", err);
    });
  }, []);

  const clearAll = useCallback(() => {
    if (previewDataUrl) URL.revokeObjectURL(previewDataUrl);
    setFile(null);
    setStatus('idle');
    setError('');
    setTotalPages(0);
    setOriginalSize(0);
    setPreviewDataUrl(null);
    setWmFile(null);
    setWmImg(null);
    setWmImgSrc('');
  }, [previewDataUrl]);

  // Drop base PDF
  const onDropBase = useCallback(async (acceptedFiles: File[]) => {
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
      
      setStatus('rendering');

      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error("No context");

      await page.render({ canvasContext: context, viewport }).promise;

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9));
      if (!blob) throw new Error("No blob generated");
      
      setPreviewDataUrl(URL.createObjectURL(blob));
      setStatus('idle');

    } catch (err) {
      console.error(err);
      setError('Failed to read PDF. It might be corrupted or password protected.');
      setFile(null);
      setStatus('error');
    }
  }, [clearAll, pdfjs]);

  const { getRootProps: getBaseRootProps, getInputProps: getBaseInputProps, isDragActive: isDragBase, isDragReject: isDragBaseReject } = useDropzone({
    onDrop: onDropBase,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: status === 'loading' || status === 'processing',
  });

  // Drop Watermark Image
  const onDropWm = useCallback((accepted: File[]) => {
    if (!accepted.length) return;
    const selected = accepted[0];
    setWmFile(selected);

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result?.toString() || '';
      setWmImgSrc(src);
      const img = new Image();
      img.onload = () => setWmImg(img);
      img.src = src;
    };
    reader.readAsDataURL(selected);
  }, []);

  const { getRootProps: getWmRootProps, getInputProps: getWmInputProps, isDragActive: isDragWm } = useDropzone({
    onDrop: onDropWm,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxFiles: 1,
    multiple: false,
  });

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  const handleDrag = (_e: DraggableEvent, data: DraggableData) => {
    if (!wrapperRef.current) return;
    const { clientWidth, clientHeight } = wrapperRef.current;
    const xPct = (data.x / clientWidth) * 100;
    const yPct = (data.y / clientHeight) * 100;
    setWmPosPercent({ x: xPct, y: yPct });
  };

  const processPdf = async () => {
    if (!file) return;
    if (mode === 'text' && !text.trim()) return;
    if (mode === 'image' && !wmFile) return;

    setStatus('processing');
    setError('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      if (mode === 'text') {
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const { r, g, b } = hexToRgb(color);

        pages.forEach((page) => {
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(text, fontSize);
          const textHeight = font.heightAtSize(fontSize);
          
          if (textPreset === 'center') {
            page.drawText(text, {
              x: width / 2 - textWidth / 2,
              y: height / 2 - textHeight / 2,
              size: fontSize, font, color: rgb(r, g, b), opacity,
            });
          } else if (textPreset === 'bottom') {
            page.drawText(text, {
              x: width - textWidth - (width * 0.05),
              y: height * 0.05,
              size: fontSize, font, color: rgb(r, g, b), opacity,
            });
          } else if (textPreset === 'cross-single') {
            // One diagonal text centered on the page
            const angleRadians = (rotation * Math.PI) / 180;
            const xOffset = -(textWidth / 2) * Math.cos(angleRadians) + (fontSize / 2) * Math.sin(angleRadians);
            const yOffset = -(textWidth / 2) * Math.sin(angleRadians) - (fontSize / 2) * Math.cos(angleRadians);
            page.drawText(text, {
              x: width / 2 + xOffset,
              y: height / 2 + yOffset,
              size: fontSize, font, color: rgb(r, g, b), opacity, rotate: degrees(rotation),
            });
          } else if (textPreset === 'cross-repeat') {
            // Tiled diagonal pattern across the whole page
            const stepX = Math.max(textWidth * 1.5, fontSize * 2);
            const stepY = fontSize * 3;
            for (let x = -width; x <= width * 2; x += stepX) {
              for (let y = -height; y <= height * 2; y += stepY) {
                page.drawText(text, {
                  x, y, size: fontSize, font, color: rgb(r, g, b), opacity, rotate: degrees(rotation),
                });
              }
            }
          }
        });

      } else if (mode === 'image' && wmFile && wmImg) {
        const imgArrayBuffer = await wmFile.arrayBuffer();
        let pdfImage;
        if (wmFile.type === 'image/png') {
          pdfImage = await pdfDoc.embedPng(imgArrayBuffer);
        } else {
          pdfImage = await pdfDoc.embedJpg(imgArrayBuffer);
        }

        pages.forEach((page) => {
          const { width, height } = page.getSize();
          const wmWidth = width * wmScale;
          const aspect = wmImg.naturalHeight / wmImg.naturalWidth;
          const wmHeight = wmWidth * aspect;
          
          const px = (wmPosPercent.x / 100) * width;
          const py = height - wmHeight - ((wmPosPercent.y / 100) * height);
          
          page.drawImage(pdfImage, {
            x: px,
            y: py,
            width: wmWidth,
            height: wmHeight,
            opacity: wmOpacity,
          });
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      const baseName = file.name.replace(/\.pdf$/i, '');
      saveAs(blob, `${baseName}-watermarked.pdf`);

      setStatus('done');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to process PDF.');
      setStatus('error');
    }
  };

  const isBusy = status === 'loading' || status === 'rendering' || status === 'processing';
  const pxX = wrapperRef.current ? (wmPosPercent.x / 100) * wrapperRef.current.clientWidth : 0;
  const pxY = wrapperRef.current ? (wmPosPercent.y / 100) * wrapperRef.current.clientHeight : 0;

  // Visual text overlay preview
  const renderTextPreview = () => {
    if (mode !== 'text') return null;

    const commonStyle: CSSProperties = {
      color: color, opacity: opacity, fontSize: `${fontSize}px`,
      fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 'bold',
      whiteSpace: 'nowrap', pointerEvents: 'none', userSelect: 'none',
    };

    if (textPreset === 'center') {
      return (
        <div style={{ ...commonStyle, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          {text}
        </div>
      );
    } else if (textPreset === 'bottom') {
      return (
        <div style={{ ...commonStyle, position: 'absolute', bottom: '5%', right: '5%' }}>
          {text}
        </div>
      );
    } else if (textPreset === 'cross-single') {
      return (
        <div style={{ ...commonStyle, position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}>
          {text}
        </div>
      );
    } else if (textPreset === 'cross-repeat') {
      // Simulate a 3x3 tiled grid rotated
      const tiles = [];
      const positions = [
        { top: '15%', left: '15%' }, { top: '15%', left: '50%' }, { top: '15%', left: '85%' },
        { top: '50%', left: '15%' }, { top: '50%', left: '50%' }, { top: '50%', left: '85%' },
        { top: '85%', left: '15%' }, { top: '85%', left: '50%' }, { top: '85%', left: '85%' },
      ];
      positions.forEach((pos, i) => {
        tiles.push(
          <div key={i} style={{
            ...commonStyle, position: 'absolute',
            top: pos.top, left: pos.left,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          }}>
            {text}
          </div>
        );
      });
      return <>{tiles}</>;
    }
    return null;
  };

  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>Watermark PDF</h1>
        <p style={s.toolDesc}>
          Stamp a custom text or logo watermark across every page of your PDF document. Processed 100% locally in your browser.
        </p>
      </div>

      {!file && (
        <div
          {...getBaseRootProps()}
          style={{
            ...s.dropzone,
            ...(isDragBase && !isDragBaseReject ? s.dropzoneActive : {}),
            ...(isDragBaseReject ? s.dropzoneReject : {}),
            ...(isBusy ? s.dropzoneLocked : {}),
          }}
        >
          <input {...getBaseInputProps()} />
          <div style={s.dropContent}>
            <div style={{ ...s.dropIcon, ...(isDragBase ? s.dropIconActive : {}) }}>
              <Upload size={26} color={isDragBaseReject ? 'var(--error)' : 'var(--accent)'} />
            </div>
            <p style={s.dropTitle}>
              {isDragBaseReject ? 'Only PDF files are supported' : isDragBase ? 'Release to upload!' : 'Drop a PDF here'}
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

      {file && status !== 'loading' && status !== 'rendering' && previewDataUrl && (
        <div style={s.editorBox}>
          
          <div style={s.fileHeader}>
            <div style={s.fileInfo}>
              <div style={s.fileIcon}><Fingerprint size={20} color="var(--accent)" /></div>
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

          <div style={{
            display: isDesktop ? 'grid' : 'flex',
            gridTemplateColumns: isDesktop ? '260px 1fr' : undefined,
            flexDirection: isDesktop ? undefined : 'column' as const,
            minHeight: isDesktop ? 500 : undefined,
          }}>
            
            {/* SIDEBAR CONTROLS */}
            <div style={{
              ...s.controlsSidebar,
              borderRight: isDesktop ? '1px solid var(--border)' : 'none',
              borderBottom: !isDesktop ? '1px solid var(--border)' : 'none',
            }}>
              <WatermarkControls 
                mode={mode} setMode={setMode}
                text={text} setText={setText}
                textPreset={textPreset} setTextPreset={setTextPreset}
                textSize={fontSize} setTextSize={setFontSize}
                textOpacity={opacity} setTextOpacity={setOpacity}
                textColor={color} setTextColor={setColor}
                textRotation={rotation} setTextRotation={setRotation}
                wmFile={wmFile} wmScale={wmScale} setWmScale={setWmScale}
                wmOpacity={wmOpacity} setWmOpacity={setWmOpacity}
                getWmRootProps={getWmRootProps} getWmInputProps={getWmInputProps} isDragWm={isDragWm}
              />
            </div>

            {/* PREVIEW AREA */}
            <div style={s.previewContainer}>
              <div style={s.previewWrapper} ref={wrapperRef}>
                <img src={previewDataUrl} alt="PDF Preview" style={s.previewCanvas} />
                
                {renderTextPreview()}

                {mode === 'image' && wmImg && wrapperRef.current && (
                  <Draggable
                    nodeRef={dragRef}
                    bounds="parent"
                    position={{ x: pxX, y: pxY }}
                    onDrag={handleDrag}
                  >
                    <div ref={dragRef} style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      cursor: 'move',
                      width: `${wmScale * 100}%`,
                      opacity: wmOpacity,
                      border: '1px dashed rgba(0,0,0,0.4)',
                    }}>
                      <img src={wmImgSrc} style={{ width: '100%', display: 'block', pointerEvents: 'none' }} alt="Watermark Overlay" />
                    </div>
                  </Draggable>
                )}
                
                {mode === 'image' && wmImg && (
                  <div style={s.hint}>Drag logo to position it</div>
                )}
              </div>
            </div>

          </div>

          <div style={s.actions}>
            {status === 'done' ? (
              <span style={s.successText}>
                <CheckCircle2 size={16} /> All {totalPages} pages watermarked!
              </span>
            ) : (
              <span style={s.selectionInfo}>
                Watermark will be applied to all pages.
              </span>
            )}
            <button style={s.btnPrimary} onClick={processPdf} disabled={isBusy || (mode === 'text' && !text.trim()) || (mode === 'image' && !wmFile)}>
              {isBusy ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={15} />}
              {isBusy ? 'Processing...' : `Apply & Download`}
            </button>
          </div>
        </div>
      )}

      {(status === 'loading' || status === 'rendering') && (
        <div style={s.loadingState}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
          <span>{status === 'loading' ? 'Loading PDF...' : 'Rendering Preview...'}</span>
        </div>
      )}

      <OtherTools currentToolId="watermark-pdf" />
    </main>
  );
}

const s: Record<string, CSSProperties> = {
  main: {
    flex: 1, maxWidth: 1000, width: '100%', margin: '0 auto',
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
    padding: '60px 0', gap: 12, color: 'var(--text-muted)', fontSize: 14,
    background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)'
  },

  editorBox: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', overflow: 'hidden',
    boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column',
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
  

  controlsSidebar: {
    padding: 20, display: 'flex', flexDirection: 'column', gap: 20,
    background: 'var(--bg-surface)',
  },
  tabs: {
    display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 10,
  },
  tabBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
    background: 'transparent', color: 'var(--text-muted)', border: 'none',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', borderBottom: '2px solid transparent',
    marginBottom: -11, transition: 'all 150ms ease',
  },
  tabBtnActive: {
    color: 'var(--accent)', borderBottom: '2px solid var(--accent)',
  },
  settings: {
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  settingsGrid: {
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  controlGroup: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  controlGroupRow: { display: 'flex', gap: 16 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' },
  input: {
    padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: 14, outline: 'none',
  },
  colorWrap: { display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' },
  colorInput: { width: 28, height: 28, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'transparent' },
  colorValue: { fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace' },
  
  miniDropzone: {
    border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px',
    textAlign: 'center', cursor: 'pointer', background: 'var(--bg-card)', transition: 'all 150ms ease',
  },
  miniDropzoneActive: { border: '1px dashed var(--accent)', background: 'var(--accent-subtle)' },
  miniDropText: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 },

  previewContainer: {
    width: '100%', background: 'var(--bg-body)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'hidden'
  },
  previewWrapper: {
    position: 'relative', display: 'inline-block', maxWidth: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: '1px solid var(--border)', backgroundColor: '#fff',
  },
  previewCanvas: {
    maxHeight: '600px', maxWidth: '100%', display: 'block',
  },
  hint: {
    position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--accent)', color: '#fff', padding: '4px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none',
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
