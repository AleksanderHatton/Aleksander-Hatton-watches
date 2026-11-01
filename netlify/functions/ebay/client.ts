import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { HttpError, escapeHtml } from '../_shared';
import { MAX_STOCK_IMAGES } from '../../../src/shared/watch-options';

// Helpers live in a subdirectory without an entrypoint so Netlify does not
// deploy them as publicly callable functions.
export const list = <T = any>(v: T | T[] | undefined | null): T[] => v == null ? [] : Array.isArray(v) ? v : [v];
export const xml = escapeHtml;
export const hash = (s: string) => createHash('sha256').update(s).digest('hex');
export function equal(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function environment() { return process.env.EBAY_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production'; }
export function config() {
  const sandbox = environment() === 'sandbox';
  if (!sandbox && process.env.CONTEXT && !['production', 'dev'].includes(process.env.CONTEXT)) throw new HttpError(503, 'Production eBay actions are disabled in deploy previews and branch deploys.');
  const clientId = process.env.EBAY_CLIENT_ID, secret = process.env.EBAY_CLIENT_SECRET, ruName = process.env.EBAY_RUNAME;
  if (!clientId || !secret || !ruName || !process.env.EBAY_TOKEN_ENCRYPTION_KEY) throw new HttpError(503, 'The eBay connection needs its server settings. See docs/EBAY_SETUP.md.');
  return { clientId, secret, ruName, api: sandbox ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com', auth: sandbox ? 'https://auth.sandbox.ebay.com' : 'https://auth.ebay.com' };
}
function key() {
  const value = process.env.EBAY_TOKEN_ENCRYPTION_KEY || '';
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new HttpError(503, 'EBAY_TOKEN_ENCRYPTION_KEY must be a 64-character hexadecimal key.');
  return Buffer.from(value, 'hex');
}
export function encrypt(value: unknown) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64');
}
export function decrypt(value: string): any {
  const data = Buffer.from(value, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString());
}

export async function exchangeToken(params: Record<string, string>) {
  const c = config();
  const r = await fetch(`${c.api}/identity/v1/oauth2/token`, {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Basic ${Buffer.from(`${c.clientId}:${c.secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  if (!r.ok) throw new HttpError(502, 'eBay authorisation failed. Reconnect the seller account and check the app settings.');
  const tokens = await r.json();
  if (!tokens.access_token) throw new HttpError(502, 'eBay did not return an access token.');
  return tokens;
}
export async function accessToken(db: any) {
  const { data, error } = await db.from('ebay_connection').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  if (!data || data.environment !== environment()) throw new HttpError(503, 'Connect the correct eBay seller account in the dealer console.');
  const tokens = decrypt(data.tokens);
  if (Date.parse(data.access_expires_at) > Date.now() + 90000) return { token: tokens.access_token as string, seller: data.seller_username as string };
  const next = await exchangeToken({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token, scope: 'https://api.ebay.com/oauth/api_scope' });
  const { error: saveError } = await db.from('ebay_connection').update({
    tokens: encrypt({ ...tokens, ...next, refresh_token: next.refresh_token || tokens.refresh_token }),
    access_expires_at: new Date(Date.now() + next.expires_in * 1000).toISOString(),
  }).eq('id', 1);
  if (saveError) throw saveError;
  return { token: next.access_token as string, seller: data.seller_username as string };
}

export class EbayError extends HttpError {
  constructor(public errors: any[], public response: any) {
    super(422, errors.map(e => `${e.ErrorCode || 'eBay'}: ${e.LongMessage || e.ShortMessage || 'Listing rejected'}`).join(' | ').slice(0, 1800));
  }
}
export function parseTradingResponse(text: string, call: string) {
  if (/<!DOCTYPE|<!ENTITY/i.test(text) || XMLValidator.validate(text) !== true) throw new HttpError(502, 'eBay returned an invalid response.');
  const parsed = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, parseTagValue: false, trimValues: true }).parse(text);
  const body = parsed[`${call}Response`];
  if (!body?.Ack) throw new HttpError(502, 'eBay returned an incomplete response.');
  const errors = list(body.Errors).filter(e => e.SeverityCode === 'Error');
  if (errors.length || !['Success', 'Warning'].includes(body.Ack)) throw new EbayError(errors, body);
  return body;
}
export async function trading(token: string, call: string, body: string) {
  const c = config();
  const r = await fetch(`${c.api}/ws/api.dll`, {
    method: 'POST', signal: AbortSignal.timeout(18000),
    headers: { 'Content-Type': 'text/xml; charset=utf-8', 'X-EBAY-API-CALL-NAME': call, 'X-EBAY-API-SITEID': '3', 'X-EBAY-API-COMPATIBILITY-LEVEL': '1487', 'X-EBAY-API-IAF-TOKEN': token },
    body: `<?xml version="1.0" encoding="utf-8"?><${call}Request xmlns="urn:ebay:apis:eBLBaseComponents"><ErrorLanguage>en_GB</ErrorLanguage><WarningLevel>High</WarningLevel>${call === 'GetItem' ? '<DetailLevel>ReturnAll</DetailLevel>' : ''}${body}</${call}Request>`,
  });
  if (!r.ok) throw new HttpError(502, `eBay is unavailable (HTTP ${r.status}). Stock has not been assumed available.`);
  return parseTradingResponse(await r.text(), call);
}
export async function requireOutOfStock(token: string) {
  const r = await trading(token, 'GetUserPreferences', '<ShowOutOfStockControlPreference>true</ShowOutOfStockControlPreference>');
  if (r.OutOfStockControlPreference !== 'true') throw new HttpError(409, 'Enable out-of-stock control in eBay Selling preferences first. This is an account-wide eBay setting; see the setup guide.');
}
export const listingUrl = (id: string) => `https://www.${environment() === 'sandbox' ? 'sandbox.' : ''}ebay.co.uk/itm/${id}`;
export function duplicateItemId(error: unknown): string | null {
  if (!(error instanceof EbayError)) return null;
  for (const e of error.errors) {
    if (e.ErrorCode !== '488') continue;
    const params = list(e.ErrorParameters);
    if (params.find(p => p['@_ParamID'] === '0')?.Value !== '1') return null;
    const id = params.find(p => p['@_ParamID'] === '1')?.Value;
    if (/^\d{8,20}$/.test(id || '')) return id;
  }
  return null;
}

export function readRemote(item: any, seller: string) {
  if (!item || String(item.Seller?.UserID || '').toLowerCase() !== seller.toLowerCase()) throw new HttpError(409, 'The linked eBay listing does not belong to the connected seller.');
  if (item.ListingType !== 'FixedPriceItem' || item.Variations || Number(item.Quantity) > 1) throw new HttpError(409, 'Only single-watch fixed-price listings with quantity one can be linked.');
  const sold = Number(item.SellingStatus?.QuantitySold);
  const quantity = Number(item.Quantity);
  const status = String(item.SellingStatus?.ListingStatus || '');
  if (!Number.isFinite(sold) || !Number.isFinite(quantity) || !status) throw new HttpError(502, 'eBay did not confirm the listing stock.');
  if (!['Active', 'Completed', 'Ended'].includes(status)) throw new HttpError(502, 'The eBay listing status is not recognised. Stock needs checking.');
  return { sold: sold > 0, available: Math.max(0, quantity - sold), ended: status !== 'Active', status };
}
export const verificationXml = (body: string) => body.replace(/<UUID>.*?<\/UUID>|<SKU>.*?<\/SKU>|<InventoryTrackingMethod>.*?<\/InventoryTrackingMethod>/g, '');

export function listingXml(watch: any, link: any, settings: any) {
  const title = String(link.title || `${watch.brand} ${watch.model} ${watch.reference || ''}`).trim();
  if (title.length > 80 || !title) throw new HttpError(400, 'The eBay title must contain 1–80 characters. Set a shorter eBay title for this watch.');
  const price = Number(link.price);
  if (!Number.isFinite(price) || price <= 0 || Math.abs(Math.round(price * 100) - price * 100) > 0.00001) throw new HttpError(400, 'Enter an eBay price with up to two decimal places.');
  if (!watch.condition || !String(watch.description || '').trim()) throw new HttpError(400, 'Add the watch condition and a description before listing on eBay.');
  const photos = [...new Set<string>([...(watch.images || []), watch.image].filter(Boolean))];
  if (!photos.length || photos.length > MAX_STOCK_IMAGES || photos.some(u => !/^https:\/\//i.test(u))) throw new HttpError(400, 'eBay needs 1–12 public HTTPS photographs of this watch.');
  for (const k of ['payment_policy_id', 'return_policy_id', 'shipping_policy_id']) if (!/^\d+$/.test(settings[k] || '')) throw new HttpError(400, 'Save the three eBay business policy IDs first.');
  if (!settings.postcode || !settings.location) throw new HttpError(400, 'Save the actual dispatch town and postcode in eBay settings.');
  const aspects: Record<string, string | string[]> = { ...(link.aspects || {}), Brand: watch.brand, Type: 'Wristwatch' };
  if (watch.reference) aspects['Reference Number'] = watch.reference;
  if (watch.movement) aspects.Movement = watch.movement;
  if (watch.case_size) aspects['Case Size'] = watch.case_size;
  if (watch.dial_colour) aspects['Dial Colour'] = watch.dial_colour;
  if (watch.material) aspects['Case Material'] = watch.material;
  if (watch.box !== 'Unsure') aspects['With Original Box/Packaging'] = watch.box;
  if (watch.papers !== 'Unsure') aspects['With Papers'] = watch.papers;
  // These are all pre-owned grades. Do not map Excellent to New or Like New.
  const specifics = Object.entries(aspects).map(([name, value]) => `<NameValueList><Name>${xml(name)}</Name>${list(value).map(v => `<Value>${xml(v)}</Value>`).join('')}</NameValueList>`).join('');
  const description = `<div><h2>${xml(`${watch.brand} ${watch.model}`)}</h2><p>${xml(watch.description).replace(/\r?\n/g, '<br>')}</p><p>Condition: ${xml(watch.condition)}. Please examine the actual photographs and the description for wear and any faults.</p>${watch.service_notes ? `<p>Service / inspection notes: ${xml(watch.service_notes)}</p>` : ''}${watch.warranty_notes ? `<p>Warranty: ${xml(watch.warranty_notes)}</p>` : ''}</div>`;
  return `<Item><Title>${xml(title)}</Title><Description>${xml(description)}</Description><PrimaryCategory><CategoryID>31387</CategoryID></PrimaryCategory><StartPrice currencyID="GBP">${price.toFixed(2)}</StartPrice><CategoryMappingAllowed>true</CategoryMappingAllowed><Country>GB</Country><Currency>GBP</Currency><ConditionID>3000</ConditionID><ConditionDescription>${xml(String(watch.condition) + '. See the description and photographs for the actual wear and any faults.')}</ConditionDescription><ListingDuration>GTC</ListingDuration><ListingType>FixedPriceItem</ListingType><Location>${xml(settings.location)}</Location><PostalCode>${xml(settings.postcode)}</PostalCode><Quantity>1</Quantity><SKU>${xml(link.sku)}</SKU><InventoryTrackingMethod>SKU</InventoryTrackingMethod><UUID>${xml(link.create_uuid)}</UUID><PictureDetails>${photos.map(u => `<PictureURL>${xml(u)}</PictureURL>`).join('')}</PictureDetails><ItemSpecifics>${specifics}</ItemSpecifics><SellerProfiles><SellerPaymentProfile><PaymentProfileID>${xml(settings.payment_policy_id)}</PaymentProfileID></SellerPaymentProfile><SellerReturnProfile><ReturnProfileID>${xml(settings.return_policy_id)}</ReturnProfileID></SellerReturnProfile><SellerShippingProfile><ShippingProfileID>${xml(settings.shipping_policy_id)}</ShippingProfileID></SellerShippingProfile></SellerProfiles><Site>UK</Site></Item>`;
}
