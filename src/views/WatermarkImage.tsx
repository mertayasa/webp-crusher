"use client";
import { useState, useCallback, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import Draggable, { type DraggableEvent, type DraggableData } from 'react-draggable';
import {
  Upload,
  Download,
  Trash2,
  Loader2,
  XCircle,
  Stamp,
} from 'lucide-react';
import { 
  processWatermarkAndExport, 
  drawWatermarkToContext,
  type TextPreset,
  type TextWatermarkConfig,
  type ImageWatermarkConfig
} from '../utils/watermarkImage';
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

export default function WatermarkImage() {
  const [file, setFile] = useState<File | null>(null);
  const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<'text' | 'image'>('text');

  // Text Config
  const [textStr, setTextStr] = useState<string>('CONFIDENTIAL');
  const [textSize, setTextSize] = useState<number>(30);
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [textOpacity, setTextOpacity] = useState<number>(0.5);
  const [textRotation, setTextRotation] = useState<number>(-45);
  const [textPreset, setTextPreset] = useState<TextPreset>('cross-repeat');

  // Image Config
  const [wmFile, setWmFile] = useState<File | null>(null);
  const [wmImg, setWmImg] = useState<HTMLImageElement | null>(null);
  const [wmImgSrc, setWmImgSrc] = useState<string>('');
  const [wmScale, setWmScale] = useState<number>(0.3);
  const [wmOpacity, setWmOpacity] = useState<number>(0.8);
  const [wmPosPercent, setWmPosPercent] = useState<{x: number, y: number}>({x: 10, y: 10});

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const windowWidth = useWindowWidth();
  const isDesktop = windowWidth >= 768;

  // Load Base Image
  const onDropBase = useCallback((accepted: File[]) => {
    if (!accepted.length) return;
    setError(null);
    const selected = accepted[0];
    setFile(selected);

    const img = new Image();
    const url = URL.createObjectURL(selected);
    img.onload = () => { URL.revokeObjectURL(url); setBaseImg(img); };
    img.onerror = () => { URL.revokeObjectURL(url); setError('Failed to load base image'); };
    img.src = url;
  }, []);

  const { getRootProps: getBaseRootProps, getInputProps: getBaseInputProps, isDragActive: isDragBase } = useDropzone({
    onDrop: onDropBase,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'], 'image/avif': ['.avif'] },
    maxFiles: 1, multiple: false,
  });

  // Load Watermark Image
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
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] },
    maxFiles: 1, multiple: false,
  });

  // Render Preview Canvas
  useEffect(() => {
    if (!baseImg || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = baseImg.naturalWidth;
    canvasRef.current.height = baseImg.naturalHeight;

    const tConfig: TextWatermarkConfig | undefined = mode === 'text' ? {
      text: textStr, size: textSize, color: textColor, opacity: textOpacity,
      preset: textPreset, rotation: textRotation,
    } : undefined;

    drawWatermarkToContext(ctx, baseImg, canvasRef.current.width, canvasRef.current.height,
      file?.type === 'image/jpeg', 'text', tConfig, undefined);
  }, [baseImg, mode, textStr, textSize, textColor, textOpacity, textPreset, textRotation, file]);

  const handleDrag = (_e: DraggableEvent, data: DraggableData) => {
    if (!wrapperRef.current) return;
    const { clientWidth, clientHeight } = wrapperRef.current;
    setWmPosPercent({ x: (data.x / clientWidth) * 100, y: (data.y / clientHeight) * 100 });
  };

  const handleDownload = async () => {
    if (!file || !baseImg) return;
    setProcessing(true);
    setError(null);
    try {
      let tConfig: TextWatermarkConfig | undefined;
      let iConfig: ImageWatermarkConfig | undefined;

      if (mode === 'text') {
        tConfig = { text: textStr, size: textSize, color: textColor, opacity: textOpacity, preset: textPreset, rotation: textRotation };
      } else if (mode === 'image' && wmImg) {
        iConfig = { imgRef: wmImg, x: wmPosPercent.x, y: wmPosPercent.y, scale: wmScale, opacity: wmOpacity };
      }

      const blob = await processWatermarkAndExport(file, baseImg, mode, tConfig, iConfig);
      const lastDot = file.name.lastIndexOf('.');
      const base = lastDot !== -1 ? file.name.slice(0, lastDot) : file.name;
      const ext = lastDot !== -1 ? file.name.slice(lastDot) : '.jpg';
      saveAs(blob, `${base}-watermarked${ext}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const clearAll = () => {
    setFile(null); setBaseImg(null); setWmFile(null);
    setWmImg(null); setWmImgSrc(''); setError(null);
  };

  const pxX = wrapperRef.current ? (wmPosPercent.x / 100) * wrapperRef.current.clientWidth : 0;
  const pxY = wrapperRef.current ? (wmPosPercent.y / 100) * wrapperRef.current.clientHeight : 0;

  return (
    <>
      <main style={s.main}>
        <BackButton />
        
        <div style={s.toolHero}>
          <h1 style={s.toolTitle}>Watermark Image</h1>
          <p style={s.toolDesc}>
            Protect your content with custom text or logo overlays. <strong>100% private</strong> — all processing happens directly in your browser.
          </p>
        </div>

        {!file && (
          <div {...getBaseRootProps()} style={{ ...s.dropzone, ...(isDragBase ? s.dropzoneActive : {}) }}>
            <input {...getBaseInputProps()} />
            <div style={s.dropContent}>
              <div style={s.dropIcon}><Upload size={26} color="var(--accent)" /></div>
              <p style={s.dropTitle}>Drop your base image here</p>
              <p style={s.dropSub}>Accepts JPG, PNG, WebP, AVIF</p>
            </div>
          </div>
        )}

        {error && (
          <div style={s.errorNotice}>
            <XCircle size={16} />
            {error}
          </div>
        )}

        {file && baseImg && (
          <div style={s.editorBox}>

            {/* File Header */}
            <div style={s.fileHeader}>
              <div style={s.fileInfo}>
                <div style={s.fileIconWrap}><Stamp size={20} color="var(--accent)" /></div>
                <div style={s.fileDetails}>
                  <span style={s.fileName} title={file.name}>{file.name}</span>
                  <span style={s.fileMeta}>{formatBytes(file.size)}</span>
                </div>
              </div>
              <button style={s.btnGhostDanger} onClick={clearAll} disabled={processing}>
                Change File
              </button>
            </div>

            {/* Responsive workspace: sidebar on desktop, stacked on mobile */}
            <div style={{
              display: isDesktop ? 'grid' : 'flex',
              gridTemplateColumns: isDesktop ? '260px 1fr' : undefined,
              flexDirection: isDesktop ? undefined : 'column' as const,
              minHeight: isDesktop ? 500 : undefined,
            }}>

              {/* Controls (sidebar on desktop, top on mobile) */}
              <div style={{
                ...s.controlsSidebar,
                borderRight: isDesktop ? '1px solid var(--border)' : 'none',
                borderBottom: !isDesktop ? '1px solid var(--border)' : 'none',
              }}>
                <WatermarkControls 
                  mode={mode} setMode={setMode}
                  text={textStr} setText={setTextStr}
                  textPreset={textPreset} setTextPreset={setTextPreset}
                  textSize={textSize} setTextSize={setTextSize}
                  textOpacity={textOpacity} setTextOpacity={setTextOpacity}
                  textColor={textColor} setTextColor={setTextColor}
                  textRotation={textRotation} setTextRotation={setTextRotation}
                  wmFile={wmFile} wmScale={wmScale} setWmScale={setWmScale}
                  wmOpacity={wmOpacity} setWmOpacity={setWmOpacity}
                  getWmRootProps={getWmRootProps} getWmInputProps={getWmInputProps} isDragWm={isDragWm}
                />
              </div>

              {/* Preview area */}
              <div style={s.previewContainer}>
                <div style={s.previewWrapper} ref={wrapperRef}>
                  <canvas ref={canvasRef} style={s.previewCanvas} />
                  
                  {mode === 'image' && wmImg && wrapperRef.current && (
                    <Draggable
                      nodeRef={dragRef}
                      bounds="parent"
                      position={{ x: pxX, y: pxY }}
                      onDrag={handleDrag}
                    >
                      <div ref={dragRef} style={{
                        position: 'absolute', top: 0, left: 0, cursor: 'move',
                        width: `${wmScale * 100}%`, opacity: wmOpacity,
                        border: '1px dashed rgba(255,255,255,0.4)',
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

            <div style={s.actionsRow}>
              <button style={s.btnGhostDanger} onClick={clearAll}>
                <Trash2 size={14} /> Clear All
              </button>
              <button 
                style={s.btnPrimary} 
                onClick={handleDownload}
                disabled={processing || (mode === 'image' && !wmImg)}
              >
                {processing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
                Download Protected Image
              </button>
            </div>
          </div>
        )}

        <OtherTools currentToolId="watermark" />
      </main>
    </>
  );
}

const s: Record<string, CSSProperties> = {
  main: {
    flex: 1, maxWidth: 1000, width: '100%', margin: '0 auto',
    padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16,
  },
  toolHero: { marginBottom: 8 },
  toolTitle: { fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.5px' },
  toolDesc: { fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.5 },
  dropzone: {
    border: '2px dashed var(--border)', borderRadius: 'var(--radius-xl)',
    padding: '60px 24px', textAlign: 'center', cursor: 'pointer',
    background: 'var(--bg-surface)', outline: 'none', userSelect: 'none',
    transition: 'all 250ms ease',
  },
  dropzoneActive: {
    border: '2px dashed var(--accent)', background: 'var(--accent-subtle)', boxShadow: 'var(--shadow-glow)',
  },
  dropContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' },
  dropIcon: {
    width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-subtle)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  dropTitle: { fontSize: 16, fontWeight: 600, color: 'var(--text)' },
  dropSub: { fontSize: 13, color: 'var(--text-muted)' },
  errorNotice: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--error-subtle)',
    border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)', color: 'var(--error)', fontSize: 13, fontWeight: 500,
  },

  editorBox: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', overflow: 'hidden',
    boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column',
  },
  fileHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)',
  },
  fileInfo: { display: 'flex', alignItems: 'center', gap: 14 },
  fileIconWrap: {
    width: 40, height: 40, borderRadius: 8, background: 'var(--accent-subtle)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  fileDetails: { display: 'flex', flexDirection: 'column', gap: 2 },
  fileName: { fontSize: 15, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 },
  fileMeta: { fontSize: 13, color: 'var(--text-muted)' },

  controlsSidebar: {
    padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
    background: 'var(--bg-surface)',
  },

  previewContainer: {
    background: 'var(--bg-body)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 20, overflow: 'hidden',
  },
  previewWrapper: {
    position: 'relative', display: 'inline-block', maxWidth: '100%',
  },
  previewCanvas: {
    maxHeight: '60vh', maxWidth: '100%', display: 'block', boxShadow: 'var(--shadow-card)',
  },
  hint: {
    position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--accent)', color: '#fff', padding: '4px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none',
  },
  actionsRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 150ms ease',
  },
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'rgba(239,68,68,0.06)', color: 'var(--error)',
    border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
};
