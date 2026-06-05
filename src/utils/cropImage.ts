import { type PixelCrop } from 'react-image-crop';

export async function processCropAndExport(
  file: File,
  imgRef: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!crop.width || !crop.height) {
      return reject(new Error('Invalid crop dimensions'));
    }

    const scaleX = imgRef.naturalWidth / imgRef.width;
    const scaleY = imgRef.naturalHeight / imgRef.height;

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(crop.width * scaleX);
    canvas.height = Math.floor(crop.height * scaleY);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return reject(new Error('Canvas 2D context not available'));
    }

    const isJpeg = file.type === 'image/jpeg';
    if (isJpeg) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;

    ctx.drawImage(
      imgRef,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Failed to export blob'));
        resolve(blob);
      },
      file.type,
      0.92 // High quality for JPEG/WebP
    );
  });
}
