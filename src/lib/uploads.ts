import { apiFetch } from './api';
import { supabase } from './supabase';

export type UploadKind = 'watch' | 'valuation';

interface SignedUploadResponse {
  bucket: string;
  path: string;
  token: string;
}

interface CompressOptions {
  maxDimension?: number;
  quality?: number;
  square?: boolean;
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The image could not be compressed.'))),
      'image/jpeg',
      quality,
    );
  });
}

export async function compressImageFile(file: File, options: CompressOptions = {}): Promise<Blob> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only JPEG, PNG and WEBP images are supported.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('Each original image must be smaller than 12MB.');
  }

  const maxDimension = options.maxDimension ?? 1600;
  const quality = options.quality ?? 0.84;
  const square = options.square ?? false;
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    await image.decode();

    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');

    if (square) {
      const size = Math.max(width, height);
      canvas.width = size;
      canvas.height = size;
    } else {
      canvas.width = width;
      canvas.height = height;
    }

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image compression is not supported in this browser.');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.fillStyle = '#f4f4f5';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const offsetX = Math.round((canvas.width - width) / 2);
    const offsetY = Math.round((canvas.height - height) / 2);
    context.drawImage(image, offsetX, offsetY, width, height);

    return await canvasToBlob(canvas, quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function uploadBlob(blob: Blob, kind: UploadKind): Promise<string> {
  const signed = await apiFetch<SignedUploadResponse>('/api/uploads/sign', {
    method: 'POST',
    body: JSON.stringify({ kind, contentType: 'image/jpeg' }),
  });

  const { error } = await supabase.storage
    .from(signed.bucket)
    .uploadToSignedUrl(signed.path, signed.token, blob, {
      contentType: 'image/jpeg',
      cacheControl: kind === 'watch' ? '31536000' : '3600',
    });

  if (error) throw new Error(error.message || 'Photo upload failed.');

  if (kind === 'watch') {
    return supabase.storage.from(signed.bucket).getPublicUrl(signed.path).data.publicUrl;
  }

  return signed.path;
}

export async function uploadImageFile(
  file: File,
  kind: UploadKind,
  options: CompressOptions = {},
): Promise<{ value: string; previewUrl: string }> {
  const blob = await compressImageFile(file, options);
  const value = await uploadBlob(blob, kind);
  return { value, previewUrl: URL.createObjectURL(blob) };
}

export async function migrateDataImage(dataUrl: string, kind: UploadKind): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) return dataUrl;
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return uploadBlob(blob, kind);
}
