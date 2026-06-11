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
  return PATH_TO_VIEW[cleanPath] || 'home';
}

export function pathFromView(view: string) {
  return VIEW_TO_PATH[view] || '/';
}
