export interface TransformOptions {
  degrees: number;
  flipH: boolean;
  flipV: boolean;
}

export function drawTransformedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLCanvasElement,
  options: TransformOptions,
  isJpeg: boolean
) {
  const { degrees, flipH, flipV } = options;

  const rad = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));

  const newWidth = img.width * cos + img.height * sin;
  const newHeight = img.width * sin + img.height * cos;

  ctx.canvas.width = newWidth;
  ctx.canvas.height = newHeight;

  if (isJpeg) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, newWidth, newHeight);
  }

  // Translate to center
  ctx.translate(newWidth / 2, newHeight / 2);

  // Apply rotation
  ctx.rotate(rad);

  // Apply flips
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  // Draw image centered
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
}

export async function processRotateAndExport(
  file: File,
  options: TransformOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas 2D context not available'));

      const isJpeg = file.type === 'image/jpeg';
      drawTransformedImage(ctx, img, options, isJpeg);

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Failed to export blob'));
          resolve(blob);
        },
        file.type,
        0.92 // High quality for JPEG/WebP
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for rotation'));
    };

    img.src = url;
  });
}
