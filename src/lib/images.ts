import { Watch } from '../types';

export const FALLBACK_WATCH_IMAGE = 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800';

export function getWatchImages(watch: Pick<Watch, 'image' | 'images'>): string[] {
  const galleryImages = Array.isArray(watch.images)
    ? watch.images.filter((image): image is string => typeof image === 'string' && image.trim().length > 0)
    : [];

  if (galleryImages.length > 0) return galleryImages;
  if (watch.image && watch.image.trim().length > 0) return [watch.image];
  return [FALLBACK_WATCH_IMAGE];
}

export function getWatchCoverImage(watch: Pick<Watch, 'image' | 'images'>): string {
  return getWatchImages(watch)[0] || FALLBACK_WATCH_IMAGE;
}
