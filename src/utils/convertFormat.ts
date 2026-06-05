export type SupportedFormat = 'png' | 'jpg' | 'webp' | 'avif' | 'svg';

const FORMAT_MIME_TYPES: Record<SupportedFormat, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
};

export async function convertImageFormat(
  file: File,
  targetFormat: SupportedFormat,
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Canvas 2D context not available'));
      }

      // Fill with white background in case of transparency -> jpg conversion
      if (targetFormat === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      // SVG special case: wrap a base64 png in an SVG tag
      if (targetFormat === 'svg') {
        const dataUrl = canvas.toDataURL('image/png');
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
  <image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}" />
</svg>`;
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        return resolve(blob);
      }

      const mimeType = FORMAT_MIME_TYPES[targetFormat];
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error(`Browser might not support converting to ${mimeType}`));
          }
          resolve(blob);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for conversion'));
    };

    img.src = url;
  });
}

export function getNewFilename(originalName: string, targetFormat: SupportedFormat): string {
  const lastDot = originalName.lastIndexOf('.');
  const base = lastDot !== -1 ? originalName.slice(0, lastDot) : originalName;
  const ext = targetFormat === 'jpg' ? 'jpg' : targetFormat;
  return `${base}.${ext}`;
}
