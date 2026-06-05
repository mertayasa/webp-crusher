export type TextPreset = 'center' | 'bottom' | 'cross';

export interface TextWatermarkConfig {
  text: string;
  size: number;
  color: string;
  opacity: number;
  preset: TextPreset;
}

export interface ImageWatermarkConfig {
  imgRef: HTMLImageElement;
  x: number; // Percent of width 0-100
  y: number; // Percent of height 0-100
  scale: number; // Scale relative to base image width 0-1
  opacity: number;
}

export function drawWatermarkToContext(
  ctx: CanvasRenderingContext2D,
  baseImg: HTMLImageElement,
  w: number,
  h: number,
  isJpeg: boolean,
  mode: 'text' | 'image',
  textConfig?: TextWatermarkConfig,
  imageConfig?: ImageWatermarkConfig
) {
  if (isJpeg) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(baseImg, 0, 0, w, h);

  if (mode === 'text' && textConfig) {
    const { text, size, color, opacity, preset } = textConfig;
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    
    const fontSize = (size / 100) * (Math.min(w, h) / 3); 
    ctx.font = `bold ${fontSize}px sans-serif`;

    if (preset === 'center') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, w / 2, h / 2);
    } else if (preset === 'bottom') {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(text, w - (w * 0.05), h - (h * 0.05));
    } else if (preset === 'cross') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 4);
      
      const stepX = Math.max(ctx.measureText(text).width * 1.5, fontSize * 2);
      const stepY = fontSize * 3;
      
      const diagonal = Math.sqrt(w*w + h*h);
      const limit = diagonal;
      
      for (let x = -limit; x <= limit; x += stepX) {
        for (let y = -limit; y <= limit; y += stepY) {
          ctx.fillText(text, x, y);
        }
      }
      
      ctx.rotate(Math.PI / 4);
      ctx.translate(-w / 2, -h / 2);
    }
  } else if (mode === 'image' && imageConfig) {
    const { imgRef, x, y, scale, opacity } = imageConfig;
    ctx.globalAlpha = opacity;
    
    const wmWidth = w * scale;
    const aspect = imgRef.naturalHeight / imgRef.naturalWidth;
    const wmHeight = wmWidth * aspect;
    
    const px = (x / 100) * w;
    const py = (y / 100) * h;
    
    ctx.drawImage(imgRef, px, py, wmWidth, wmHeight);
  }

  ctx.globalAlpha = 1.0;
}

export async function processWatermarkAndExport(
  file: File,
  baseImg: HTMLImageElement,
  mode: 'text' | 'image',
  textConfig?: TextWatermarkConfig,
  imageConfig?: ImageWatermarkConfig
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = baseImg.naturalWidth;
    canvas.height = baseImg.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas 2D context not available'));

    drawWatermarkToContext(ctx, baseImg, canvas.width, canvas.height, file.type === 'image/jpeg', mode, textConfig, imageConfig);

    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Failed to export blob'));
        resolve(blob);
      },
      file.type,
      0.92
    );
  });
}
