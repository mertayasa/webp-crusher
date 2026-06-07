import type { CSSProperties } from 'react';
import { Type, Image as ImageIcon } from 'lucide-react';

export type TextPreset = 'cross-single' | 'cross-repeat' | 'center' | 'bottom';
export type Mode = 'text' | 'image';

export interface WatermarkControlsProps {
  mode: Mode;
  setMode: (m: Mode) => void;
  
  // Text Config
  text: string;
  setText: (t: string) => void;
  textPreset: TextPreset;
  setTextPreset: (p: TextPreset) => void;
  textSize: number;
  setTextSize: (s: number) => void;
  textOpacity: number;
  setTextOpacity: (o: number) => void;
  textColor: string;
  setTextColor: (c: string) => void;
  textRotation?: number;
  setTextRotation?: (r: number) => void;

  // Image Config
  wmFile: File | null;
  wmScale: number;
  setWmScale: (s: number) => void;
  wmOpacity: number;
  setWmOpacity: (o: number) => void;
  
  // Dropzone props for the mini image uploader
  getWmRootProps: any;
  getWmInputProps: any;
  isDragWm: boolean;
}

export default function WatermarkControls({
  mode, setMode,
  text, setText, textPreset, setTextPreset, textSize, setTextSize, textOpacity, setTextOpacity, textColor, setTextColor, textRotation, setTextRotation,
  wmFile, wmScale, setWmScale, wmOpacity, setWmOpacity,
  getWmRootProps, getWmInputProps, isDragWm
}: WatermarkControlsProps) {

  return (
    <>
      <div style={s.tabs}>
        <button 
          style={{...s.tabBtn, ...(mode === 'text' ? s.tabBtnActive : {})}}
          onClick={() => setMode('text')}
        >
          <Type size={14} /> Text
        </button>
        <button 
          style={{...s.tabBtn, ...(mode === 'image' ? s.tabBtnActive : {})}}
          onClick={() => setMode('image')}
        >
          <ImageIcon size={14} /> Image
        </button>
      </div>

      <div style={s.settings}>
        {mode === 'text' && (
          <div style={s.settingsGrid}>
            <div style={s.controlGroup}>
              <span style={s.label}>Text</span>
              <input type="text" value={text} onChange={e => setText(e.target.value)} style={s.input} placeholder="e.g. CONFIDENTIAL" />
            </div>
            
            <div style={s.controlGroup}>
              <span style={s.label}>Preset</span>
              <select value={textPreset} onChange={e => setTextPreset(e.target.value as TextPreset)} style={s.input}>
                <option value="cross-single">Cross Pattern – Single</option>
                <option value="cross-repeat">Cross Pattern – Repeated</option>
                <option value="center">Centered</option>
                <option value="bottom">Low Bottom</option>
              </select>
            </div>

            <div style={s.controlGroupRow}>
              <div style={s.controlGroup}>
                <span style={s.label}>Size ({textSize})</span>
                <input type="range" min="10" max="150" value={textSize} onChange={e => setTextSize(Number(e.target.value))} style={s.range} />
              </div>
              <div style={s.controlGroup}>
                <span style={s.label}>Opacity ({Math.round(textOpacity*100)}%)</span>
                <input type="range" min="0.05" max="1" step="0.05" value={textOpacity} onChange={e => setTextOpacity(Number(e.target.value))} style={s.range} />
              </div>
            </div>

            <div style={s.controlGroup}>
              <span style={s.label}>Color</span>
              <div style={s.colorWrap}>
                <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} style={s.colorInput} />
                <span style={s.colorValue}>{textColor.toUpperCase()}</span>
              </div>
            </div>

            {(textPreset === 'cross-single' || textPreset === 'cross-repeat') && textRotation !== undefined && setTextRotation !== undefined && (
              <div style={s.controlGroup}>
                <span style={s.label}>Rotation ({textRotation}°)</span>
                <input type="range" min="-90" max="90" step="15" value={textRotation} onChange={e => setTextRotation(Number(e.target.value))} style={s.range} />
              </div>
            )}
          </div>
        )}

        {mode === 'image' && (
          <div style={s.settingsGrid}>
            <div style={s.controlGroup}>
              <span style={s.label}>Watermark Image (PNG/JPG)</span>
              <div {...getWmRootProps()} style={{...s.miniDropzone, ...(isDragWm ? s.miniDropzoneActive : {})}}>
                <input {...getWmInputProps()} />
                {wmFile ? (
                  <span style={s.miniDropText}>{wmFile.name} (Click to change)</span>
                ) : (
                  <span style={s.miniDropText}>Drag & Drop a logo here</span>
                )}
              </div>
            </div>

            {wmFile && (
              <div style={s.controlGroupRow}>
                <div style={s.controlGroup}>
                  <span style={s.label}>Size ({Math.round(wmScale*100)}%)</span>
                  <input type="range" min="0.05" max="1" step="0.01" value={wmScale} onChange={e => setWmScale(Number(e.target.value))} style={s.range} />
                </div>
                <div style={s.controlGroup}>
                  <span style={s.label}>Opacity ({Math.round(wmOpacity*100)}%)</span>
                  <input type="range" min="0.1" max="1" step="0.05" value={wmOpacity} onChange={e => setWmOpacity(Number(e.target.value))} style={s.range} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const s: Record<string, CSSProperties> = {
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
    display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16,
  },
  settingsGrid: {
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  controlGroup: { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  controlGroupRow: { display: 'flex', gap: 16 },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' },
  input: {
    padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)', color: 'var(--text)', fontSize: 14, outline: 'none',
  },
  colorWrap: { display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' },
  colorInput: { width: 28, height: 28, padding: 0, border: 'none', borderRadius: 4, cursor: 'pointer', background: 'transparent' },
  colorValue: { fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'monospace' },
  range: { accentColor: 'var(--accent)', cursor: 'pointer', width: '100%' },
  
  miniDropzone: {
    border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', padding: '16px',
    textAlign: 'center', cursor: 'pointer', background: 'var(--bg-card)', transition: 'all 150ms ease',
  },
  miniDropzoneActive: { border: '1px dashed var(--accent)', background: 'var(--accent-subtle)' },
  miniDropText: { fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 },
};
