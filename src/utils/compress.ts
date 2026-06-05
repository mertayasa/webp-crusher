/**
 * WebP Compression Engine
 *
 * Two modes:
 *  1. compressToWebP(file, quality) — fixed quality (0.0–1.0)
 *  2. compressToTargetBytes(file, targetBytes) — binary search to hit a size target
 *
 * The binary search strategy:
 *   - Try original dimensions, search quality 0.10–0.92 (8 iterations ≈ <1s)
 *   - If still can't fit, progressively scale dimensions: 1920 → 1280 → 960 → 640
 *   - Last resort: 640px wide at quality 0.10
 */

// Dimension cascade used when target size is set
const DIM_STEPS: Array<number | undefined> = [undefined, 1920, 1280, 960, 640];

// ─── Internal: draw image onto canvas and export as WebP blob ─────────────────

function drawAndExport(
  img: HTMLImageElement,
  quality: number,
  maxDimension: number | undefined,
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

    // White fill for transparent PNGs (avoids dark bleed in WebP)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('toBlob returned null'))),
      'image/webp',
      quality,
    );
  });
}

// ─── Internal: load a File into an HTMLImageElement ───────────────────────────

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

// ─── Internal: binary search quality for a given dimension cap ───────────────

async function binarySearch(
  img: HTMLImageElement,
  targetBytes: number,
  maxDimension: number | undefined,
  iterations = 8,
): Promise<Blob | null> {
  let lo = 0.10;
  let hi = 0.92;
  let best: Blob | null = null;

  for (let i = 0; i < iterations; i++) {
    const mid = (lo + hi) / 2;
    const blob = await drawAndExport(img, mid, maxDimension);

    if (blob.size <= targetBytes) {
      best = blob;
      lo = mid; // fits — try higher quality
    } else {
      hi = mid; // too big — need lower quality
    }
  }

  return best;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fixed-quality WebP compression (original behaviour).
 * Strips EXIF automatically via Canvas.
 */
export async function compressToWebP(file: File, quality = 0.82): Promise<Blob> {
  const img = await loadImage(file);
  return drawAndExport(img, quality, undefined);
}

/**
 * Target-size WebP compression.
 *
 * Tries to produce a WebP blob ≤ targetBytes.
 * Progressively reduces quality (binary search) and, if needed,
 * also scales down dimensions until the target is met.
 *
 * Returns the best result even if the target couldn't be reached.
 */
export async function compressToTargetBytes(
  file: File,
  targetBytes: number,
): Promise<Blob> {
  const img = await loadImage(file);

  // If the source file is already well under target, just do a quality pass
  if (file.size < targetBytes * 0.7) {
    return drawAndExport(img, 0.88, undefined);
  }

  // Walk through dimension cascade until we hit the target
  for (const maxDim of DIM_STEPS) {
    const result = await binarySearch(img, targetBytes, maxDim);
    if (result !== null) return result;
  }

  // Absolute last resort: 640px at minimum quality
  return drawAndExport(img, 0.10, 640);
}
