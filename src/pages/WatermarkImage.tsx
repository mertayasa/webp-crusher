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
  Type,
  Image as ImageIcon
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
import '../App.css';

export default function WatermarkImage() {
  const [file, setFile] = useState<File | null>(null);
  const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<'text' | 'image'>('text');

  // Text Config
  const [textStr, setTextStr] = useState<string>('CONFIDENTIAL');
  const [textSize, setTextSize] = useState<number>(30); // 10 to 100
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [textOpacity, setTextOpacity] = useState<number>(0.5); // 0 to 1
  const [textPreset, setTextPreset] = useState<TextPreset>('cross');

  // Image Config
  const [wmFile, setWmFile] = useState<File | null>(null);
  const [wmImg, setWmImg] = useState<HTMLImageElement | null>(null);
  const [wmImgSrc, setWmImgSrc] = useState<string>('');
  const [wmScale, setWmScale] = useState<number>(0.3); // 0.05 to 1.0
  const [wmOpacity, setWmOpacity] = useState<number>(0.8);
  const [wmPosPercent, setWmPosPercent] = useState<{x: number, y: number}>({x: 10, y: 10});

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // Load Base Image
  const onDropBase = useCallback((accepted: File[]) => {
    if (!accepted.length) return;
    setError(null);
    const selected = accepted[0];
    setFile(selected);

    const img = new Image();
    const url = URL.createObjectURL(selected);
    img.onload = () => {
      URL.revokeObjectURL(url);
      setBaseImg(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError('Failed to load base image');
    };
    img.src = url;
  }, []);

  const { getRootProps: getBaseRootProps, getInputProps: getBaseInputProps, isDragActive: isDragBase } = useDropzone({
    onDrop: onDropBase,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/avif': ['.avif'],
    },
    maxFiles: 1,
    multiple: false,
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
    maxFiles: 1,
    multiple: false,
  });

  // Render Preview Canvas (Only base + text. Image WM floats on top)
  useEffect(() => {
    if (!baseImg || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // We set internal resolution to a smaller size for fast previewing if needed, 
    // but drawing full res is usually fast enough for single images.
    canvasRef.current.width = baseImg.naturalWidth;
    canvasRef.current.height = baseImg.naturalHeight;

    const tConfig: TextWatermarkConfig | undefined = mode === 'text' ? {
      text: textStr,
      size: textSize,
      color: textColor,
      opacity: textOpacity,
      preset: textPreset
    } : undefined;

    drawWatermarkToContext(
      ctx,
      baseImg,
      canvasRef.current.width,
      canvasRef.current.height,
      file?.type === 'image/jpeg',
      'text', // We only draw text to the preview canvas
      tConfig,
      undefined
    );

  }, [baseImg, mode, textStr, textSize, textColor, textOpacity, textPreset, file]);

  const handleDrag = (_e: DraggableEvent, data: DraggableData) => {
    if (!wrapperRef.current) return;
    const { clientWidth, clientHeight } = wrapperRef.current;
    
    // Calculate new percentage based on the display dimensions
    const xPct = (data.x / clientWidth) * 100;
    const yPct = (data.y / clientHeight) * 100;
    setWmPosPercent({ x: xPct, y: yPct });
  };

  const handleDownload = async () => {
    if (!file || !baseImg) return;
    setProcessing(true);
    setError(null);
    try {
      let tConfig: TextWatermarkConfig | undefined;
      let iConfig: ImageWatermarkConfig | undefined;

      if (mode === 'text') {
        tConfig = { text: textStr, size: textSize, color: textColor, opacity: textOpacity, preset: textPreset };
      } else if (mode === 'image' && wmImg) {
        iConfig = { imgRef: wmImg, x: wmPosPercent.x, y: wmPosPercent.y, scale: wmScale, opacity: wmOpacity };
      }

      const blob = await processWatermarkAndExport(file, baseImg, mode, tConfig, iConfig);
      
      const lastDot = file.name.lastIndexOf('.');
      const base = lastDot !== -1 ? file.name.slice(0, lastDot) : file.name;
      const ext = lastDot !== -1 ? file.name.slice(lastDot) : '.jpg';
      const outputName = `${base}-watermarked${ext}`;
      
      saveAs(blob, outputName);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setBaseImg(null);
    setWmFile(null);
    setWmImg(null);
    setWmImgSrc('');
    setError(null);
  };

  // Draggable bounds
  const pxX = wrapperRef.current ? (wmPosPercent.x / 100) * wrapperRef.current.clientWidth : 0;
  const pxY = wrapperRef.current ? (wmPosPercent.y / 100) * wrapperRef.current.clientHeight : 0;

  return (
    <>
      <main style={s.main}>
        <BackButton />
        
        <div style={s.toolHero}>
          <h1 style={s.toolTitle}>Watermark Image</h1>
          <p style={s.toolDesc}>
            Protect your content with custom text or logo overlays. <strong>100% private</strong> — all processing happens directly in your browser, and your files never leave your device.
          </p>
        </div>

        {!file && (
          <div
            {...getBaseRootProps()}
            style={{
              ...s.dropzone,
              ...(isDragBase ? s.dropzoneActive : {}),
            }}
          >
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
          <div style={s.workspace}>
            
            {/* Control Panel */}
            <div style={s.controlPanel}>
              <div style={s.tabs}>
                <button 
                  style={{...s.tabBtn, ...(mode === 'text' ? s.tabBtnActive : {})}}
                  onClick={() => setMode('text')}
                >
                  <Type size={14} /> Text Watermark
                </button>
                <button 
                  style={{...s.tabBtn, ...(mode === 'image' ? s.tabBtnActive : {})}}
                  onClick={() => setMode('image')}
                >
                  <ImageIcon size={14} /> Image Watermark
                </button>
              </div>

              <div style={s.settings}>
                {mode === 'text' && (
                  <div style={s.settingsGrid}>
                    <div style={s.controlGroup}>
                      <span style={s.label}>Text</span>
                      <input type="text" value={textStr} onChange={e => setTextStr(e.target.value)} style={s.input} />
                    </div>
                    
                    <div style={s.controlGroup}>
                      <span style={s.label}>Preset</span>
                      <select value={textPreset} onChange={e => setTextPreset(e.target.value as TextPreset)} style={s.input}>
                        <option value="cross">Cross Pattern (Secure)</option>
                        <option value="center">Big Center</option>
                        <option value="bottom">Low Bottom</option>
                      </select>
                    </div>

                    <div style={s.controlGroupRow}>
                      <div style={s.controlGroup}>
                        <span style={s.label}>Size ({textSize})</span>
                        <input type="range" min="5" max="100" value={textSize} onChange={e => setTextSize(Number(e.target.value))} />
                      </div>
                      <div style={s.controlGroup}>
                        <span style={s.label}>Opacity ({Math.round(textOpacity*100)}%)</span>
                        <input type="range" min="0.1" max="1" step="0.05" value={textOpacity} onChange={e => setTextOpacity(Number(e.target.value))} />
                      </div>
                    </div>

                    <div style={s.controlGroup}>
                      <span style={s.label}>Color</span>
                      <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
                        <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} style={s.colorInput} />
                        <span style={s.colorVal}>{textColor}</span>
                      </div>
                    </div>
                  </div>
                )}

                {mode === 'image' && (
                  <div style={s.settingsGrid}>
                    <div style={s.controlGroup}>
                      <span style={s.label}>Watermark Image (PNG recommended)</span>
                      <div {...getWmRootProps()} style={{...s.miniDropzone, ...(isDragWm ? s.miniDropzoneActive : {})}}>
                        <input {...getWmInputProps()} />
                        {wmFile ? (
                          <span style={s.miniDropText}>{wmFile.name} (Click to change)</span>
                        ) : (
                          <span style={s.miniDropText}>Drag & Drop a logo here</span>
                        )}
                      </div>
                    </div>

                    {wmImg && (
                      <div style={s.controlGroupRow}>
                        <div style={s.controlGroup}>
                          <span style={s.label}>Size ({Math.round(wmScale*100)}%)</span>
                          <input type="range" min="0.05" max="1" step="0.01" value={wmScale} onChange={e => setWmScale(Number(e.target.value))} />
                        </div>
                        <div style={s.controlGroup}>
                          <span style={s.label}>Opacity ({Math.round(wmOpacity*100)}%)</span>
                          <input type="range" min="0.1" max="1" step="0.05" value={wmOpacity} onChange={e => setWmOpacity(Number(e.target.value))} />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Preview Area */}
            <div style={s.previewContainer}>
              <div style={s.previewWrapper} ref={wrapperRef}>
                <canvas ref={canvasRef} style={s.previewCanvas} />
                
                {/* Floating Image Watermark Overlay */}
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
                      border: '1px dashed rgba(255,255,255,0.4)',
                    }}>
                      <img 
                        src={wmImgSrc} 
                        style={{ width: '100%', display: 'block', pointerEvents: 'none' }} 
                        alt="Watermark Overlay" 
                      />
                    </div>
                  </Draggable>
                )}
                
                {mode === 'image' && wmImg && (
                  <div style={s.hint}>Drag logo to position it</div>
                )}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, CSSProperties> = {
  main: {
    flex: 1, maxWidth: 860, width: '100%', margin: '0 auto',
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
  dropSub:   { fontSize: 13, color: 'var(--text-muted)' },
  errorNotice: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: 'var(--error-subtle)',
    border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)', color: 'var(--error)', fontSize: 13, fontWeight: 500,
  },
  workspace: {
    display: 'flex', flexDirection: 'column', gap: 20, background: 'var(--bg-surface)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24,
  },
  controlPanel: {
    display: 'flex', flexDirection: 'column', gap: 16,
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
    background: 'var(--bg)', padding: 16, borderRadius: 'var(--radius)', border: '1px solid var(--border)',
  },
  settingsGrid: {
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  controlGroup: {
    display: 'flex', flexDirection: 'column', gap: 6, flex: 1,
  },
  controlGroupRow: {
    display: 'flex', gap: 20,
  },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' },
  input: {
    padding: '8px 12px', fontSize: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    background: 'var(--bg-surface)', color: 'var(--text)', outline: 'none',
  },
  colorInput: {
    width: 32, height: 32, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'transparent'
  },
  colorVal: { fontSize: 13, fontFamily: 'monospace', color: 'var(--text-muted)' },
  miniDropzone: {
    border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px',
    textAlign: 'center', cursor: 'pointer', background: 'var(--bg-surface)', transition: 'all 150ms ease',
  },
  miniDropzoneActive: { border: '1px dashed var(--accent)', background: 'var(--accent-subtle)' },
  miniDropText: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 },
  previewContainer: {
    width: '100%', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'hidden'
  },
  previewWrapper: {
    position: 'relative', display: 'inline-block', maxWidth: '100%',
  },
  previewCanvas: {
    maxHeight: '50vh', maxWidth: '100%', display: 'block', boxShadow: 'var(--shadow-card)',
  },
  hint: {
    position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--accent)', color: '#fff', padding: '4px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none',
  },
  actionsRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 16, borderTop: '1px solid var(--border)',
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 150ms ease',
  },
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'transparent', color: 'var(--error)',
    border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
};
