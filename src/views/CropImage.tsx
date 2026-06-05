"use client";
import { useState, useCallback, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Upload,
  Download,
  Trash2,
  Loader2,
  XCircle,
  Crop as CropIcon,
  Square,
  RectangleHorizontal
} from 'lucide-react';
import { processCropAndExport } from '../utils/cropImage';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import '../App.css';

const ASPECT_RATIOS = [
  { label: 'Freeform', value: undefined, icon: <CropIcon size={14} /> },
  { label: 'Square (1:1)', value: 1, icon: <Square size={14} /> },
  { label: '16:9', value: 16 / 9, icon: <RectangleHorizontal size={14} /> },
  { label: '4:3', value: 4 / 3, icon: <RectangleHorizontal size={14} /> },
  { label: '9:16', value: 9 / 16, icon: <RectangleHorizontal size={14} /> },
];

export default function CropImage() {
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (!accepted.length) return;
    setError(null);
    const selectedFile = accepted[0];
    setFile(selectedFile);

    const reader = new FileReader();
    reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
    reader.readAsDataURL(selectedFile);
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

  const onImageLoad = () => {
    const initialCrop: Crop = {
      unit: '%',
      width: 50,
      height: 50,
      x: 25,
      y: 25,
    };
    setCrop(initialCrop);
  };

  const handleDownload = async () => {
    if (!file || !completedCrop || !imgRef.current) return;
    if (completedCrop.width === 0 || completedCrop.height === 0) return;

    setProcessing(true);
    setError(null);
    try {
      const blob = await processCropAndExport(file, imgRef.current, completedCrop);
      
      const lastDot = file.name.lastIndexOf('.');
      const base = lastDot !== -1 ? file.name.slice(0, lastDot) : file.name;
      const ext = lastDot !== -1 ? file.name.slice(lastDot) : '.jpg';
      const outputName = `${base}-cropped${ext}`;
      
      saveAs(blob, outputName);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setError(null);
  };

  return (
    <>
      <main style={s.main}>
        <BackButton />
        
        <div style={s.toolHero}>
          <h1 style={s.toolTitle}>Crop Image</h1>
          <p style={s.toolDesc}>
            Trim borders and focus on what matters. <strong>100% private</strong> — all processing happens directly in your browser, and your files never leave your device.
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

        {file && !!imgSrc && (
          <div style={s.workspace}>
            
            {/* Controls */}
            <div style={s.aspectBar}>
              <span style={s.aspectLabel}>Aspect Ratio:</span>
              <div style={s.aspectOptions}>
                {ASPECT_RATIOS.map(ratio => (
                  <button
                    key={ratio.label}
                    style={{
                      ...s.btnAspect,
                      ...(aspect === ratio.value ? s.btnAspectActive : {}),
                    }}
                    onClick={() => {
                      setAspect(ratio.value);
                      if (ratio.value && imgRef.current) {
                        const { width, height } = imgRef.current;
                        const newCrop = centerCrop(
                          makeAspectCrop(
                            { unit: '%', width: 80 },
                            ratio.value,
                            width,
                            height
                          ),
                          width,
                          height
                        );
                        setCrop(newCrop);
                      }
                    }}
                  >
                    {ratio.icon}
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Area */}
            <div style={s.previewContainer}>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                className="custom-react-crop"
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  style={s.previewImg}
                />
              </ReactCrop>
            </div>

            <div style={s.actionsRow}>
              <button style={s.btnGhostDanger} onClick={clearAll}>
                <Trash2 size={14} /> Clear
              </button>
              <button 
                style={s.btnPrimary} 
                onClick={handleDownload}
                disabled={processing || !completedCrop?.width || !completedCrop?.height}
              >
                {processing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
                Download
              </button>
            </div>
          </div>
        )}

        <OtherTools currentToolId="crop" />
      </main>

      {/* Global override for crop handles to match theme */}
      <style>{`
        .custom-react-crop .ReactCrop__drag-handle {
          width: 12px;
          height: 12px;
          border: 1px solid rgba(0,0,0,0.2);
        }
        .custom-react-crop .ReactCrop__drag-handle::after {
          background-color: var(--accent);
          border-radius: 50%;
        }
      `}</style>
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
  aspectBar: {
    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    padding: '10px 16px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  aspectLabel: {
    fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
  },
  aspectOptions: {
    display: 'flex', gap: 6, flexWrap: 'wrap',
  },
  btnAspect: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', fontSize: 12, fontWeight: 500,
    background: 'transparent', color: 'var(--text-muted)',
    border: '1px solid var(--border)', borderRadius: 20,
    cursor: 'pointer', transition: 'all 150ms ease', fontFamily: 'inherit',
  },
  btnAspectActive: {
    background: 'var(--accent-subtle)', color: 'var(--accent-hover)',
    border: '1px solid var(--accent)', fontWeight: 600,
  },
  previewContainer: {
    width: '100%',
    background: 'var(--bg)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 0,
  },
  previewImg: {
    maxHeight: '60vh',
    display: 'block',
    margin: '0 auto',
  },
  
  actionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTop: '1px solid var(--border)',
    marginTop: 0,
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
