export type FileStatus = 'pending' | 'processing' | 'done' | 'error';

export interface ImageFile {
  id: string;
  name: string;
  originalFile: File;
  originalSize: number;
  blob: Blob | null;
  compressedSize: number | null;
  status: FileStatus;
  error?: string;
  /** Actual output filename — .webp if converted, original ext if original was kept */
  webpName: string;
  /**
   * True when the compression engine could not beat the original file size.
   * In this case blob contains the original file bytes unchanged.
   */
  keptOriginal: boolean;
}
