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
  /** Output filename with .webp extension */
  webpName: string;
}
