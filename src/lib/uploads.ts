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

function createUploadId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

async function uploadWatchBlob(blob: Blob): Promise<string> {
  // Admin catalogue uploads do not need a Netlify signing round-trip. The
  // authenticated Supabase session is allowed to INSERT into watch-images by
  // the storage policy in supabase/storage-setup.sql.
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(`Could not verify your login: ${sessionError.message}`);
  if (!sessionData.session) throw new Error('Your admin session has expired. Please log in again.');

  const bucket = 'watch-images';
  const path = `catalogue/${createUploadId()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    // Keep the real Supabase message visible here. This is an authenticated
    // admin-only action and the message is far more useful than a generic 500.
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function uploadValuationBlob(blob: Blob): Promise<string> {
  // Valuation uploads can be submitted by visitors, so they still use a
  // short-lived signed upload token issued by the server and remain private.
  const signed = await apiFetch<SignedUploadResponse>('/api/uploads/sign', {
    method: 'POST',
    body: JSON.stringify({ kind: 'valuation', contentType: 'image/jpeg' }),
  });

  const { error } = await supabase.storage
    .from(signed.bucket)
    .uploadToSignedUrl(signed.path, signed.token, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });

  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return signed.path;
}

async function uploadBlob(blob: Blob, kind: UploadKind): Promise<string> {
  return kind === 'watch' ? uploadWatchBlob(blob) : uploadValuationBlob(blob);
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
