'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PDFDocument } from 'pdf-lib';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import Draggable from 'react-draggable';
import { saveAs } from 'file-saver';
import { 
  FileText, UploadCloud, ChevronLeft, ChevronRight, 
  ChevronsLeft, ChevronsRight,
  PenTool, Image as ImageIcon, Download, X, Trash2
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';

export default function SignPDF() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  // PDF Preview State
  const [pdfjs, setPdfjs] = useState<any | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<PDFDocumentProxy | null>(null);

  useEffect(() => {
    import('pdfjs-dist').then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      setPdfjs(pdfjsLib);
    }).catch(err => console.error("Failed to load pdfjs-dist", err));
  }, []);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);
  
  const [viewportMeta, setViewportMeta] = useState<{ width: number, height: number, scale: number } | null>(null);

  // Signature State
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [signaturePos, setSignaturePos] = useState({ x: 50, y: 50 });
  const [signatureSize, setSignatureSize] = useState({ width: 200, height: 100 });
  
  // Drawing Canvas State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  // Load PDF File
  const onDropPdf = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || file.type !== 'application/pdf') return;
    
    setPdfFile(file);
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    try {
      if (!pdfjs) throw new Error("PDF engine not initialized yet.");
      const proxy = await pdfjs.getDocument({ data: uint8Array }).promise;
      setPdfDocProxy(proxy);
      setNumPages(proxy.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error loading PDF', err);
      alert('Failed to load PDF.');
    }
  }, [pdfjs]);

  const { getRootProps: getPdfRootProps, getInputProps: getPdfInputProps, isDragActive: isPdfDragActive } = useDropzone({
    onDrop: onDropPdf,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: !pdfjs
  });

  // Render current PDF page
  useEffect(() => {
    if (!pdfDocProxy || !canvasRef.current || !containerRef.current) return;

    const renderPage = async () => {
      const page = await pdfDocProxy.getPage(currentPage);
      const containerWidth = containerRef.current!.clientWidth;
      
      // Calculate scale to fit container width
      let unscaledViewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });

      setViewportMeta({ width: viewport.width, height: viewport.height, scale });

      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d');
      if (!context) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    };

    renderPage();
  }, [pdfDocProxy, currentPage]);

  // Load Signature Image
  const onDropSignature = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSignatureImage(e.target.result as string);
        setSignaturePos({ x: 50, y: 50 }); // Reset pos
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps: getSigRootProps, getInputProps: getSigInputProps } = useDropzone({
    onDrop: onDropSignature,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxFiles: 1,
    noClick: true // Triggered by a button click instead
  });

  // Drawing Canvas Logic
  useEffect(() => {
    if (isDrawingMode && drawingCanvasRef.current) {
      const canvas = drawingCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000000'; // Default signature color
      }
    }
  }, [isDrawingMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    setSignatureImage(canvas.toDataURL('image/png'));
    setIsDrawingMode(false);
    setSignaturePos({ x: 50, y: 50 });
  };

  // Sign & Download PDF
  const handleSignPdf = async () => {
    if (!pdfFile || !signatureImage || !viewportMeta) return;

    try {
      setIsProcessing(true);
      
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const page = pages[currentPage - 1]; // PDF-lib is 0-indexed

      // Load image
      let embeddedImage;
      if (signatureImage.startsWith('data:image/png')) {
        embeddedImage = await pdfDoc.embedPng(signatureImage);
      } else if (signatureImage.startsWith('data:image/jpeg') || signatureImage.startsWith('data:image/jpg')) {
        embeddedImage = await pdfDoc.embedJpg(signatureImage);
      } else {
        throw new Error('Unsupported image format for signature.');
      }

      // Calculate coordinates
      // pdf-lib's origin is bottom-left. Screen's origin is top-left.
      const pdfPageSize = page.getSize();
      const scaleX = pdfPageSize.width / viewportMeta.width;
      const scaleY = pdfPageSize.height / viewportMeta.height;

      const pdfX = signaturePos.x * scaleX;
      // Invert Y coordinate
      const pdfY = pdfPageSize.height - ((signaturePos.y + signatureSize.height) * scaleY);

      const pdfSigWidth = signatureSize.width * scaleX;
      const pdfSigHeight = signatureSize.height * scaleY;

      page.drawImage(embeddedImage, {
        x: pdfX,
        y: pdfY,
        width: pdfSigWidth,
        height: pdfSigHeight,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const outputName = pdfFile.name.replace('.pdf', '_signed.pdf');
      saveAs(blob, outputName);

    } catch (error) {
      console.error('Error signing PDF:', error);
      alert('An error occurred while signing the PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragStop = (e: any, data: { x: number, y: number }) => {
    setSignaturePos({ x: data.x, y: data.y });
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startWidth = signatureSize.width;
    const startHeight = signatureSize.height;

    const onMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : (moveEvent as MouseEvent).clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : (moveEvent as MouseEvent).clientY;
      const newWidth = Math.max(50, startWidth + (currentX - startX));
      const newHeight = Math.max(25, startHeight + (currentY - startY));
      setSignatureSize({ width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onMouseMove);
      document.removeEventListener('touchend', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onMouseMove, { passive: false });
    document.addEventListener('touchend', onMouseUp);
  };

  const resetAll = () => {
    setPdfFile(null);
    setPdfDocProxy(null);
    setSignatureImage(null);
    setIsDrawingMode(false);
  };

  return (
    <main style={{ flex: 1, maxWidth: 860, width: '100%', margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 16, animation: 'fade-in 0.5s ease-out' }}>
      <BackButton />
      
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: 'var(--text)', letterSpacing: '-0.5px' }}>
          Sign PDF
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 600, margin: '0 auto' }}>
          Add your signature to PDF documents securely. 100% private, files never leave your device.
        </p>
      </div>

      {!pdfFile ? (
        <div 
          {...getPdfRootProps()} 
          className="glass-panel"
          style={{
            border: `2px dashed ${isPdfDragActive ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '80px 40px',
            textAlign: 'center',
            cursor: 'pointer',
            background: isPdfDragActive ? 'var(--accent-subtle)' : 'var(--bg-card)',
            transition: 'all var(--transition-med)'
          }}
        >
          <input {...getPdfInputProps()} />
          <FileText size={48} style={{ color: 'var(--accent)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
            Drop your PDF here
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>or click to browse from your device</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Controls Bar */}
          <div className="glass-panel" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '16px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontWeight: 500, fontSize: '14px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pdfFile.name}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg)', padding: '4px 8px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <button 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                  style={{ background: 'none', border: 'none', color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                  title="First Page"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  style={{ background: 'none', border: 'none', color: currentPage <= 1 ? 'var(--text-muted)' : 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                  title="Previous Page"
                >
                  <ChevronLeft size={16} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '0 4px' }}>
                  <input 
                    type="number"
                    min={1}
                    max={numPages}
                    value={currentPage}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= numPages) {
                        setCurrentPage(val);
                      }
                    }}
                    style={{
                      width: '40px',
                      textAlign: 'center',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      color: 'var(--text)',
                      fontSize: '13px',
                      padding: '2px 0',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ {numPages}</span>
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                  disabled={currentPage >= numPages}
                  style={{ background: 'none', border: 'none', color: currentPage >= numPages ? 'var(--text-muted)' : 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                  title="Next Page"
                >
                  <ChevronRight size={16} />
                </button>
                <button 
                  onClick={() => setCurrentPage(numPages)}
                  disabled={currentPage >= numPages}
                  style={{ background: 'none', border: 'none', color: currentPage >= numPages ? 'var(--text-muted)' : 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                  title="Last Page"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={resetAll} style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '8px 16px',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Trash2 size={16} />
                Cancel
              </button>

              <button 
                onClick={handleSignPdf} 
                disabled={!signatureImage || isProcessing}
                style={{
                  background: (!signatureImage || isProcessing) ? 'var(--border)' : 'var(--accent)',
                  color: (!signatureImage || isProcessing) ? 'var(--text-muted)' : '#ffffff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: 'var(--radius)',
                  cursor: (!signatureImage || isProcessing) ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background var(--transition)'
                }}
              >
                <Download size={16} />
                {isProcessing ? 'Processing...' : 'Sign & Download PDF'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
            
            {/* PDF Viewport */}
            <div ref={containerRef} style={{
              position: 'relative',
              background: '#2a2a35', // Darker background to contrast white PDF
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '600px'
            }}>
              <canvas ref={canvasRef} style={{ display: 'block' }} />
              
              {/* Draggable Signature Overlay */}
              {signatureImage && viewportMeta && (
                <Draggable
                  nodeRef={nodeRef}
                  bounds="parent"
                  position={signaturePos}
                  onStop={handleDragStop}
                  cancel=".resize-handle"
                >
                  <div ref={nodeRef} style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: signatureSize.width,
                    height: signatureSize.height,
                    border: '1px dashed var(--accent)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    cursor: 'move',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10
                  }}>
                    <img 
                      src={signatureImage} 
                      alt="Signature" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain',
                        pointerEvents: 'none' // Let the parent div handle drag events
                      }} 
                    />
                    
                    {/* Delete button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSignatureImage(null); }}
                      style={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        background: 'var(--error)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 20
                      }}
                    >
                      <X size={12} />
                    </button>

                    {/* Resize Handle */}
                    <div 
                      className="resize-handle"
                      onMouseDown={handleResizeStart}
                      onTouchStart={handleResizeStart}
                      style={{
                        position: 'absolute',
                        bottom: 0, right: 0,
                        width: 16, height: 16,
                        cursor: 'se-resize',
                        background: 'var(--accent)',
                        clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                        zIndex: 30
                      }}
                    />
                  </div>
                </Draggable>
              )}
            </div>

            {/* Signature Tools Side Panel */}
            <div className="glass-panel" style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Add Signature</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Upload an image of your signature or draw one right here.
                </p>
              </div>

              {/* Upload Option */}
              <div {...getSigRootProps()} style={{
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'var(--bg)'
              }}>
                <input {...getSigInputProps()} id="sig-upload" />
                <UploadCloud size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Click to upload image</div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>PNG, JPG (transparent BG recommended)</div>
              </div>

              {/* Or separator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
              </div>

              {/* Draw Option */}
              <button 
                onClick={() => setIsDrawingMode(true)}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background var(--transition)'
                }}
              >
                <PenTool size={16} />
                Draw Signature
              </button>

              {/* Resize signature controls (Optional bonus feature) */}
              {signatureImage && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>
                    Signature Size
                  </label>
                  <input 
                    type="range" 
                    min="50" 
                    max="400" 
                    value={signatureSize.width}
                    onChange={(e) => {
                      const w = parseInt(e.target.value);
                      setSignatureSize({ width: w, height: w / 2 });
                    }}
                    style={{ width: '100%', accentColor: 'var(--accent)' }}
                  />
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Drawing Modal */}
      {isDrawingMode && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div className="glass-panel" style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            width: '100%',
            maxWidth: '600px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Draw Signature</h3>
              <button onClick={() => setIsDrawingMode(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ 
              background: '#ffffff', // White background for signature drawing 
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }}>
              <canvas
                ref={drawingCanvasRef}
                width={550}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ display: 'block', cursor: 'crosshair', touchAction: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <button onClick={clearDrawing} style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '8px 16px',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                Clear
              </button>
              <button onClick={saveDrawing} style={{
                background: 'var(--accent)',
                color: '#ffffff',
                border: 'none',
                padding: '8px 24px',
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600
              }}>
                Save Signature
              </button>
            </div>
          </div>
        </div>
      )}
      
      <OtherTools currentToolId="sign-pdf" />
    </main>
  );
}
