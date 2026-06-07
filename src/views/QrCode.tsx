"use client";
import { useState, useRef, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import {
  Upload,
  Download,
  Trash2,
  QrCode as QrIcon,
  Scan,
  CheckCircle2,
  AlertCircle,
  Copy,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import '../App.css';

type Tab = 'generate' | 'scan';

export default function QrCodeSuite() {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  // Generate State
  const [inputText, setInputText] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  // Scan State
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanImageSrc, setScanImageSrc] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<boolean>(false);
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- GENERATE LOGIC ---
  useEffect(() => {
    if (!inputText.trim()) {
      setGeneratedUrl(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const canvas = document.createElement('canvas');
        // 1. Generate base QR Code
        await QRCode.toCanvas(canvas, inputText, {
          width: 500,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
          errorCorrectionLevel: 'H' // High error correction is required when placing logos over QR codes
        });

        // 2. Overlay Logo
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const logoSize = 120; // Size of logo in center
          const center = (500 - logoSize) / 2;
          
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = '/image-slayer-square.png';
          });
          
          // Draw a small white padding box behind the logo for clarity
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(center - 6, center - 6, logoSize + 12, logoSize + 12, 12);
          ctx.fill();
          
          // Draw the actual logo
          ctx.drawImage(img, center, center, logoSize, logoSize);
        }

        setGeneratedUrl(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Failed to generate QR with logo', err);
      }
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [inputText]);

  const downloadGenerated = () => {
    if (!generatedUrl) return;
    saveAs(generatedUrl, 'ImageSlayer-QRCode.png');
  };

  // --- SCAN LOGIC ---
  const clearScan = useCallback(() => {
    setScanFile(null);
    setScanImageSrc(null);
    setScanResult(null);
    setScanError(false);
  }, []);

  const onDropScan = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setScanFile(file);
    const url = URL.createObjectURL(file);
    setScanImageSrc(url);
    setScanError(false);
    setScanResult(null);

    const img = new Image();
    img.onload = () => {
      const canvas = scanCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        setScanResult(code.data);
      } else {
        setScanError(true);
      }
    };
    img.src = url;
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: onDropScan,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: false,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>QR Code Suite</h1>
        <p style={s.toolDesc}>
          Generate beautiful QR codes instantly, or securely scan QR codes from screenshots without uploading them to sketchy websites.
        </p>
      </div>

      <div style={s.tabs}>
        <button 
          style={{...s.tabBtn, ...(activeTab === 'generate' ? s.tabActive : {})}}
          onClick={() => setActiveTab('generate')}
        >
          <QrIcon size={18} /> Generate QR Code
        </button>
        <button 
          style={{...s.tabBtn, ...(activeTab === 'scan' ? s.tabActive : {})}}
          onClick={() => setActiveTab('scan')}
        >
          <Scan size={18} /> Scan Image
        </button>
      </div>

      {/* GENERATE TAB */}
      {activeTab === 'generate' && (
        <div style={s.box}>
          <div style={s.generateLayout}>
            <div style={s.inputSection}>
              <label style={s.label}>Enter URL or Text</label>
              <textarea 
                style={s.textarea}
                placeholder="https://imageslayer.com"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <p style={s.inputHint}>The QR code updates automatically as you type.</p>
            </div>
            
            <div style={s.previewSection}>
              {generatedUrl ? (
                <>
                  <div style={s.qrWrapper}>
                    <img src={generatedUrl} alt="Generated QR Code" style={s.qrImage} />
                  </div>
                  <button style={s.btnPrimary} onClick={downloadGenerated}>
                    <Download size={16} /> Download PNG
                  </button>
                </>
              ) : (
                <div style={s.qrEmpty}>
                  <QrIcon size={48} color="var(--border)" />
                  <p>Awaiting input...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SCAN TAB */}
      {activeTab === 'scan' && (
        <div style={s.box}>
          {!scanFile ? (
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
                      ? 'Release to scan QR!'
                      : 'Drop a screenshot of a QR code here'}
                </p>
              </div>
            </div>
          ) : (
            <div style={s.scanResultLayout}>
              
              <div style={s.scanPreview}>
                <div style={s.previewHeader}>
                  <h3 style={s.fileName}>{scanFile.name}</h3>
                  <button style={s.btnGhostDanger} onClick={clearScan}>
                    <Trash2 size={16} /> Scan Another
                  </button>
                </div>
                <div style={s.imageWrapper}>
                  <img src={scanImageSrc!} alt="Scan target" style={s.scannedImage} />
                </div>
              </div>

              <div style={s.scanData}>
                {scanResult ? (
                  <div style={s.successBox}>
                    <div style={s.successHeader}>
                      <CheckCircle2 size={24} color="var(--success)" />
                      <h3>QR Code Decoded</h3>
                    </div>
                    <div style={s.resultCodeBox}>
                      <code>{scanResult}</code>
                    </div>
                    <div style={s.resultActions}>
                      <button style={s.btnSecondary} onClick={() => copyToClipboard(scanResult)}>
                        <Copy size={16} /> Copy to Clipboard
                      </button>
                      {scanResult.startsWith('http') && (
                        <a href={scanResult} target="_blank" rel="noopener noreferrer" style={s.btnPrimary}>
                          Visit Link
                        </a>
                      )}
                    </div>
                  </div>
                ) : scanError ? (
                  <div style={s.errorBox}>
                    <AlertCircle size={48} color="var(--error)" />
                    <h3>No QR Code Found</h3>
                    <p>We couldn't detect a valid QR code in this image. Make sure the code is clear, well-lit, and not cropped too tightly.</p>
                  </div>
                ) : (
                  <div style={s.scanningBox}>
                    <Scan size={32} color="var(--accent)" style={s.pulseAnim} />
                    <p>Scanning image...</p>
                  </div>
                )}
              </div>

            </div>
          )}
          {/* Hidden canvas for extracting pixel data */}
          <canvas ref={scanCanvasRef} style={{ display: 'none' }} />
        </div>
      )}

      <OtherTools currentToolId="qr-code" />
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
  
  tabs: { display: 'flex', gap: 8, marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 16 },
  tabBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms ease',
  },
  tabActive: { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' },

  box: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)', overflow: 'hidden',
    boxShadow: 'var(--shadow-card)', padding: 24,
  },

  // Generate Tab Styles
  generateLayout: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'start' },
  inputSection: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  textarea: {
    padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: 16, fontFamily: 'inherit',
    minHeight: 150, resize: 'vertical', outline: 'none', lineHeight: 1.5,
  },
  inputHint: { fontSize: 13, color: 'var(--text-dim)' },

  previewSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  qrWrapper: { 
    width: '100%', aspectRatio: '1/1', background: '#fff', borderRadius: 'var(--radius-md)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    border: '1px solid var(--border)', padding: 12,
  },
  qrImage: { width: '100%', height: '100%', objectFit: 'contain' },
  qrEmpty: {
    width: '100%', aspectRatio: '1/1', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
    border: '1px dashed var(--border)', color: 'var(--text-dim)', fontSize: 14, fontWeight: 500,
  },

  // Scan Tab Styles
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

  scanResultLayout: { display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'stretch' },
  scanPreview: { display: 'flex', flexDirection: 'column', gap: 12 },
  previewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  fileName: { fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 },
  imageWrapper: { 
    width: '100%', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 12, height: 300,
  },
  scannedImage: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },

  scanData: { display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 },
  successBox: { display: 'flex', flexDirection: 'column', gap: 16 },
  successHeader: { display: 'flex', alignItems: 'center', gap: 12, color: 'var(--success)' },
  resultCodeBox: { 
    background: 'var(--bg-surface)', padding: 16, borderRadius: 'var(--radius-md)', 
    border: '1px solid var(--border)', wordBreak: 'break-all', fontSize: 15, color: 'var(--text)',
    lineHeight: 1.5,
  },
  resultActions: { display: 'flex', gap: 12 },
  
  errorBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    padding: 32, gap: 12, color: 'var(--error)', background: 'var(--error-subtle)',
    borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)'
  },
  scanningBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
    padding: 32, gap: 16, color: 'var(--text)',
  },
  pulseAnim: { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' },

  // Buttons
  btnPrimary: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px',
    background: 'var(--accent)', color: '#fff', border: 'none', width: '100%', textDecoration: 'none',
    borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease',
  },
  btnSecondary: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px',
    background: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--border)', width: '100%',
    borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease',
  },
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
    background: 'rgba(239,68,68,0.06)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
};
