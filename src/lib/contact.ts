export const CONTACT_PHONE_RAW = '07649478871';
export const CONTACT_PHONE_DISPLAY = '07649 478871';
export const CONTACT_PHONE_TEL = `tel:${CONTACT_PHONE_RAW}`;
export const CONTACT_PHONE_INTERNATIONAL = '+447649478871';
export const WHATSAPP_URL = 'https://wa.me/447649478871';
export const CONTACT_EMAIL = 'inquiries@ahwatches.com';

export const VIEW_TO_PATH: Record<string, string> = {
  home: '/',
  shop: '/shop',
  valuation: '/sell-your-watch',
  source: '/source-a-watch',
  contact: '/contact',
  account: '/account',
  admin: '/admin',
};

export const PATH_TO_VIEW: Record<string, string> = {
  '/': 'home',
  '/shop': 'shop',
  '/watches': 'shop',
  '/valuation': 'valuation',
  '/sell': 'valuation',
  '/sell-your-watch': 'valuation',
  '/watch-valuation': 'valuation',
  '/source': 'source',
  '/source-a-watch': 'source',
  '/contact': 'contact',
  '/account': 'account',
  '/admin': 'admin',
};

export function viewFromPath(pathname: string) {
  const cleanPath = pathname.replace(/\/$/, '') || '/';
  if (watchIdFromPath(cleanPath)) return 'shop';
  return PATH_TO_VIEW[cleanPath] || 'home';
}

// Individual watches get real URLs (/watch/:id) so they can be linked,
// shared, indexed by Google and listed in the sitemap.
export function watchIdFromPath(pathname: string): string | null {
  const match = pathname.replace(/\/$/, '').match(/^\/watch\/([A-Za-z0-9-]+)$/);
  return match ? match[1] : null;
}

export function watchPath(watchId: string) {
  return `/watch/${watchId}`;
}

export function pathFromView(view: string) {
  return VIEW_TO_PATH[view] || '/';
}
