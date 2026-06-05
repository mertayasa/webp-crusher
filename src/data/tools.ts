import {
  Zap,
  Minimize2,
  Maximize2,
  Scaling,
  RefreshCw,
  FileImage,
  ImagePlay,
  Type,
  Crop,
} from 'lucide-react';

export const TOOLS = [
  { id: 'webp-crusher', path: '/webp-crusher', name: 'WebP Crusher', icon: Zap, color: '#8b5cf6', desc: 'Convert PNG & JPG to WebP efficiently' },
  { id: 'compress', path: '/compress', name: 'Compress Image', icon: Minimize2, color: '#10b981', desc: 'Reduce file size without losing quality' },
  { id: 'resize', path: '/resize', name: 'Resize Image', icon: Maximize2, color: '#3b82f6', desc: 'Change dimensions of your images', comingSoon: true },
  { id: 'upscale', path: '/upscale', name: 'Upscale Image', icon: Scaling, color: '#f59e0b', desc: 'Increase resolution with AI', comingSoon: true },
  { id: 'convert', path: '/convert', name: 'Convert Format', icon: RefreshCw, color: '#ef4444', desc: 'Convert between various image formats' },
  { id: 'rotate', path: '/rotate', name: 'Rotate Image', icon: ImagePlay, color: '#06b6d4', desc: 'Rotate or flip your images' },
  { id: 'pdf-to-image', path: '/pdf-to-image', name: 'PDF to Image', icon: FileImage, color: '#ec4899', desc: 'Extract pages from PDF to images', comingSoon: true },
  { id: 'watermark', path: '/watermark', name: 'Watermark Image', icon: Type, color: '#6366f1', desc: 'Add text or logo watermarks' },
  { id: 'crop', path: '/crop', name: 'Crop Image', icon: Crop, color: '#84cc16', desc: 'Crop out unwanted parts of an image' },
];
