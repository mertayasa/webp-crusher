/**
 * WebP Compression Engine
 *
 * Two modes:
 *  1. compressToWebP(file, quality) — fixed quality (0.0–1.0)
 *  2. compressToTargetBytes(file, targetBytes) — binary search to hit a size target
 *
 * Safety guarantee:
 *   Both functions ALWAYS return a blob smaller than the original file.
 *   If WebP encoding at any setting produces a result >= original size,
 *   the original file bytes are returned as-is (with the original MIME type).
 *   Callers can detect this via: blob.type !== 'image/webp'
 *
 * The binary search strategy:
 *   - Try original dimensions, search quality 0.10–0.92 (8 iterations ≈ <1s)
 *   - If still can't fit, progressively scale dimensions: 1920 → 1280 → 960 → 640
 *   - Last resort: 640px wide at quality 0.10
 *   - Absolute fallback: return original file bytes unchanged
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

// ─── Internal: return original file bytes as a Blob (type-preserving) ─────────

async function originalAsBlob(file: File): Promise<Blob> {
  const buf = await file.arrayBuffer();
  return new Blob([buf], { type: file.type });
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
 * Fixed-quality WebP compression.
 * Strips EXIF automatically via Canvas.
 *
 * If the resulting WebP is >= the original file size, the original
 * file bytes are returned unchanged (blob.type === original MIME type).
 */
export async function compressToWebP(file: File, quality = 0.82): Promise<Blob> {
  const img = await loadImage(file);
  const blob = await drawAndExport(img, quality, undefined);

  // Safety net: never return a file larger than the original
  if (blob.size >= file.size) {
    return originalAsBlob(file);
  }

  return blob;
}

/**
 * Target-size WebP compression.
 *
 * Tries to produce a WebP blob ≤ targetBytes.
 * Also enforces that the result is always smaller than the original file.
 *
 * The effective target is: Math.min(targetBytes, file.size - 1)
 *
 * Progressively reduces quality (binary search) and, if needed,
 * also scales down dimensions until the target is met.
 *
 * If no WebP encoding can beat the original, the original file bytes
 * are returned unchanged (blob.type === original MIME type).
 */
export async function compressToTargetBytes(
  file: File,
  targetBytes: number,
): Promise<Blob> {
  const img = await loadImage(file);

  // Always cap the target at original file size — we must beat the original
  const effectiveTarget = Math.min(targetBytes, file.size - 1);

  // If the source file is already well under target, just do a high-quality pass
  if (file.size < targetBytes * 0.7) {
    const blob = await drawAndExport(img, 0.88, undefined);
    if (blob.size >= file.size) return originalAsBlob(file);
    return blob;
  }

  // Walk through dimension cascade until we hit the effective target
  for (const maxDim of DIM_STEPS) {
    const result = await binarySearch(img, effectiveTarget, maxDim);
    if (result !== null) return result; // guaranteed to be < file.size
  }

  // Last resort: 640px at minimum quality
  const lastResort = await drawAndExport(img, 0.10, 640);

  // Final safety net: if still >= original, return original unchanged
  if (lastResort.size >= file.size) {
    return originalAsBlob(file);
  }

  return lastResort;
}
