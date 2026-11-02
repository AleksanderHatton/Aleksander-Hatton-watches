import { randomUUID } from 'node:crypto';
import { HttpError } from '../_shared';
import { accessToken, duplicateItemId, environment, EbayError, list, listingXml, readRemote, requireOutOfStock, revisionXml, trading, verificationXml, xml } from './client';

export const missingSetup = (e: any) => ['42P01', 'PGRST205', 'PGRST202'].includes(e?.code);
export async function checked(query: any): Promise<any> {
  const r = await query;
  if (r.error) throw r.error;
  return r.data;
}
const getSettings = (db: any) => checked(db.from('ebay_settings').select('*').eq('id', 1).single());
export async function requirePublishingSettings(token: string, settings: any) {
  for (const k of ['payment_policy_id', 'return_policy_id', 'shipping_policy_id']) if (!/^\d+$/.test(settings[k] || '')) throw new HttpError(400, 'Enter all three numeric eBay business policy IDs.');
  if (!settings.location || !settings.postcode) throw new HttpError(400, 'Enter the actual dispatch town and postcode.');
  await requireOutOfStock(token);
}
async function acquire(db: any, watchId: string) {
  const owner = randomUUID();
  const result = await checked(db.rpc('claim_ebay_listing', { p_watch: watchId, p_lock: owner }));
  if (!result) throw new HttpError(409, 'This watch is being synchronised. Try again shortly.');
  return { ...result, owner };
}
async function updateLink(db: any, watchId: string, owner: string, patch: any) {
  const rows = await checked(db.from('ebay_listings').update(patch).eq('watch_id', watchId).eq('lock_token', owner).select('watch_id'));
  if (!rows?.length) throw new HttpError(409, 'The stock synchronisation lease changed. Try again.');
}
async function release(db: any, watchId: string, owner: string) {
  await updateLink(db, watchId, owner, { lock_token: null, lock_until: null });
}
export function linkInput(input: any) {
  if (!input || typeof input !== 'object') throw new HttpError(400, 'Invalid eBay listing settings.');
  const price = Number(input.price);
  if (!Number.isFinite(price) || price <= 0 || Math.abs(price * 100 - Math.round(price * 100)) > 0.00001) throw new HttpError(400, 'Enter a positive eBay price with up to two decimal places.');
  const title = String(input.title || '').trim();
  if (title.length > 80) throw new HttpError(400, 'The eBay title cannot exceed 80 characters.');
  if (!input.aspects || typeof input.aspects !== 'object' || Array.isArray(input.aspects) || Object.keys(input.aspects).length > 40) throw new HttpError(400, 'Enter at most 40 eBay item specifics.');
  const aspects: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.aspects)) {
    if (!k.trim() || k.length > 65 || typeof v !== 'string' || !v.trim() || v.length > 200) throw new HttpError(400, 'Each eBay specific needs a short name and a text value.');
    aspects[k.trim()] = v.trim();
  }
  if (input.existingItemId && !/^\d{8,20}$/.test(input.existingItemId)) throw new HttpError(400, 'Enter the numeric eBay item ID, without a URL.');
  const shippingPolicyId = input.shippingPolicyId === undefined ? undefined : String(input.shippingPolicyId ?? '').trim();
  if (shippingPolicyId && !/^\d{1,20}$/.test(shippingPolicyId)) throw new HttpError(400, 'Enter a numeric eBay postage policy ID, or leave it empty to use the default.');
  return { enabled: input.enabled === true, price, title, aspects, ...(shippingPolicyId === undefined ? {} : { shipping_policy_id: shippingPolicyId || null }) };
}

export async function saveLink(db: any, watchId: string, input: any) {
  const patch = linkInput(input);
  const current = await checked(db.from('ebay_listings').select('*').eq('watch_id', watchId).maybeSingle());
  if (!current && !patch.enabled && !input.existingItemId) return;
  if (current?.lock_until && Date.parse(current.lock_until) > Date.now()) throw new HttpError(409, 'The website watch was saved, but eBay is busy. Reopen it before changing eBay settings.');
  if (current && current.environment !== environment()) throw new HttpError(409, 'This watch is linked to a different eBay environment. Keep its original environment.');
  if (current?.item_id && input.existingItemId && input.existingItemId !== current.item_id) throw new HttpError(409, 'This physical watch already has a different linked eBay listing.');
  let itemId = current?.item_id;
  let state = current?.state || (patch.enabled ? 'queued' : 'draft');
  if (!itemId && input.existingItemId) {
    const { token, seller } = await accessToken(db);
    const r = await trading(token, 'GetItem', `<ItemID>${xml(input.existingItemId)}</ItemID>`);
    const remote = readRemote(r.Item, seller);
    if (remote.sold || remote.ended) throw new HttpError(409, 'Only an unsold, active eBay listing can be linked.');
    itemId = String(r.Item.ItemID);
    state = remote.available ? 'live' : 'paused';
  }
  const row = { ...patch, watch_id: watchId, environment: environment(), item_id: itemId || null, state,
    sku: current?.sku || `AHW-${watchId}`, create_uuid: current?.create_uuid || randomUUID().replaceAll('-', '').toUpperCase(),
    needs_revision: Boolean(itemId), last_synced_at: null, last_error: '',
    desired_revision: Number(current?.desired_revision || 0) + 1,
  };
  // Conditional update prevents a save from replacing a newly acquired lease.
  if (current) {
    const saved = await checked(db.from('ebay_listings').update(row).eq('watch_id', watchId).or(`lock_until.is.null,lock_until.lt.${new Date().toISOString()}`).select('watch_id'));
    if (!saved.length) throw new HttpError(409, 'The watch was saved, but eBay became busy. Reopen it to check eBay settings.');
  } else await checked(db.from('ebay_listings').insert(row));
}

async function remoteItem(token: string, link: any, seller: string) {
  const r = await trading(token, 'GetItem', link.item_id ? `<ItemID>${xml(link.item_id)}</ItemID>` : `<SKU>${xml(link.sku)}</SKU>`);
  return { item: r.Item, remote: readRemote(r.Item, seller) };
}
export function quantityXml(item: any, value: number) {
  const identifier = item.InventoryTrackingMethod === 'SKU' ? `<SKU>${xml(item.SKU)}</SKU>` : `<ItemID>${xml(item.ItemID)}</ItemID>`;
  if (item.InventoryTrackingMethod === 'SKU' && !item.SKU) throw new HttpError(502, 'eBay did not return the inventory SKU.');
  return `<InventoryStatus>${identifier}<Quantity>${value}</Quantity></InventoryStatus>`;
}
async function quantity(token: string, item: any, value: number) {
  await trading(token, 'ReviseInventoryStatus', quantityXml(item, value));
}
async function sale(db: any, watchId: string, itemId: string) {
  const result = await checked(db.rpc('record_ebay_sale', { p_watch: watchId, p_item: itemId }));
  if (result?.conflict) throw new HttpError(409, 'An eBay purchase conflicts with a website checkout. Check both eBay and Stripe before fulfilment.');
}
export async function verifyWatch(db: any, watchId: string) {
  const link = await checked(db.from('ebay_listings').select('*').eq('watch_id', watchId).single());
  const watch = await checked(db.from('watches').select('*').eq('id', watchId).single());
  const settings = await getSettings(db);
  const { token } = await accessToken(db);
  await requireOutOfStock(token);
  const r = await trading(token, 'VerifyAddFixedPriceItem', verificationXml(listingXml(watch, link, settings)));
  return { warnings: list(r.Errors).map(e => e.LongMessage || e.ShortMessage), fees: list(r.Fees?.Fee).filter(f => Number(f.Fee?.['#text'] ?? f.Fee) > 0).map(f => ({ name: f.Name, amount: f.Fee?.['#text'] ?? f.Fee })) };
}

export async function syncWatch(db: any, watchId: string) {
  const job = await acquire(db, watchId);
  const { watch, listing: link, owner } = job;
  try {
    if (link.environment !== environment()) return;
    const settings = await getSettings(db);
    const { token, seller } = await accessToken(db);
    let itemId = link.item_id;
    // Reconcile an ambiguous Add response by the stable SKU before retrying the
    // same UUID. Even a lost database write cannot create a duplicate listing.
    if (!itemId && link.creation_attempted) {
      try { const found = await remoteItem(token, link, seller); itemId = String(found.item.ItemID); }
      catch (e) { if (!(e instanceof EbayError && e.errors.some(x => x.ErrorCode === '21916270'))) throw e; }
      if (itemId) await updateLink(db, watchId, owner, { item_id: itemId });
    }
    if (!itemId) {
      if (!link.enabled || !settings.enabled || watch.status !== 'Available') return;
      await requireOutOfStock(token);
      const body = listingXml(watch, link, settings);
      const verify = await trading(token, 'VerifyAddFixedPriceItem', verificationXml(body));
      const warnings = list(verify.Errors).map(e => e.LongMessage || e.ShortMessage);
      await updateLink(db, watchId, owner, { creation_attempted: true });
      try { const r = await trading(token, 'AddFixedPriceItem', body); itemId = String(r.ItemID || ''); }
      catch (e) { itemId = duplicateItemId(e); if (!itemId) throw e; }
      if (!/^\d{8,20}$/.test(itemId)) throw new HttpError(502, 'eBay did not confirm the new item ID. The same SKU and UUID will be checked on retry.');
      await updateLink(db, watchId, owner, { item_id: itemId, state: 'live', needs_revision: false, warnings, last_error: '' });
    }
    const { item, remote } = await remoteItem(token, { ...link, item_id: itemId }, seller);
    if (remote.sold) { await sale(db, watchId, itemId); return; }
    if (remote.ended) {
      await updateLink(db, watchId, owner, { state: 'ended', last_error: 'This listing ended on eBay. It will not be relisted automatically.' });
      return;
    }
    const currentWatch = await checked(db.from('watches').select('*').eq('id', watchId).single());
    const shouldSell = link.enabled && currentWatch.status === 'Available';
    if (!shouldSell) {
      if (remote.available > 0) { await requireOutOfStock(token); await quantity(token, item, 0); }
      const check = await remoteItem(token, { ...link, item_id: itemId }, seller);
      if (check.remote.sold) { await sale(db, watchId, itemId); return; }
      if (check.remote.available > 0) throw new HttpError(502, 'eBay has not confirmed that this watch is unavailable.');
      await updateLink(db, watchId, owner, { state: 'paused', paused_by_us: link.paused_by_us || remote.available > 0, last_error: '' });
      return;
    }
    // Never undo a manual Seller Hub pause. Only restore quantity that this
    // integration previously paused (for example after an expired checkout).
    if (remote.available === 0 && !link.paused_by_us) {
      await updateLink(db, watchId, owner, { state: 'paused', last_error: 'Paused in eBay. Resume it in Seller Hub when you intend to sell again.' });
      return;
    }
    if (link.needs_revision && settings.enabled) {
      const revised = revisionXml(currentWatch, link, settings, item);
      const r = await trading(token, 'ReviseFixedPriceItem', revised);
      await updateLink(db, watchId, owner, { needs_revision: false, warnings: list(r.Errors).map(e => e.LongMessage || e.ShortMessage) });
    }
    if (remote.available === 0 && link.paused_by_us) await quantity(token, item, 1);
    await updateLink(db, watchId, owner, { state: 'live', paused_by_us: false, last_error: '' });
  } catch (e) {
    const message = e instanceof HttpError ? e.message : 'eBay synchronisation failed. Check the connection and server logs.';
    await updateLink(db, watchId, owner, { state: message.includes('conflicts with a website') ? 'needs_review' : 'error', last_error: message });
    throw e;
  } finally {
    const finished = await checked(db.rpc('finish_ebay_sync', { p_watch: watchId, p_lock: owner, p_revision: Number(link.desired_revision || 0) }));
    if (!finished) throw new HttpError(409, 'The stock job was superseded. A newer change will be checked.');
  }
}

// Run after the local reservation and BEFORE creating a payable Stripe session.
export async function pauseForCheckout(db: any, watchId: string) {
  const lookup = await db.from('ebay_listings').select('*').eq('watch_id', watchId).maybeSingle();
  if (missingSetup(lookup.error)) return; // photo/condition upgrade can run alone
  if (lookup.error) throw lookup.error;
  if (!lookup.data) return;
  const { listing: link, owner } = await acquire(db, watchId);
  try {
    if (!link.item_id && !link.creation_attempted) return;
    const { token, seller } = await accessToken(db);
    const { item, remote } = await remoteItem(token, link, seller);
    const itemId = String(item.ItemID);
    if (!link.item_id) await updateLink(db, watchId, owner, { item_id: itemId });
    if (remote.sold) throw new HttpError(409, 'This watch has been purchased on eBay. Payment has not been started.');
    if (!remote.ended && remote.available > 0) { await requireOutOfStock(token); await quantity(token, item, 0); }
    const confirm = await remoteItem(token, { ...link, item_id: itemId }, seller);
    if (confirm.remote.sold) throw new HttpError(409, 'This watch has been purchased on eBay. Payment has not been started.');
    if (!confirm.remote.ended && confirm.remote.available > 0) throw new HttpError(503, 'We could not confirm availability. Please try again shortly or contact us.');
    await updateLink(db, watchId, owner, { state: remote.ended ? 'ended' : 'paused', paused_by_us: link.paused_by_us || (!remote.ended && remote.available > 0), last_error: '' });
  } catch (e) {
    await updateLink(db, watchId, owner, { last_error: 'Website checkout stopped because eBay stock could not be confirmed.' });
    throw e;
  } finally { await release(db, watchId, owner); }
}

// One account-level request per minute instead of one request per watch. Only
// listing IDs and pagination are requested; no buyer details are stored.
export async function pollSales(token: string, from: string, to: string) {
  const ids = new Set<string>();
  for (let page = 1; page <= 20; page++) {
    const r = await trading(token, 'GetSellerTransactions', `<ModTimeFrom>${xml(from)}</ModTimeFrom><ModTimeTo>${xml(to)}</ModTimeTo><Pagination><EntriesPerPage>200</EntriesPerPage><PageNumber>${page}</PageNumber></Pagination><OutputSelector>TransactionArray.Transaction.Item.ItemID</OutputSelector><OutputSelector>HasMoreTransactions</OutputSelector><OutputSelector>PaginationResult</OutputSelector>`);
    for (const t of list(r.TransactionArray?.Transaction)) if (t.Item?.ItemID) ids.add(String(t.Item.ItemID));
    if (r.HasMoreTransactions !== 'true' && Number(r.PaginationResult?.TotalNumberOfPages || 0) <= page) return ids;
  }
  throw new HttpError(503, 'The sales check exceeded 4,000 changed order lines. Increase the batching window or review the account volume.');
}
async function activeSnapshot(token: string) {
  const items = new Map<string, any>();
  for (let page = 1; page <= 20; page++) {
    const r = await trading(token, 'GetMyeBaySelling', `<ActiveList><Include>true</Include><Pagination><EntriesPerPage>200</EntriesPerPage><PageNumber>${page}</PageNumber></Pagination></ActiveList><SoldList><Include>false</Include></SoldList><UnsoldList><Include>false</Include></UnsoldList><OutputSelector>ActiveList.ItemArray.Item.ItemID</OutputSelector><OutputSelector>ActiveList.ItemArray.Item.QuantityAvailable</OutputSelector><OutputSelector>ActiveList.PaginationResult</OutputSelector>`);
    for (const item of list(r.ActiveList?.ItemArray?.Item)) items.set(String(item.ItemID), item);
    if (Number(r.ActiveList?.PaginationResult?.TotalNumberOfPages || 0) <= page) return items;
  }
  throw new HttpError(503, 'More than 4,000 active listings need a larger stock reconciliation batch.');
}
export async function runSync(db: any) {
  const now = Date.now(), timestamp = new Date(now).toISOString();
  await checked(db.from('ebay_settings').update({ last_worker_at: timestamp }).eq('id', 1));
  const settings = await getSettings(db);
  const rows = await checked(db.from('ebay_listings').select('*')
    .eq('environment', environment()).not('state', 'in', '(sold,ended)').or('enabled.eq.true,item_id.not.is.null,creation_attempted.eq.true')
    .order('last_synced_at', { ascending: true, nullsFirst: true }).limit(1000));
  if (!rows.length) return [];
  const watches = await checked(db.from('watches').select('id,status').in('id', rows.map((r: any) => r.watch_id)));
  const stock = new Map<string, any>(watches.map((w: any) => [w.id, w]));
  let sales = new Set<string>(), active: Map<string, any> | undefined;
  try {
    const { token } = await accessToken(db);
    const since = Math.max(now - 30 * 86400000 + 1000, Date.parse(settings.last_sales_check_at || new Date(now - 7 * 86400000).toISOString()) - 5 * 60000);
    sales = await pollSales(token, new Date(since).toISOString(), timestamp);
    await checked(db.from('ebay_settings').update({ last_sales_check_at: timestamp, worker_error: '' }).eq('id', 1));
    // A bulk snapshot detects manual ends/stock changes without polling every
    // watch. Large accounts paginate; ordinary watch stock needs one call.
    if (!settings.last_active_check_at || now - Date.parse(settings.last_active_check_at) >= 10 * 60000) {
      active = await activeSnapshot(token);
      await checked(db.from('ebay_settings').update({ last_active_check_at: timestamp }).eq('id', 1));
    }
  } catch (e) {
    const error = e instanceof HttpError ? e.message : 'The eBay account sales check failed. Reconnect the seller or check server logs.';
    await checked(db.from('ebay_settings').update({ worker_error: error }).eq('id', 1));
    // Pending stock removals still get a chance even if sales polling failed.
  }
  const pending = rows.filter((r: any) => {
    const w = stock.get(r.watch_id), age = now - Date.parse(r.last_synced_at || '1970-01-01');
    if (sales.has(r.item_id)) return true;
    if (active && r.item_id) {
      const remote = active.get(r.item_id);
      if (!remote) return true;
      const quantity = Number(remote.QuantityAvailable);
      if (Number.isFinite(quantity)) {
        if (quantity > 0 && (w?.status !== 'Available' || !r.enabled || r.state === 'paused')) return true;
        if (quantity === 0 && w?.status === 'Available' && r.enabled && r.state !== 'paused') return true;
      }
    }
    if (!r.last_synced_at) return true;
    if (['error','needs_review'].includes(r.state)) return age >= 15 * 60000;
    if (!r.item_id && r.enabled && settings.enabled && w?.status === 'Available') return true;
    return r.needs_revision && r.enabled && settings.enabled && w?.status === 'Available';
  }).slice(0, 100);
  // Bounded concurrency; row leases prevent overlapping scheduled/manual work.
  let next = 0;
  const results: any[] = [];
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (next < pending.length) {
      const row = pending[next++];
      try { await syncWatch(db, row.watch_id); results.push({ id: row.watch_id, ok: true }); }
      catch (e) { results.push({ id: row.watch_id, ok: false }); console.error('eBay sync needs attention', row.watch_id, e instanceof HttpError ? e.message : 'Database or network error'); }
    }
  }));
  return results;
}

