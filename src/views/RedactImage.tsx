"use client";
import { useState, useRef, useCallback, useEffect } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import {
  Upload,
  Download,
  Trash2,
  Undo2,
  Shield,
  Droplets,
  Grid,
  Square,
  CheckCircle2,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import '../App.css';

type RedactMode = 'blur' | 'pixelate' | 'blackout';

interface Redaction {
  x: number;
  y: number;
  w: number;
  h: number;
  mode: RedactMode;
}

export default function RedactImage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<RedactMode>('blur');
  const [redactions, setRedactions] = useState<Redaction[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const clearAll = useCallback(() => {
    setImage(null);
    setRedactions([]);
    setIsDrawing(false);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setRedactions([]);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: false,
  });

  const getCanvasCoordinates = (e: ReactMouseEvent | ReactTouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // Scale factor between actual DOM pixel size and canvas intrinsic size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as ReactMouseEvent | MouseEvent).clientX;
      clientY = (e as ReactMouseEvent | MouseEvent).clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handlePointerDown = (e: ReactMouseEvent | ReactTouchEvent) => {
    if (!image) return;
    // Prevent default scrolling on touch devices while drawing
    if ('touches' in e && e.cancelable) e.preventDefault();
    
    const pos = getCanvasCoordinates(e);
    setStartPos(pos);
    setCurrentPos(pos);
    setIsDrawing(true);
  };

  const handlePointerMove = (e: ReactMouseEvent | ReactTouchEvent) => {
    if (!isDrawing) return;
    if ('touches' in e && e.cancelable) e.preventDefault();

    setCurrentPos(getCanvasCoordinates(e));
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const w = currentPos.x - startPos.x;
    const h = currentPos.y - startPos.y;

    // Only add if it's large enough (prevent accidental clicks from creating micro redactions)
    if (Math.abs(w) > 5 && Math.abs(h) > 5) {
      // Normalize coordinates so w and h are positive
      const x = w < 0 ? startPos.x + w : startPos.x;
      const y = h < 0 ? startPos.y + h : startPos.y;

      setRedactions(prev => [...prev, {
        x,
        y,
        w: Math.abs(w),
        h: Math.abs(h),
        mode
      }]);
    }
  };

  const undo = useCallback(() => {
    setRedactions(prev => prev.slice(0, -1));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo]);

  // Main Drawing Function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas dimensions to match image
    if (canvas.width !== image.width) canvas.width = image.width;
    if (canvas.height !== image.height) canvas.height = image.height;

    // Clear and draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    // Apply finalized redactions
    redactions.forEach((r) => {
      applyRedaction(ctx, image, r);
    });

    // Draw active drag outline
    if (isDrawing) {
      const w = currentPos.x - startPos.x;
      const h = currentPos.y - startPos.y;
      
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // Red semi-transparent fill
      ctx.fillRect(startPos.x, startPos.y, w, h);
      
      ctx.strokeStyle = '#ef4444'; // Red border
      ctx.lineWidth = 2 * (canvas.width / 800); // Scale line width based on image size
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(startPos.x, startPos.y, w, h);
      ctx.restore();
    }
  }, [image, redactions, isDrawing, startPos, currentPos]);

  const applyRedaction = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, r: Redaction) => {
    ctx.save();

    // Prevent redaction from going out of canvas bounds
    const rx = Math.max(0, r.x);
    const ry = Math.max(0, r.y);
    const rw = Math.min(r.w, img.width - rx);
    const rh = Math.min(r.h, img.height - ry);

    if (rw <= 0 || rh <= 0) {
      ctx.restore();
      return;
    }

    if (r.mode === 'blackout') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(rx, ry, rw, rh);
    } 
    else if (r.mode === 'blur') {
      ctx.filter = `blur(${Math.max(10, Math.min(rw, rh) / 10)}px)`; // Dynamic blur based on rect size
      ctx.drawImage(img, rx, ry, rw, rh, rx, ry, rw, rh);
    } 
    else if (r.mode === 'pixelate') {
      // 1. Get image data for the region
      const offCanvas = document.createElement('canvas');
      offCanvas.width = rw;
      offCanvas.height = rh;
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        offCtx.drawImage(img, rx, ry, rw, rh, 0, 0, rw, rh);
        
        // 2. Scale down drastically
        const scaleFactor = 0.05; // 5% size
        const smallW = Math.max(1, rw * scaleFactor);
        const smallH = Math.max(1, rh * scaleFactor);
        
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = smallW;
        smallCanvas.height = smallH;
        const smallCtx = smallCanvas.getContext('2d');
        if (smallCtx) {
          smallCtx.drawImage(offCanvas, 0, 0, rw, rh, 0, 0, smallW, smallH);
          
          // 3. Scale back up with no smoothing
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(smallCanvas, 0, 0, smallW, smallH, rx, ry, rw, rh);
          ctx.imageSmoothingEnabled = true; // reset
        }
      }
    }

    ctx.restore();
  };

  const handleDownload = () => {
    if (!canvasRef.current || !image) return;
    
    // We export as high quality JPEG or PNG depending on original format if possible, default to JPEG
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `redacted-image.jpg`);
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>Blur & Redact Image</h1>
        <p style={s.toolDesc}>
          Securely hide sensitive information from your images. All processing is done <strong>100% locally</strong> in your browser, ensuring total privacy.
        </p>
      </div>

      {!image && (
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
            <div style={{ ...s.dropIcon, ...(isDragActive ? s.dropIconActive : {}) }}>
              <Upload size={26} color={isDragReject ? 'var(--error)' : 'var(--accent)'} />
            </div>
            <p style={s.dropTitle}>
              {isDragReject
                ? 'Only images (JPG, PNG, WebP) are supported'
                : isDragActive
                  ? 'Release to upload!'
                  : 'Drop an image here, or click to browse'}
            </p>
          </div>
        </div>
      )}

      {image && (
        <div style={s.editorBox}>
          
          <div style={s.toolbar}>
            <div style={s.toolbarGroup}>
              <span style={s.toolLabel}>Mode:</span>
              <button 
                style={{...s.modeBtn, ...(mode === 'blur' ? s.modeBtnActive : {})}} 
                onClick={() => setMode('blur')}
                title="Gaussian Blur"
              >
                <Droplets size={16} /> Blur
              </button>
              <button 
                style={{...s.modeBtn, ...(mode === 'pixelate' ? s.modeBtnActive : {})}} 
                onClick={() => setMode('pixelate')}
                title="Pixelate / Mosaic"
              >
                <Grid size={16} /> Pixelate
              </button>
              <button 
                style={{...s.modeBtn, ...(mode === 'blackout' ? s.modeBtnActive : {})}} 
                onClick={() => setMode('blackout')}
                title="Solid Blackout"
              >
                <Square size={16} fill="currentColor" /> Blackout
              </button>
            </div>

            <div style={s.toolbarGroup}>
              <button style={s.btnGhost} onClick={undo} disabled={redactions.length === 0}>
                <Undo2 size={16} /> Undo
              </button>
              <button style={s.btnGhostDanger} onClick={clearAll}>
                <Trash2 size={16} /> Clear
              </button>
            </div>
          </div>

          <div style={s.canvasWrapper} ref={containerRef}>
            {/* The actual drawable area */}
            <canvas
              ref={canvasRef}
              style={s.canvas}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            />
            {redactions.length === 0 && !isDrawing && (
              <div style={s.canvasHint}>
                <span>Click and drag over the image to redact.</span>
              </div>
            )}
          </div>

          <div style={s.actions}>
            <span style={s.statsText}>
              <Shield size={14} /> {redactions.length} redaction{redactions.length !== 1 ? 's' : ''} applied
            </span>
            <button style={s.btnPrimary} onClick={handleDownload}>
              <Download size={15} /> Download Securely
            </button>
          </div>
        </div>
      )}

      <OtherTools currentToolId="redact" />
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
  dropContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' },
  dropIcon: {
    width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-subtle)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, transition: 'all 250ms ease',
  },
  dropIconActive: { background: 'var(--accent-glow)', border: '1px solid var(--accent)', transform: 'scale(1.1)' },
  dropTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },

  editorBox: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', overflow: 'hidden',
    boxShadow: 'var(--shadow-card)',
  },
  
  toolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
    padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', gap: 12,
  },
  toolbarGroup: { display: 'flex', alignItems: 'center', gap: 8 },
  toolLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginRight: 4 },
  
  modeBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
    background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms ease',
  },
  modeBtnActive: {
    background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)',
  },
  
  btnGhost: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
    background: 'transparent', color: 'var(--text)', border: '1px solid transparent',
    borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 150ms ease',
  },
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
    background: 'rgba(239,68,68,0.06)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
  },

  canvasWrapper: {
    width: '100%',
    background: '#1a1c23', // Dark checkerboard-like neutral
    backgroundImage: 'linear-gradient(45deg, #22252e 25%, transparent 25%), linear-gradient(-45deg, #22252e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #22252e 75%), linear-gradient(-45deg, transparent 75%, #22252e 75%)',
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 300,
    maxHeight: '60vh',
    overflow: 'hidden',
  },
  canvas: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    cursor: 'crosshair',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    touchAction: 'none', // Prevent browser scrolling while drawing
  },
  canvasHint: {
    position: 'absolute', bottom: 16,
    background: 'rgba(0,0,0,0.7)', color: '#fff',
    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    pointerEvents: 'none',
  },

  actions: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
  },
  statsText: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease',
  },
};
