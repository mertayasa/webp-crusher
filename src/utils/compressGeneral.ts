/**
 * General Image Compression Engine
 *
 * Supports exporting to image/jpeg, image/webp, image/avif.
 */

const DIM_STEPS: Array<number | undefined> = [undefined, 1920, 1280, 960, 640];

function drawAndExport(
  img: HTMLImageElement,
  quality: number,
  maxDimension: number | undefined,
  mimeType: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let w = img.naturalWidth;
    let h = img.naturalHeight;

    if (maxDimension && (w > maxDimension || h > maxDimension)) {
      const ratio = Math.min(maxDimension / w, maxDimension / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get 2D context'));
      return;
    }

    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }
    
    ctx.drawImage(img, 0, 0, w, h);

    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
      mimeType,
      quality,
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load: ${file.name}`));
    };
    img.src = url;
  });
}

async function originalAsBlob(file: File): Promise<Blob> {
  const buf = await file.arrayBuffer();
  return new Blob([buf], { type: file.type });
}

async function binarySearch(
  img: HTMLImageElement,
  targetBytes: number,
  maxDimension: number | undefined,
  mimeType: string,
  iterations = 8,
): Promise<Blob | null> {
  let lo = 0.10;
  let hi = 0.92;
  let best: Blob | null = null;

  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    const blob = await drawAndExport(img, mid, maxDimension, mimeType);

    if (blob.size <= targetBytes) {
      best = blob;
      lo = mid; 
    } else {
      hi = mid; 
    }
  }

  return best;
}

export async function compressToFormat(file: File, mimeType: string, quality = 0.82): Promise<Blob> {
  const img = await loadImage(file);
  const blob = await drawAndExport(img, quality, undefined, mimeType);

  if (blob.size >= file.size && blob.type === file.type) {
    return originalAsBlob(file);
  }

  return blob;
}

export async function compressToTargetBytesFormat(
  file: File,
  targetBytes: number,
  mimeType: string,
): Promise<Blob> {
  const img = await loadImage(file);

  const effectiveTarget = Math.min(targetBytes, file.size - 1);

  if (file.size < targetBytes * 0.7) {
    const blob = await drawAndExport(img, 0.88, undefined, mimeType);
    if (blob.size >= file.size && blob.type === file.type) return originalAsBlob(file);
    return blob;
  }

  for (const maxDim of DIM_STEPS) {
    const result = await binarySearch(img, effectiveTarget, maxDim, mimeType);
    if (result !== null) return result; 
  }

  const lastResort = await drawAndExport(img, 0.10, 640, mimeType);

  if (lastResort.size >= file.size && lastResort.type === file.type) {
    return originalAsBlob(file);
  }

  return lastResort;
}
