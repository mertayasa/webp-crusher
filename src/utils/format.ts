/**
 * Formats bytes to a human-readable string.
 * e.g. 1234567 → "1.18 MB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Calculates percentage savings between original and compressed size.
 * Returns a positive number e.g. 78.4
 */
export function calcSavings(original: number, compressed: number): number {
  if (original === 0) return 0;
  return ((original - compressed) / original) * 100;
}

/**
 * Strips extension and appends .webp
 */
export function toWebpName(filename: string): string {
  return filename.replace(/\.(png|jpe?g)$/i, '') + '.webp';
}
