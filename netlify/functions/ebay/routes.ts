import { randomBytes } from 'node:crypto';
import { checkRateLimit, HttpError, json, requireBody } from '../_shared';
import { accessToken, config, encrypt, environment, equal, exchangeToken, hash, readRemote, trading, xml } from './client';
import { checked, linkInput, missingSetup, requirePublishingSettings, saveLink, syncWatch, verifyWatch } from './sync';

function redirect() {
  return { statusCode: 303, headers: { Location: '/admin?ebay=connected', 'Set-Cookie': 'ahw_ebay_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }, body: '' };
}
export async function ebayRoutes(event: any, route: string[], db: any, requester: any) {
  const [action, watchId, operation] = route, method = event.httpMethod;
  if (action === 'callback' && method === 'GET') {
    const q = event.queryStringParameters || {};
    const cookie = String(event.headers?.cookie || event.headers?.Cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('ahw_ebay_state='))?.slice(15) || '';
    if (!q.state || !cookie || !equal(q.state, cookie)) throw new HttpError(400, 'The eBay connection request expired or did not originate in this browser. Start again from the dealer console.');
    const states = await checked(db.from('ebay_oauth_states').delete().eq('state_hash', hash(q.state)).gt('expires_at', new Date().toISOString()).select('user_id'));
    if (states.length !== 1) throw new HttpError(400, 'This eBay connection request was already used or has expired. Start again.');
    const profile = await checked(db.from('profiles').select('role').eq('id', states[0].user_id).single());
    if (!['admin', 'dealer'].includes(profile.role)) throw new HttpError(403, 'Dealer access is no longer available.');
    if (q.error || !q.code) throw new HttpError(400, 'eBay access was not granted. You can reconnect from the dealer console.');
    const tokens = await exchangeToken({ grant_type: 'authorization_code', code: q.code, redirect_uri: config().ruName });
    const user = await trading(tokens.access_token, 'GetUser', '');
    const seller = String(user.User?.UserID || '');
    if (!seller || !tokens.refresh_token) throw new HttpError(502, 'eBay did not return the seller details or refresh token. Start authorisation again.');
    const existing = await checked(db.from('ebay_connection').select('seller_username,environment').eq('id', 1).maybeSingle());
    const linked = await checked(db.from('ebay_listings').select('watch_id').not('item_id', 'is', null).limit(1));
    if (linked.length && existing && (existing.seller_username.toLowerCase() !== seller.toLowerCase() || existing.environment !== environment())) throw new HttpError(409, 'There are already linked listings. Reconnect the same seller and environment to preserve stock synchronisation.');
    await checked(db.from('ebay_connection').upsert({ id: 1, seller_username: seller, environment: environment(), tokens: encrypt(tokens), access_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(), refresh_expires_at: tokens.refresh_token_expires_in ? new Date(Date.now() + tokens.refresh_token_expires_in * 1000).toISOString() : null, connected_at: new Date().toISOString() }));
    return redirect();
  }
  if (!requester.isAdmin) return json(403, { error: 'Admin access required.' });
  if (!action && method === 'GET') {
    const probe = await db.from('ebay_settings').select('*').eq('id', 1).single();
    if (missingSetup(probe.error)) return json(200, { ready: false, configured: false, listings: [], error: 'Run supabase/ebay-integration.sql to enable the eBay controls.' });
    if (probe.error) throw probe.error;
    const connection = await checked(db.from('ebay_connection').select('seller_username,environment,connected_at,refresh_expires_at').eq('id', 1).maybeSingle());
    const listings = await checked(db.from('ebay_listings').select('watch_id,item_id,enabled,price,title,shipping_policy_id,aspects,state,last_error,warnings,last_synced_at').order('created_at', { ascending: false }).limit(1000));
    let configured = true;
    try { config(); encrypt('configuration check'); } catch { configured = false; }
    return json(200, { ready: true, configured, environment: environment(), settings: probe.data, connection, listings });
  }
  if (action === 'connect' && method === 'POST') {
    checkRateLimit(event, 'ebay-connect', 6);
    const c = config(), state = randomBytes(32).toString('hex');
    await checked(db.from('ebay_oauth_states').delete().lt('expires_at', new Date().toISOString()));
    await checked(db.from('ebay_oauth_states').insert({ state_hash: hash(state), user_id: requester.user.id, expires_at: new Date(Date.now() + 600000).toISOString() }));
    const params = new URLSearchParams({ client_id: c.clientId, redirect_uri: c.ruName, response_type: 'code', scope: 'https://api.ebay.com/oauth/api_scope', state });
    const response = json(200, { url: `${c.auth}/oauth2/authorize?${params}` });
    return { ...response, headers: { ...response.headers, 'Set-Cookie': `ahw_ebay_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600` } };
  }
  if (action === 'settings' && method === 'PUT') {
    const body = requireBody(event);
    const markup = Number(body.markup_percent || 0);
    if (!Number.isFinite(markup) || markup < 0 || markup > 100) throw new HttpError(400, 'Enter a default eBay price increase from 0 to 100 percent.');
    const settings = { enabled: body.enabled === true, auto_list_new: body.auto_list_new === true, markup_percent: markup,
      payment_policy_id: String(body.payment_policy_id || '').trim(), return_policy_id: String(body.return_policy_id || '').trim(), shipping_policy_id: String(body.shipping_policy_id || '').trim(),
      postcode: String(body.postcode || '').trim().slice(0, 12), location: String(body.location || '').trim().slice(0, 80),
    };
    if (settings.enabled) { const { token } = await accessToken(db); await requirePublishingSettings(token, settings); }
    await checked(db.from('ebay_settings').update(settings).eq('id', 1));
    return json(200, { ok: true });
  }
  if (action === 'policies' && method === 'POST') {
    checkRateLimit(event, 'ebay-policy-load', 10);
    const itemId = String(requireBody(event).itemId || '');
    if (!/^\d{8,20}$/.test(itemId)) throw new HttpError(400, 'Enter the numeric eBay item ID.');
    const { token, seller } = await accessToken(db);
    const r = await trading(token, 'GetItem', `<ItemID>${xml(itemId)}</ItemID>`);
    readRemote(r.Item, seller);
    const profiles = r.Item.SellerProfiles;
    const payment = profiles?.SellerPaymentProfile?.PaymentProfileID;
    const shipping = profiles?.SellerShippingProfile?.ShippingProfileID;
    const returns = profiles?.SellerReturnProfile?.ReturnProfileID;
    if (!payment || !shipping || !returns) throw new HttpError(409, 'This listing does not use all three business policies. Create policies in Seller Hub or choose another listing.');
    return json(200, { payment_policy_id: String(payment), shipping_policy_id: String(shipping), return_policy_id: String(returns), location: String(r.Item.Location || ''), postcode: String(r.Item.PostalCode || '') });
  }
  if (action === 'listings' && watchId && method === 'POST') {
    checkRateLimit(event, 'ebay-action', 20);
    if (operation === 'verify') return json(200, await verifyWatch(db, watchId));
    if (operation === 'sync') { await syncWatch(db, watchId); return json(200, { ok: true }); }
    if (!operation) { const body = requireBody(event); linkInput(body); await saveLink(db, watchId, body); return json(200, { ok: true }); }
  }
  return json(404, { error: 'eBay route not found.' });
}

