"use client";
import { useState, useRef, useCallback, useEffect } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, ChangeEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import {
  Upload,
  Download,
  Trash2,
  Type,
  Plus,
  Palette,
  AlignLeft,
  Settings,
} from 'lucide-react';
import BackButton from '../components/BackButton';
import OtherTools from '../components/OtherTools';
import '../App.css';

type BackgroundStyle = 'none' | 'stroke' | 'solid';

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bgStyle: BackgroundStyle;
  bgColor: string;
}

export default function AddText() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const clearAll = useCallback(() => {
    setImage(null);
    setLayers([]);
    setSelectedId(null);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setLayers([]);
      setSelectedId(null);
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

  const addTextLayer = () => {
    if (!image) return;
    const newId = Math.random().toString(36).substr(2, 9);
    const newLayer: TextLayer = {
      id: newId,
      text: 'Double click or edit below',
      x: image.width / 2,
      y: image.height / 2,
      fontSize: Math.max(30, Math.floor(image.height / 15)),
      fontFamily: 'Impact, sans-serif',
      color: '#ffffff',
      bgStyle: 'stroke',
      bgColor: '#000000',
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedId(newId);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setLayers(prev => prev.filter(l => l.id !== selectedId));
    setSelectedId(null);
  };

  const updateSelected = (updates: Partial<TextLayer>) => {
    if (!selectedId) return;
    setLayers(prev => prev.map(l => l.id === selectedId ? { ...l, ...updates } : l));
  };

  const getCanvasCoordinates = (e: ReactMouseEvent | ReactTouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
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
    if ('touches' in e && e.cancelable) e.preventDefault();
    
    const pos = getCanvasCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check if clicked on a text layer (reverse order to pick top-most first)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
      const metrics = ctx.measureText(layer.text);
      const w = metrics.width;
      const h = layer.fontSize; // rough estimation

      // Calculate bounding box based on center alignment
      const left = layer.x - w / 2;
      const right = layer.x + w / 2;
      const top = layer.y - h; // y is roughly the baseline
      const bottom = layer.y + h * 0.2; // some descender space

      // Add generous padding for hit detection (especially important on touch)
      const hitPadding = 20 * (canvas.width / 800); 

      if (pos.x >= left - hitPadding && pos.x <= right + hitPadding && pos.y >= top - hitPadding && pos.y <= bottom + hitPadding) {
        setSelectedId(layer.id);
        setIsDragging(true);
        setDragOffset({ x: pos.x - layer.x, y: pos.y - layer.y });
        return; // Stop checking
      }
    }

    // If clicked empty space, deselect
    setSelectedId(null);
  };

  const handlePointerMove = (e: ReactMouseEvent | ReactTouchEvent) => {
    if (!isDragging || !selectedId) return;
    if ('touches' in e && e.cancelable) e.preventDefault();

    const pos = getCanvasCoordinates(e);
    setLayers(prev => prev.map(l => {
      if (l.id === selectedId) {
        return { ...l, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y };
      }
      return l;
    }));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Main Drawing Function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (canvas.width !== image.width) canvas.width = image.width;
    if (canvas.height !== image.height) canvas.height = image.height;

    // Draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    // Draw Text Layers
    layers.forEach((layer) => {
      ctx.save();
      ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';

      // Background Style
      if (layer.bgStyle === 'solid') {
        const metrics = ctx.measureText(layer.text);
        const w = metrics.width + layer.fontSize; // padding
        const h = layer.fontSize * 1.4; // padding
        ctx.fillStyle = layer.bgColor;
        ctx.fillRect(layer.x - w / 2, layer.y - layer.fontSize, w, h);
      }

      // Stroke / Outline (Classic Meme Style)
      if (layer.bgStyle === 'stroke') {
        ctx.strokeStyle = layer.bgColor;
        ctx.lineWidth = Math.max(3, layer.fontSize / 10);
        ctx.lineJoin = 'round';
        ctx.strokeText(layer.text, layer.x, layer.y);
      }

      // Main Text Fill
      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text, layer.x, layer.y);

      // Draw Selection Bounding Box
      if (layer.id === selectedId) {
        const metrics = ctx.measureText(layer.text);
        const w = metrics.width + layer.fontSize * 0.5;
        const h = layer.fontSize * 1.2;
        ctx.strokeStyle = '#0ea5e9'; // Blue selection
        ctx.lineWidth = 2 * (canvas.width / 800);
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(layer.x - w / 2, layer.y - layer.fontSize * 0.9, w, h);
      }

      ctx.restore();
    });
  }, [image, layers, selectedId]);

  const handleDownload = () => {
    if (!canvasRef.current || !image) return;
    
    setSelectedId(null); // Deselect before export to hide bounding boxes
    
    // Slight delay to ensure canvas rerenders without selection box
    setTimeout(() => {
      canvasRef.current!.toBlob((blob) => {
        if (blob) saveAs(blob, `annotated-image.jpg`);
      }, 'image/jpeg', 0.95);
    }, 50);
  };

  const selectedLayer = layers.find(l => l.id === selectedId);

  return (
    <main style={s.main}>
      <BackButton />

      <div style={s.toolHero}>
        <h1 style={s.toolTitle}>Add Text & Captions</h1>
        <p style={s.toolDesc}>
          Add text, memes, or annotations to your images. All processing is done <strong>100% locally</strong> in your browser.
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
            <button style={s.btnPrimary} onClick={addTextLayer}>
              <Plus size={16} /> Add Text
            </button>
            <button style={s.btnGhostDanger} onClick={clearAll}>
              <Trash2 size={16} /> Clear All
            </button>
          </div>

          <div style={s.workspace}>
            {/* The actual drawable area */}
            <div style={s.canvasContainer}>
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
              {layers.length === 0 && (
                <div style={s.canvasHint}>
                  <span>Click "Add Text" to begin.</span>
                </div>
              )}
            </div>

            {/* Sidebar Inspector for Selected Text */}
            <div style={s.inspector}>
              {selectedLayer ? (
                <div style={s.panel}>
                  <h3 style={s.panelTitle}><Settings size={14}/> Text Properties</h3>
                  
                  <div style={s.inputGroup}>
                    <label style={s.label}>Text Content</label>
                    <textarea 
                      style={s.textarea}
                      value={selectedLayer.text}
                      onChange={(e) => updateSelected({ text: e.target.value })}
                    />
                  </div>

                  <div style={s.inputRow}>
                    <div style={s.inputGroup}>
                      <label style={s.label}>Font Size</label>
                      <input 
                        type="number" 
                        style={s.input}
                        value={selectedLayer.fontSize}
                        onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
                      />
                    </div>
                    <div style={s.inputGroup}>
                      <label style={s.label}>Font Family</label>
                      <select 
                        style={s.select}
                        value={selectedLayer.fontFamily}
                        onChange={(e) => updateSelected({ fontFamily: e.target.value })}
                      >
                        <option value="Impact, sans-serif">Impact</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="'Courier New', monospace">Courier</option>
                        <option value="'Times New Roman', serif">Times</option>
                      </select>
                    </div>
                  </div>

                  <div style={s.inputRow}>
                    <div style={s.inputGroup}>
                      <label style={s.label}>Text Color</label>
                      <div style={s.colorPickerWrap}>
                        <input 
                          type="color" 
                          style={s.colorInput}
                          value={selectedLayer.color}
                          onChange={(e) => updateSelected({ color: e.target.value })}
                        />
                      </div>
                    </div>
                    <div style={s.inputGroup}>
                      <label style={s.label}>Background/Stroke Color</label>
                      <div style={s.colorPickerWrap}>
                        <input 
                          type="color" 
                          style={s.colorInput}
                          value={selectedLayer.bgColor}
                          onChange={(e) => updateSelected({ bgColor: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={s.inputGroup}>
                    <label style={s.label}>Style</label>
                    <select 
                      style={s.select}
                      value={selectedLayer.bgStyle}
                      onChange={(e) => updateSelected({ bgStyle: e.target.value as BackgroundStyle })}
                    >
                      <option value="none">Plain</option>
                      <option value="stroke">Outline / Stroke (Meme Style)</option>
                      <option value="solid">Solid Background</option>
                    </select>
                  </div>

                  <button style={{...s.btnGhostDanger, marginTop: 12, width: '100%', justifyContent: 'center'}} onClick={deleteSelected}>
                    <Trash2 size={15}/> Delete Text
                  </button>

                </div>
              ) : (
                <div style={s.emptyInspector}>
                  <Type size={32} color="var(--border)" />
                  <p>Select a text layer on the image to edit its properties.</p>
                </div>
              )}
            </div>
          </div>

          <div style={s.actions}>
            <span style={s.statsText}>
              <Type size={14} /> {layers.length} text layer{layers.length !== 1 ? 's' : ''}
            </span>
            <button style={s.btnPrimary} onClick={handleDownload}>
              <Download size={15} /> Export Image
            </button>
          </div>
        </div>
      )}

      <OtherTools currentToolId="add-text" />
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
    padding: '60px 24px', textAlign: 'center', cursor: 'pointer', width: '100%',
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
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
  },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    background: 'var(--accent)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-md)', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms ease',
  },
  btnGhostDanger: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
    background: 'rgba(239,68,68,0.06)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },

  workspace: {
    display: 'flex',
    flexDirection: 'row',
    height: 500, // Fixed height workspace
  },
  canvasContainer: {
    flex: 1,
    background: '#1a1c23', // Dark checkerboard-like neutral
    backgroundImage: 'linear-gradient(45deg, #22252e 25%, transparent 25%), linear-gradient(-45deg, #22252e 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #22252e 75%), linear-gradient(-45deg, transparent 75%, #22252e 75%)',
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    overflow: 'hidden',
  },
  canvas: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    cursor: 'move',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    touchAction: 'none', // Prevent browser scrolling while dragging
  },
  canvasHint: {
    position: 'absolute', bottom: 16,
    background: 'rgba(0,0,0,0.7)', color: '#fff',
    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    pointerEvents: 'none',
  },

  inspector: {
    width: 280,
    background: 'var(--bg-surface)',
    borderLeft: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  emptyInspector: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 30, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, height: '100%', gap: 12,
  },
  panel: { padding: 20, display: 'flex', flexDirection: 'column', gap: 16 },
  panelTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 },
  
  inputGroup: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  inputRow: { display: 'flex', gap: 12 },
  label: { fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  textarea: {
    padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
    minHeight: 80, resize: 'vertical', outline: 'none'
  },
  input: {
    padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%'
  },
  select: {
    padding: '8px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: 14, outline: 'none', width: '100%'
  },
  colorPickerWrap: {
    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
    padding: 4, display: 'flex',
  },
  colorInput: {
    border: 'none', width: '100%', height: 30, background: 'transparent', cursor: 'pointer', borderRadius: 4,
  },

  actions: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
  },
  statsText: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' },
};
