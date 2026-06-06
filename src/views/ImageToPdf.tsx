"use client";
import { useState, useCallback, useRef } from 'react';
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
  FileImage,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import { formatBytes } from '../utils/format';
import '../App.css';

type Status = 'idle' | 'loading' | 'converting' | 'done' | 'error';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export default function ImageToPdf() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const clearAll = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setStatus('idle');
    setError('');
    setProgress(0);
  }, [images]);

  const removeImage = (idToRemove: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== idToRemove);
      const removed = prev.find(img => img.id === idToRemove);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      
      if (filtered.length === 0) setStatus('idle');
      return filtered;
    });
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setImages(prev => {
      const newArr = [...prev];
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      return newArr;
    });
  };

  const moveDown = (index: number) => {
    setImages(prev => {
      if (index === prev.length - 1) return prev;
      const newArr = [...prev];
      [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
      return newArr;
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const newImages = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 9) + Date.now(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages(prev => [...prev, ...newImages]);
    setStatus('idle');
    setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
      'image/bmp': ['.bmp'],
    },
    disabled: status === 'converting' || status === 'loading',
  });

  // Helper to convert non-JPG/PNG formats (like WebP) into JPEG format using Canvas,
  // since pdf-lib only natively supports embedding JPG and PNG.
  const convertToJpegBytes = async (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context not available'));
        // Fill white background for transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Convert to base64, then extract pure bytes
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const base64Data = dataUrl.split(',')[1];
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        resolve(bytes);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const convertToPdf = async () => {
    if (images.length === 0) return;

    setStatus('converting');
    setError('');
    setProgress(0);

    try {
      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        
        // Read file bytes
        const arrayBuffer = await item.file.arrayBuffer();
        let imageBytes = new Uint8Array(arrayBuffer);
        
        let pdfImage;
        const type = item.file.type.toLowerCase();

        // PDF-lib supports PNG and JPEG natively.
        // We must convert WebP, BMP, etc to JPEG first.
        try {
          if (type === 'image/jpeg' || type === 'image/jpg') {
            pdfImage = await pdfDoc.embedJpg(imageBytes);
          } else if (type === 'image/png') {
            pdfImage = await pdfDoc.embedPng(imageBytes);
          } else {
            // Convert to JPEG using canvas fallback
            const fallbackBytes = await convertToJpegBytes(item.file);
            pdfImage = await pdfDoc.embedJpg(fallbackBytes);
          }
        } catch (embedErr) {
          // If native embed fails (sometimes happens with weird PNGs), fallback to canvas
          console.warn('Native embed failed, falling back to canvas conversion', embedErr);
          const fallbackBytes = await convertToJpegBytes(item.file);
          pdfImage = await pdfDoc.embedJpg(fallbackBytes);
        }

        const { width, height } = pdfImage.scale(1);
        
        // Add a page that exactly matches the image dimensions
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width,
          height,
        });

        setProgress(Math.round(((i + 1) / images.length) * 100));
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `compiled-images-${images.length}.pdf`);
      
      setStatus('done');
    } catch (err) {
      console.error(err);
      setError('Failed to generate PDF. One of the images may be corrupted.');
      setStatus('error');
    }
  };

  const isBusy = status === 'converting' || status === 'loading';

  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>Image to PDF</h1>
        <p style={s.toolDesc}>
          Combine multiple images into a single PDF document. Everything runs <strong>100% locally</strong> in your browser—your images are never uploaded to any server.
        </p>
      </div>

      {/* ── Drop Zone ── */}
      <div
        {...getRootProps()}
        style={{
          ...s.dropzone,
          ...(isDragActive && !isDragReject ? s.dropzoneActive : {}),
          ...(isDragReject ? s.dropzoneReject : {}),
          ...(isBusy ? s.dropzoneLocked : {}),
          padding: images.length > 0 ? '30px 20px' : '56px 24px',
        }}
      >
        <input {...getInputProps()} />
        <div style={s.dropContent}>
          <div style={{ ...s.dropIcon, ...(isDragActive ? s.dropIconActive : {}) }}>
            {isBusy ? <Loader2 size={26} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={26} color={isDragReject ? 'var(--error)' : 'var(--accent)'} />}
          </div>
          <p style={s.dropTitle}>
            {isDragReject
              ? 'Only images are supported'
              : isDragActive
                ? 'Drop images to add them!'
                : images.length > 0 ? 'Drop more images, or click to browse' : 'Drop images here, or click to browse'}
          </p>
        </div>
      </div>

      {error && (
        <div style={s.errorNotice}>
          <XCircle size={14} style={{ marginRight: 6, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* ── Image List ── */}
      {images.length > 0 && (
        <div style={s.listContainer}>
          <div style={s.listHeader}>
            <span style={s.listTitle}>Images to Compile ({images.length})</span>
            {images.length > 1 && <span style={s.listHint}>Use arrows to reorder pages</span>}
          </div>
          
          <div style={s.listScrollArea}>
            {images.map((item, index) => (
              <div key={item.id} style={s.listItem}>
                <div style={s.listLeft}>
                  <div style={s.previewThumb}>
                    <img src={item.previewUrl} style={s.previewImg} alt={item.file.name} />
                  </div>
                  <div style={s.itemInfo}>
                    <span style={s.itemName} title={item.file.name}>{item.file.name}</span>
                    <span style={s.itemMeta}>Page {index + 1} • {formatBytes(item.file.size)}</span>
                  </div>
                </div>
                
                <div style={s.listRight}>
                  <div style={s.orderControls}>
                    <button 
                      style={s.iconBtn} 
                      onClick={() => moveUp(index)} 
                      disabled={index === 0 || isBusy}
                      title="Move Up"
                    >
                      <ChevronUp size={18} />
                    </button>
                    <button 
                      style={s.iconBtn} 
                      onClick={() => moveDown(index)} 
                      disabled={index === images.length - 1 || isBusy}
                      title="Move Down"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>
                  <button 
                    style={s.deleteBtn} 
                    onClick={() => removeImage(item.id)}
                    disabled={isBusy}
                    title="Remove Image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action Bar ── */}
      {images.length > 0 && (
        <div style={s.actionBar}>
          <div style={s.actionLeft}>
            {status === 'converting' ? (
              <span style={s.progressText}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Generating PDF... {progress}%
              </span>
            ) : status === 'done' ? (
              <span style={s.successText}>
                <CheckCircle2 size={14} />
                PDF Generated Successfully!
              </span>
            ) : null}
          </div>
          <div style={s.actionRight}>
            <button style={s.btnGhostDanger} onClick={clearAll} disabled={isBusy}>
              Clear All
            </button>
            <button style={s.btnPrimary} onClick={convertToPdf} disabled={isBusy}>
              <FileImage size={15} />
              Convert to PDF
            </button>
          </div>
        </div>
      )}

      <OtherTools currentToolId="image-to-pdf" />
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
    textAlign: 'center', cursor: 'pointer',
    background: 'var(--bg-surface)', outline: 'none', userSelect: 'none',
    transition: 'all 250ms ease',
  },
  dropzoneActive: { border: '2px dashed var(--accent)', background: 'var(--accent-subtle)', boxShadow: 'var(--shadow-glow)' },
  dropzoneReject: { border: '2px dashed var(--error)', background: 'var(--error-subtle)' },
  dropzoneLocked: { cursor: 'not-allowed', opacity: 0.55 },
  dropContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, pointerEvents: 'none' },
  dropIcon: {
    width: 48, height: 48, borderRadius: '50%',
    background: 'var(--accent-subtle)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 4, transition: 'all 250ms ease',
  },
  dropIconActive: { background: 'var(--accent-glow)', border: '1px solid var(--accent)', transform: 'scale(1.1)' },
  dropTitle: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },

  errorNotice: {
    display: 'flex', alignItems: 'center', padding: '10px 16px',
    background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--error)', fontWeight: 500,
  },

  listContainer: {
    display: 'flex', flexDirection: 'column',
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', overflow: 'hidden',
  },
  listHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', borderBottom: '1px solid var(--border)',
    background: 'var(--bg-card)',
  },
  listTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  listHint: { fontSize: 12, color: 'var(--text-muted)' },
  listScrollArea: {
    maxHeight: 380, overflowY: 'auto',
    display: 'flex', flexDirection: 'column',
  },
  listItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 16px', borderBottom: '1px solid var(--border-light)',
    transition: 'background 150ms ease',
  },
  listLeft: { display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 },
  previewThumb: {
    width: 48, height: 48, borderRadius: 6,
    background: '#f1f1f1', overflow: 'hidden',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    border: '1px solid var(--border-light)'
  },
  previewImg: { maxWidth: '100%', maxHeight: '100%', objectFit: 'cover' },
  itemInfo: { display: 'flex', flexDirection: 'column', minWidth: 0, gap: 3 },
  itemName: { fontSize: 14, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  itemMeta: { fontSize: 12, color: 'var(--text-muted)' },
  
  listRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 },
  orderControls: { display: 'flex', flexDirection: 'column', gap: 2 },
  iconBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 2, borderRadius: 4,
  },
  deleteBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--error)', padding: 6, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  actionBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', background: 'var(--bg-surface)',
    border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
  },
  actionLeft: { display: 'flex', alignItems: 'center' },
  actionRight: { display: 'flex', gap: 10 },
  progressText: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: 'var(--accent)' },
  successText: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: 'var(--success)' },

  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease',
  },
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
    background: 'transparent', color: 'var(--error)',
    border: '1px solid transparent', borderRadius: 'var(--radius-md)',
    fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
};
