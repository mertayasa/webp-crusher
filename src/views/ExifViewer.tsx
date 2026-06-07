"use client";
import { useState, useRef, useCallback } from 'react';
import type { CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import exifr from 'exifr';
import {
  Upload,
  Download,
  Trash2,
  ScanSearch,
  Camera,
  MapPin,
  Calendar,
  Info,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import '../App.css';

// Type for parsed EXIF data
type ExifData = Record<string, any>;

export default function ExifViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasGps, setHasGps] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const clearAll = useCallback(() => {
    setFile(null);
    setImageSrc(null);
    setExifData(null);
    setHasGps(false);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const droppedFile = acceptedFiles[0];
    if (!droppedFile) return;

    setFile(droppedFile);
    setIsScanning(true);

    const url = URL.createObjectURL(droppedFile);
    setImageSrc(url);

    try {
      // Parse all possible EXIF data including GPS
      const data = await exifr.parse(droppedFile, true);
      
      if (data) {
        setExifData(data);
        setHasGps(!!(data.latitude && data.longitude));
      } else {
        setExifData({});
        setHasGps(false);
      }
    } catch (e) {
      console.error("Failed to parse EXIF", e);
      setExifData({});
      setHasGps(false);
    } finally {
      setIsScanning(false);
    }
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

  const handleDownloadClean = () => {
    if (!file || !imageSrc || !canvasRef.current) return;
    
    // To cleanly strip all EXIF metadata, we simply draw the image onto a canvas
    // and re-export it as a fresh Blob. Browsers do not carry over EXIF headers during this.
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current!;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill white background for JPEG
      if (file.type === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          saveAs(blob, `clean-${file.name}`);
        }
      }, file.type, 0.95);
    };
    img.src = imageSrc;
  };

  const hasExif = exifData && Object.keys(exifData).length > 0;

  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>EXIF Metadata Stripper</h1>
        <p style={s.toolDesc}>
          Discover hidden data embedded in your photos (like exact GPS location or camera model). Scrub it completely before sharing online to protect your privacy.
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
            <div style={{ ...s.dropIcon, ...(isDragActive ? s.dropIconActive : {}) }}>
              <Upload size={26} color={isDragReject ? 'var(--error)' : 'var(--accent)'} />
            </div>
            <p style={s.dropTitle}>
              {isDragReject
                ? 'Only images (JPG, PNG, WebP) are supported'
                : isDragActive
                  ? 'Release to scan image!'
                  : 'Drop an image to scan for hidden metadata'}
            </p>
          </div>
        </div>
      )}

      {/* Hidden canvas used purely for stripping the EXIF data on export */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {file && isScanning && (
        <div style={s.scanningBox}>
          <ScanSearch size={40} color="var(--accent)" style={s.pulseAnim} />
          <h2>Scanning for hidden metadata...</h2>
        </div>
      )}

      {file && !isScanning && exifData && (
        <div style={s.resultBox}>
          
          <div style={s.previewHeader}>
            <div style={s.previewInfo}>
              <img src={imageSrc || ''} alt="Preview" style={s.previewThumb} />
              <div>
                <h3 style={s.fileName}>{file.name}</h3>
                <span style={s.fileBadge}>{hasExif ? 'Metadata Found' : 'Clean Image'}</span>
              </div>
            </div>
            <button style={s.btnGhostDanger} onClick={clearAll}>
              <Trash2 size={16} /> Scan Another
            </button>
          </div>

          <div style={s.contentArea}>
            {!hasExif ? (
              <div style={s.cleanState}>
                <ShieldCheck size={48} color="var(--success)" />
                <h3>No Hidden Data Found!</h3>
                <p>This image does not contain any EXIF metadata. It is safe to share.</p>
              </div>
            ) : (
              <div style={s.exifData}>
                {hasGps && (
                  <div style={s.alertBanner}>
                    <AlertTriangle size={20} />
                    <span><strong>Warning:</strong> This image contains precise GPS tracking coordinates.</span>
                  </div>
                )}
                
                <div style={s.summaryGrid}>
                  <div style={s.summaryCard}>
                    <Camera size={20} color="var(--text-muted)" />
                    <div style={s.cardMeta}>
                      <span style={s.cardLabel}>Camera Make & Model</span>
                      <strong style={s.cardVal}>{exifData.Make || 'Unknown'} {exifData.Model || ''}</strong>
                    </div>
                  </div>
                  <div style={s.summaryCard}>
                    <Calendar size={20} color="var(--text-muted)" />
                    <div style={s.cardMeta}>
                      <span style={s.cardLabel}>Date Taken</span>
                      <strong style={s.cardVal}>
                        {exifData.DateTimeOriginal ? new Date(exifData.DateTimeOriginal).toLocaleDateString() : 'Unknown'}
                      </strong>
                    </div>
                  </div>
                  <div style={s.summaryCard}>
                    <MapPin size={20} color={hasGps ? 'var(--error)' : 'var(--text-muted)'} />
                    <div style={s.cardMeta}>
                      <span style={s.cardLabel}>GPS Location</span>
                      <strong style={{...s.cardVal, color: hasGps ? 'var(--error)' : 'inherit'}}>
                        {hasGps ? `${exifData.latitude?.toFixed(4)}, ${exifData.longitude?.toFixed(4)}` : 'None Found'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={s.rawTableContainer}>
                  <h4 style={s.tableTitle}><Info size={14}/> All Hidden Metadata</h4>
                  <table style={s.table}>
                    <tbody>
                      {Object.entries(exifData).map(([key, val]) => {
                        // Skip rendering giant arrays or complex objects, just render strings/numbers/simple dates
                        if (typeof val === 'object' && !(val instanceof Date)) return null;
                        return (
                          <tr key={key} style={s.tr}>
                            <td style={s.tdKey}>{key}</td>
                            <td style={s.tdVal}>{String(val)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            )}
          </div>

          <div style={s.actions}>
            <p style={s.actionDesc}>
              {hasExif ? "Scrub all hidden data by clicking below. The image quality will remain exactly the same." : "You can still download a fresh copy if you want."}
            </p>
            <button style={s.btnPrimary} onClick={handleDownloadClean}>
              <Download size={16} /> Scrub Metadata & Download
            </button>
          </div>
        </div>
      )}

      <OtherTools currentToolId="exif" />
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

  scanningBox: {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
    padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    color: 'var(--text)',
  },
  pulseAnim: { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' },

  resultBox: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', overflow: 'hidden',
    boxShadow: 'var(--shadow-card)',
  },
  
  previewHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
  },
  previewInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  previewThumb: { width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' },
  fileName: { fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 },
  fileBadge: { fontSize: 11, fontWeight: 600, padding: '2px 8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-muted)' },
  
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
    background: 'rgba(239,68,68,0.06)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },

  contentArea: { padding: 24 },
  cleanState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    padding: '40px 20px', gap: 12, color: 'var(--text)',
  },
  
  exifData: { display: 'flex', flexDirection: 'column', gap: 24 },
  alertBanner: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)',
    borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: 14,
  },

  summaryGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16,
  },
  summaryCard: {
    display: 'flex', alignItems: 'center', gap: 12, padding: 16,
    background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
  },
  cardMeta: { display: 'flex', flexDirection: 'column', gap: 4 },
  cardLabel: { fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px' },
  cardVal: { fontSize: 14, color: 'var(--text)', fontWeight: 500 },

  rawTableContainer: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
  },
  tableTitle: { padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-card)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' },
  tr: { borderBottom: '1px solid var(--border)' },
  tdKey: { padding: '10px 16px', fontWeight: 600, color: 'var(--text-muted)', width: '30%', background: 'var(--bg-card)' },
  tdVal: { padding: '10px 16px', color: 'var(--text)', wordBreak: 'break-all' },

  actions: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
  },
  actionDesc: { fontSize: 13, color: 'var(--text-muted)', maxWidth: 400 },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease',
  },
};
