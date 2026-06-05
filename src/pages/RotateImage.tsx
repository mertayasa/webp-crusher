import { useState, useCallback, useRef, useEffect } from 'react';
import type { CSSProperties, ChangeEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import {
  Upload,
  Download,
  Trash2,
  Loader2,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  XCircle,
} from 'lucide-react';
import { drawTransformedImage, processRotateAndExport } from '../utils/rotateImage';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import '../App.css';

export default function RotateImage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  
  const [degrees, setDegrees] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load image when file is dropped
  useEffect(() => {
    if (!file) {
      setImageElement(null);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      setImageElement(img);
      // Reset transforms on new image
      setDegrees(0);
      setFlipH(false);
      setFlipV(false);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError('Failed to load image preview');
    };
    img.src = url;
  }, [file]);

  // Render preview canvas whenever image or transforms change
  useEffect(() => {
    if (!imageElement || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    drawTransformedImage(ctx, imageElement, { degrees, flipH, flipV }, file?.type === 'image/jpeg');
  }, [imageElement, degrees, flipH, flipV, file]);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted.length) return;
    setError(null);
    setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/avif': ['.avif'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleDownload = async () => {
    if (!file) return;
    setProcessing(true);
    setError(null);
    try {
      const blob = await processRotateAndExport(file, { degrees, flipH, flipV });
      // Construct new filename
      const lastDot = file.name.lastIndexOf('.');
      const base = lastDot !== -1 ? file.name.slice(0, lastDot) : file.name;
      const ext = lastDot !== -1 ? file.name.slice(lastDot) : '.jpg';
      const outputName = `${base}-rotated${ext}`;
      
      saveAs(blob, outputName);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setImageElement(null);
    setError(null);
  };

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    setDegrees(Number(e.target.value));
  };

  return (
    <>
      <main style={s.main}>
        <BackButton />
        
        <div style={s.toolHero}>
          <h1 style={s.toolTitle}>Rotate Image</h1>
          <p style={s.toolDesc}>
            Rotate, flip, and precisely adjust your images. <strong>100% private</strong> — all processing happens directly in your browser, and your files never leave your device.
          </p>
        </div>

        {!file && (
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
                <Upload size={26} color={isDragReject ? 'var(--error)' : 'var(--accent)'} />
              </div>
              <p style={s.dropTitle}>
                {isDragReject
                  ? 'Only valid images are accepted'
                  : isDragActive
                    ? 'Release to upload!'
                    : 'Drop a single image here'}
              </p>
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

        {file && imageElement && (
          <div style={s.workspace}>
            {/* Preview Area */}
            <div style={s.previewContainer}>
              <canvas ref={canvasRef} style={s.previewCanvas} />
            </div>

            {/* Controls */}
            <div style={s.controlsPanel}>
              
              <div style={s.controlGroup}>
                <span style={s.controlLabel}>Rotate 90°</span>
                <div style={s.buttonRow}>
                  <button style={s.btnControl} onClick={() => setDegrees(prev => prev - 90)} aria-label="Rotate Left">
                    <RotateCcw size={16} /> Left
                  </button>
                  <button style={s.btnControl} onClick={() => setDegrees(prev => prev + 90)} aria-label="Rotate Right">
                    <RotateCw size={16} /> Right
                  </button>
                </div>
              </div>

              <div style={s.controlGroup}>
                <span style={s.controlLabel}>Flip</span>
                <div style={s.buttonRow}>
                  <button 
                    style={{...s.btnControl, ...(flipH ? s.btnControlActive : {})}} 
                    onClick={() => setFlipH(!flipH)}
                  >
                    <FlipHorizontal size={16} /> Horizontal
                  </button>
                  <button 
                    style={{...s.btnControl, ...(flipV ? s.btnControlActive : {})}} 
                    onClick={() => setFlipV(!flipV)}
                  >
                    <FlipVertical size={16} /> Vertical
                  </button>
                </div>
              </div>

              <div style={s.controlGroup}>
                <span style={s.controlLabel}>Fine-tune Rotation: {degrees}°</span>
                <input 
                  type="range" 
                  min="-180" 
                  max="180" 
                  value={degrees} 
                  onChange={handleSliderChange}
                  style={s.slider}
                />
              </div>

              <div style={s.actionsRow}>
                <button style={s.btnGhostDanger} onClick={clearAll}>
                  <Trash2 size={14} /> Clear
                </button>
                <button 
                  style={s.btnPrimary} 
                  onClick={handleDownload}
                  disabled={processing}
                >
                  {processing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
                  Download
                </button>
              </div>

            </div>
          </div>
        )}

        <OtherTools currentToolId="rotate" />
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
    padding: '60px 24px', textAlign: 'center', cursor: 'pointer',
    background: 'var(--bg-surface)', outline: 'none', userSelect: 'none',
    transition: 'all 250ms ease',
  },
  dropzoneActive: {
    border: '2px dashed var(--accent)', background: 'var(--accent-subtle)',
    boxShadow: 'var(--shadow-glow)',
  },
  dropzoneReject: { border: '2px dashed var(--error)', background: 'var(--error-subtle)' },
  dropContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' },
  dropIcon: {
    width: 64, height: 64, borderRadius: '50%',
    background: 'var(--accent-subtle)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 8, transition: 'all 250ms ease',
  },
  dropIconActive: { background: 'var(--accent-glow)', border: '1px solid var(--accent)', transform: 'scale(1.1)' },
  dropTitle: { fontSize: 16, fontWeight: 600, color: 'var(--text)' },
  dropSub:   { fontSize: 13, color: 'var(--text-muted)' },
  
  errorNotice: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 16px', background: 'var(--error-subtle)',
    border: '1px solid rgba(239,68,68,0.25)', borderRadius: 'var(--radius)',
    color: 'var(--error)', fontSize: 13, fontWeight: 500,
  },

  workspace: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: 24,
  },
  previewContainer: {
    width: '100%',
    height: 400,
    background: 'var(--bg)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 16,
  },
  previewCanvas: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    boxShadow: 'var(--shadow-card)',
  },
  
  controlsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  controlLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text)',
  },
  buttonRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  btnControl: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', background: 'var(--bg)', color: 'var(--text)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'all 150ms ease', flex: '1 1 auto', justifyContent: 'center'
  },
  btnControlActive: {
    background: 'var(--accent-subtle)',
    borderColor: 'var(--accent)',
    color: 'var(--accent-hover)',
    fontWeight: 600,
  },
  slider: {
    width: '100%',
    cursor: 'pointer',
  },

  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTop: '1px solid var(--border)',
    marginTop: 8,
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '10px 20px', background: 'var(--accent)', color: '#fff',
    border: 'none', borderRadius: 'var(--radius-sm)',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    transition: 'background 150ms ease',
  },
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px',
    background: 'transparent',
    color: 'var(--error)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius-sm)',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
};
