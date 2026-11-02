import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { accessToken, decrypt, encrypt, listingXml, parseTradingResponse, readRemote, revisionXml, verificationXml } from '../netlify/functions/ebay/client';
import { fromWatch } from '../netlify/functions/_shared';
import { linkInput, pauseForCheckout, pollSales, quantityXml, runSync, saveLink, syncWatch } from '../netlify/functions/ebay/sync';
import { ebayRoutes } from '../netlify/functions/ebay/routes';

process.env.EBAY_CLIENT_ID = 'synthetic-client';
process.env.EBAY_CLIENT_SECRET = 'synthetic-secret';
process.env.EBAY_RUNAME = 'synthetic-runame';
process.env.EBAY_TOKEN_ENCRYPTION_KEY = 'a'.repeat(64);
process.env.EBAY_ENVIRONMENT = 'sandbox';
const id = '11111111-1111-4111-8111-111111111111', itemId = '123456789012';
const watch = { id, brand: 'TAG Heuer', model: 'Aquaracer', reference: 'CAF7010', price: 600, status: 'Available', condition: 'Great', description: 'Actual watch. Wear <script>alert(1)</script>', images: Array.from({ length: 12 }, (_, i) => `https://example.com/${i}.jpg`), box: 'Yes', papers: 'No' };
const link = { watch_id: id, sku: `AHW-${id}`, create_uuid: '1'.repeat(32), enabled: true, price: 650.1, title: '', aspects: { Department: 'Unisex Adults' }, item_id: itemId, state: 'live', creation_attempted: true, environment: 'sandbox', needs_revision: false, paused_by_us: false };
const settings = { id: 1, enabled: true, payment_policy_id: '1', shipping_policy_id: '2', return_policy_id: '3', location: 'Sheffield', postcode: 'S1 1AA' };

test('twelve photographs, pre-owned conditions and safe XML; reject thirteen', () => {
  const body = listingXml(watch, link, settings);
  assert.equal((body.match(/<PictureURL>/g) || []).length, 12);
  assert.match(body, /<ConditionID>3000<\/ConditionID>/);
  assert.doesNotMatch(body, /<script>/);
  assert.match(body, /650\.10/);
  assert.doesNotMatch(verificationXml(body), /<UUID>|<SKU>|<InventoryTrackingMethod>/);
  assert.throws(() => listingXml({ ...watch, images: [...watch.images, 'https://example.com/13.jpg'] }, link, settings), /1–12/);
  assert.throws(() => fromWatch({ ...watch, images: [...watch.images, 'https://example.com/13.jpg'] }), /up to 12/);
  assert.equal(fromWatch(watch).images.length, 12);
  assert.throws(() => listingXml(watch, { ...link, title: 'x'.repeat(81) }, settings), /1–80/);
});

test('encrypted seller tokens reject tampering and XML parser rejects entities', () => {
  const cipher = encrypt({ refresh_token: 'synthetic-refresh' });
  assert.doesNotMatch(cipher, /synthetic-refresh/);
  assert.equal(decrypt(cipher).refresh_token, 'synthetic-refresh');
  const raw = Buffer.from(cipher, 'base64'); raw[raw.length - 1] ^= 1;
  assert.throws(() => decrypt(raw.toString('base64')));
  assert.throws(() => parseTradingResponse('<!DOCTYPE x [<!ENTITY secret "bad">]><GetItemResponse/>', 'GetItem'), /invalid/);
  assert.throws(() => parseTradingResponse('<GetItemResponse><Ack>Failure</Ack><Errors><ErrorCode>17</ErrorCode><SeverityCode>Error</SeverityCode><LongMessage>Missing Department</LongMessage></Errors></GetItemResponse>', 'GetItem'), /Missing Department/);
});

test('stock mutation uses the correct eBay inventory identifier', () => {
  assert.match(quantityXml({ ItemID: itemId, SKU: 'test', InventoryTrackingMethod: 'SKU' }, 0), /<SKU>test<\/SKU><Quantity>0/);
  assert.doesNotMatch(quantityXml({ ItemID: itemId, SKU: 'test', InventoryTrackingMethod: 'SKU' }, 0), /ItemID/);
  assert.match(quantityXml({ ItemID: itemId }, 0), /<ItemID>/);
  assert.throws(() => readRemote({ Seller: { UserID: 'other' } }, 'seller'), /does not belong/);
});

// Minimal Supabase boundary fake: remote HTTP behaviour is exercised below;
// actual PostgreSQL leases, grants and stock transactions are tested separately.
function fakeDb(options: any = {}) {
  const data: any = { watches: [{ ...watch, ...options.watch }], ebay_listings: [{ ...link, ...options.link }], ebay_settings: [settings], ebay_connection: [{ id: 1, environment: 'sandbox', seller_username: 'seller', tokens: encrypt({ access_token: 'synthetic-token', refresh_token: 'synthetic-refresh' }), access_expires_at: new Date(Date.now() + 3600000).toISOString() }] };
  const db: any = {
    data,
    from(table: string) {
      let patch: any, operation = 'read', single = false;
      const filters: ((r: any) => boolean)[] = [];
      const q: any = {
        select() { return q; }, eq(k: string, v: any) { filters.push(r => r[k] === v); return q; },
        in(k: string, values: any[]) { filters.push(r => values.includes(r[k])); return q; },
        not() { return q; }, or() { return q; }, order() { return q; }, limit() { return q; },
        update(p: any) { patch = p; operation = 'update'; return q; },
        maybeSingle() { single = true; return q; }, single() { single = true; return q; },
        then(resolve: any, reject: any) {
          try {
            const rows = data[table].filter((r: any) => filters.every(f => f(r)));
            if (operation === 'update') rows.forEach((r: any) => Object.assign(r, patch));
            return Promise.resolve({ data: single ? rows[0] || null : rows, error: null }).then(resolve, reject);
          } catch (e) { return Promise.reject(e).then(resolve, reject); }
        },
      }; return q;
    },
    async rpc(name: string, params: any) {
      if (name === 'claim_ebay_listing') {
        data.ebay_listings[0].lock_token = params.p_lock;
        return { data: { watch: { ...data.watches[0] }, listing: { ...data.ebay_listings[0] } }, error: null };
      }
      if (name === 'record_ebay_sale') { data.watches[0].status = 'Sold'; data.ebay_listings[0].state = 'sold'; return { data: { conflict: false }, error: null }; }
      if (name === 'finish_ebay_sync') { Object.assign(data.ebay_listings[0], { lock_token: null, lock_until: null, last_synced_at: new Date().toISOString() }); return { data: true, error: null }; }
      throw Error(`Unexpected RPC ${name}`);
    },
  };
  return db;
}
const envelope = (call: string, body = '') => new Response(`<${call}Response xmlns="urn:ebay:apis:eBLBaseComponents"><Ack>Success</Ack>${body}</${call}Response>`, { status: 200 });
const remoteXml = (quantity: number, sold = 0) => `<Item><ItemID>${itemId}</ItemID><SKU>AHW-${id}</SKU><InventoryTrackingMethod>SKU</InventoryTrackingMethod><ListingType>FixedPriceItem</ListingType><Quantity>${quantity}</Quantity><Seller><UserID>seller</UserID></Seller><SellingStatus><ListingStatus>Active</ListingStatus><QuantitySold>${sold}</QuantitySold></SellingStatus></Item>`;
async function withFetch(fn: typeof fetch, run: () => Promise<void>) { const original = globalThis.fetch; globalThis.fetch = fn; try { await run(); } finally { globalThis.fetch = original; } }

test('website checkout pauses eBay and confirms stock before returning', async () => {
  const calls: string[] = []; let quantity = 1;
  await withFetch(async (_url, init) => {
    const call = new Headers(init?.headers).get('X-EBAY-API-CALL-NAME')!; calls.push(call);
    if (call === 'GetItem') return envelope(call, remoteXml(quantity));
    if (call === 'GetUserPreferences') return envelope(call, '<OutOfStockControlPreference>true</OutOfStockControlPreference>');
    if (call === 'ReviseInventoryStatus') { assert.match(String(init?.body), /<SKU>/); quantity = 0; return envelope(call); }
    throw Error(`Unexpected ${call}`);
  }, async () => {
    const db = fakeDb({ watch: { status: 'Reserved' } });
    await pauseForCheckout(db, id);
    assert.equal(db.data.ebay_listings[0].paused_by_us, true);
    assert.equal(db.data.ebay_listings[0].lock_token, null);
  });
  assert.deepEqual(calls, ['GetItem', 'GetUserPreferences', 'ReviseInventoryStatus', 'GetItem']);
});

test('checkout fails closed when eBay cannot confirm a pause or a purchase wins', async () => {
  for (const purchase of [false, true]) {
    await withFetch(async (_url, init) => {
      const call = new Headers(init?.headers).get('X-EBAY-API-CALL-NAME')!;
      if (call === 'GetItem') return envelope(call, remoteXml(1, purchase ? 1 : 0));
      if (call === 'GetUserPreferences') return envelope(call, '<OutOfStockControlPreference>false</OutOfStockControlPreference>');
      throw Error('Stock must not be mutated');
    }, async () => { const db = fakeDb(); await assert.rejects(pauseForCheckout(db, id), purchase ? /purchased on eBay/ : /out-of-stock/); assert.equal(db.data.ebay_listings[0].lock_token, null); });
  }
});

test('a lost Add response recovers the existing listing by SKU without a duplicate', async () => {
  let adds = 0, created = false;
  const db = fakeDb({ link: { item_id: null, state: 'queued', creation_attempted: false } });
  await withFetch(async (_url, init) => {
    const call = new Headers(init?.headers).get('X-EBAY-API-CALL-NAME')!;
    if (call === 'GetUserPreferences') return envelope(call, '<OutOfStockControlPreference>true</OutOfStockControlPreference>');
    if (call === 'VerifyAddFixedPriceItem') return envelope(call);
    if (call === 'AddFixedPriceItem') { adds++; created = true; throw Error('Simulated response lost after eBay accepted the listing'); }
    if (call === 'GetItem' && created) return envelope(call, remoteXml(1));
    throw Error(`Unexpected ${call}`);
  }, async () => {
    await assert.rejects(syncWatch(db, id), /response lost/);
    assert.equal(db.data.ebay_listings[0].creation_attempted, true);
    await syncWatch(db, id);
    assert.equal(db.data.ebay_listings[0].item_id, itemId);
    assert.equal(db.data.ebay_listings[0].state, 'live');
  });
  assert.equal(adds, 1);
});

test('scheduled checks retain Seller Hub content edits and manual stock pauses', async () => {
  for (const quantity of [0, 1]) {
    const calls: string[] = [];
    await withFetch(async (_url, init) => {
      const call = new Headers(init?.headers).get('X-EBAY-API-CALL-NAME')!; calls.push(call);
      if (call !== 'GetItem') throw Error('Unchanged/manual stock must not be overwritten');
      return envelope(call, remoteXml(quantity));
    }, async () => { const db = fakeDb(); await syncWatch(db, id); assert.equal(db.data.ebay_listings[0].state, quantity ? 'live' : 'paused'); });
    assert.deepEqual(calls, ['GetItem']);
  }
});

test('new listings use each watch postage policy in verification and publication', async () => {
  // The policies represent buyer-paid £5 and £20 services configured on eBay.
  for (const policyId of ['500', '2000']) {
    const calls: string[] = [];
    await withFetch(async (_url, init) => {
      const call = new Headers(init?.headers).get('X-EBAY-API-CALL-NAME')!;
      if (call === 'GetUserPreferences') return envelope(call, '<OutOfStockControlPreference>true</OutOfStockControlPreference>');
      if (['VerifyAddFixedPriceItem', 'AddFixedPriceItem'].includes(call)) {
        calls.push(call);
        const body = String(init?.body);
        assert.match(body, new RegExp(`<ShippingProfileID>${policyId}</ShippingProfileID>`));
        assert.doesNotMatch(body, /<ShippingProfileID>2<\/ShippingProfileID>/);
        return envelope(call, call === 'AddFixedPriceItem' ? `<ItemID>${itemId}</ItemID>` : '');
      }
      if (call === 'GetItem') return envelope(call, remoteXml(1));
      throw Error(`Unexpected ${call}`);
    }, async () => {
      const db = fakeDb({ link: { item_id: null, state: 'queued', creation_attempted: false, shipping_policy_id: policyId } });
      await syncWatch(db, id);
      assert.equal(db.data.ebay_listings[0].state, 'live');
      assert.equal(db.data.ebay_settings[0].shipping_policy_id, '2');
    });
    assert.deepEqual(calls, ['VerifyAddFixedPriceItem', 'AddFixedPriceItem']);
  }
  assert.match(listingXml(watch, { ...link, shipping_policy_id: null }, settings), /<ShippingProfileID>2<\/ShippingProfileID>/);
});

test('content revisions retain remote policies and per-listing postage overrides', async () => {
  const profiles = '<SellerProfiles><SellerPaymentProfile><PaymentProfileID>71</PaymentProfileID></SellerPaymentProfile><SellerShippingProfile><ShippingProfileID>72</ShippingProfileID></SellerShippingProfile><SellerReturnProfile><ReturnProfileID>73</ReturnProfileID></SellerReturnProfile></SellerProfiles>';
  const overrides = '<ShippingServiceCostOverrideList><ShippingServiceCostOverride><ShippingServicePriority>1</ShippingServicePriority><ShippingServiceType>Domestic</ShippingServiceType><ShippingServiceCost currencyID="GBP">20.00</ShippingServiceCost><ShippingServiceAdditionalCost currencyID="GBP">0.00</ShippingServiceAdditionalCost></ShippingServiceCostOverride></ShippingServiceCostOverrideList>';
  let revised = false;
  await withFetch(async (_url, init) => {
    const call = new Headers(init?.headers).get('X-EBAY-API-CALL-NAME')!;
    if (call === 'GetItem') return envelope(call, remoteXml(1).replace('</Item>', `${profiles}${overrides}</Item>`));
    assert.equal(call, 'ReviseFixedPriceItem');
    const body = String(init?.body);
    assert.match(body, /<ShippingProfileID>72<\/ShippingProfileID>/);
    assert.match(body, /<PaymentProfileID>71<\/PaymentProfileID>/);
    assert.match(body, /<ReturnProfileID>73<\/ReturnProfileID>/);
    assert.match(body, /<ShippingServiceCost currencyID="GBP">20.00<\/ShippingServiceCost>/);
    assert.doesNotMatch(body, /<ShippingProfileID>2<\/ShippingProfileID>|<ShippingProfileID>999<\/ShippingProfileID>|<ShippingDetails>|<UUID>|<InventoryTrackingMethod>|<Quantity>/);
    revised = true;
    return envelope(call);
  }, async () => { await syncWatch(fakeDb({ link: { needs_revision: true, shipping_policy_id: '999' } }), id); });
  assert.equal(revised, true);
});

test('legacy eBay listings retain postage without being switched to business policies', () => {
  const remote = parseTradingResponse(`<GetItemResponse><Ack>Success</Ack>${remoteXml(1).replace('</Item>', '<ShippingDetails><ShippingServiceOptions><ShippingService>UK_OtherCourier</ShippingService><ShippingServiceCost currencyID="GBP">5.00</ShippingServiceCost></ShippingServiceOptions></ShippingDetails></Item>')}</GetItemResponse>`, 'GetItem').Item;
  const body = revisionXml(watch, link, { ...settings, shipping_policy_id: '' }, remote);
  assert.match(body, new RegExp(`<ItemID>${itemId}</ItemID>`));
  assert.doesNotMatch(body, /<SellerProfiles>|<ShippingDetails>|<ShippingServiceCostOverrideList>/);
  assert.throws(() => revisionXml(watch, link, settings, { ...remote, SellerProfiles: { SellerShippingProfile: { ShippingProfileID: '2' } } }), /confirm all existing/);
});

test('per-watch postage policy survives API saves and older clients; invalid IDs fail', async () => {
  const payload = { enabled: true, price: 650, title: '', aspects: {}, existingItemId: itemId, shippingPolicyId: '2000' };
  assert.equal(linkInput(payload).shipping_policy_id, '2000');
  const db = fakeDb();
  await saveLink(db, id, payload);
  assert.equal(db.data.ebay_listings[0].shipping_policy_id, '2000');
  const { shippingPolicyId: _removed, ...oldPayload } = payload;
  await saveLink(db, id, oldPayload);
  assert.equal(db.data.ebay_listings[0].shipping_policy_id, '2000');
  assert.throws(() => linkInput({ ...payload, shippingPolicyId: '£20' }), /numeric eBay postage policy/);
  assert.throws(() => linkInput({ ...payload, shippingPolicyId: 'https://example.com' }), /numeric eBay postage policy/);
  await saveLink(db, id, { ...payload, shippingPolicyId: '' });
  assert.equal(db.data.ebay_listings[0].shipping_policy_id, null);
});

test('forged OAuth callbacks and non-admin callers are rejected before database access', async () => {
  const noDb = { from() { throw Error('Database must not be reached'); } };
  const r = await ebayRoutes({ httpMethod: 'GET' }, [], noDb, { isAdmin: false });
  assert.equal(r.statusCode, 403);
  await assert.rejects(ebayRoutes({ httpMethod: 'GET', queryStringParameters: { code: 'fake', state: 'fake' }, headers: {} }, ['callback'], noDb, {}), /did not originate/);
});

test('account sales checks follow every page and deduplicate item IDs', async () => {
  let calls = 0;
  await withFetch(async (_url, init) => {
    calls++;
    assert.match(String(init?.body), /<OutputSelector>TransactionArray.Transaction.Item.ItemID/);
    return envelope('GetSellerTransactions', `<HasMoreTransactions>${calls === 1}</HasMoreTransactions><PaginationResult><TotalNumberOfPages>2</TotalNumberOfPages></PaginationResult><TransactionArray><Transaction><Item><ItemID>${itemId}</ItemID></Item></Transaction>${calls === 2 ? '<Transaction><Item><ItemID>333333333333</ItemID></Item></Transaction>' : ''}</TransactionArray>`);
  }, async () => { const ids = await pollSales('synthetic-token', '2026-10-29T00:00:00Z', '2026-10-30T00:00:00Z'); assert.equal(ids.size, 2); });
  assert.equal(calls, 2);
});

test('fifty unchanged linked watches need one account call, not fifty item calls', async () => {
  const db = fakeDb();
  db.data.ebay_settings[0] = { ...settings, last_active_check_at: new Date().toISOString(), last_sales_check_at: new Date().toISOString() };
  db.data.watches = Array.from({ length: 50 }, (_, i) => ({ ...watch, id: `${id}-${i}` }));
  db.data.ebay_listings = db.data.watches.map((w: any, i: number) => ({ ...link, watch_id: w.id, item_id: String(Number(itemId) + i), last_synced_at: new Date().toISOString() }));
  const calls: string[] = [];
  await withFetch(async (_url, init) => { const call = new Headers(init?.headers).get('X-EBAY-API-CALL-NAME')!; calls.push(call); assert.equal(call, 'GetSellerTransactions'); return envelope(call, '<HasMoreTransactions>false</HasMoreTransactions>'); }, async () => { assert.deepEqual(await runSync(db), []); });
  assert.deepEqual(calls, ['GetSellerTransactions']);
});

test('expired access tokens refresh on the server while retaining the refresh token', async () => {
  const db = fakeDb(); db.data.ebay_connection[0].access_expires_at = '2020-01-01';
  await withFetch(async (url, init) => { assert.match(String(url), /identity\/v1\/oauth2\/token/); assert.match(String(init?.body), /grant_type=refresh_token/); return Response.json({ access_token: 'new-synthetic-token', expires_in: 7200 }); }, async () => {
    const result = await accessToken(db); assert.equal(result.token, 'new-synthetic-token');
    const stored = decrypt(db.data.ebay_connection[0].tokens); assert.equal(stored.refresh_token, 'synthetic-refresh'); assert.equal(stored.access_token, 'new-synthetic-token');
  });
});

test('a purchase arriving during the eBay pause stops website checkout', async () => {
  let getCalls = 0;
  await withFetch(async (_url, init) => {
    const call = new Headers(init?.headers).get('X-EBAY-API-CALL-NAME')!;
    if (call === 'GetItem') return envelope(call, remoteXml(1, ++getCalls === 2 ? 1 : 0));
    if (call === 'GetUserPreferences') return envelope(call, '<OutOfStockControlPreference>true</OutOfStockControlPreference>');
    return envelope(call);
  }, async () => { await assert.rejects(pauseForCheckout(fakeDb(), id), /purchased on eBay/); });
});

test('database upgrade, leases, stock collisions and private grants on PostgreSQL', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role;create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;`);
    await db.exec((await readFile('supabase/schema.sql', 'utf8')).replace('create extension if not exists pgcrypto;', ''));
    await db.exec(await readFile('supabase/google-search-upgrade.sql', 'utf8'));
    const upgrade = await readFile('supabase/ebay-integration.sql', 'utf8'); await db.exec(upgrade); await db.exec(upgrade);
    await db.query("insert into watches(id,brand,model,price) values($1,'TAG Heuer','Aquaracer',600)", [id]);
    await db.query("insert into ebay_listings(watch_id,sku,create_uuid,environment,price,item_id) values($1,'unique-sku','unique-uuid','sandbox',650,$2)", [id, itemId]);
    await db.query("update ebay_listings set shipping_policy_id='2000' where watch_id=$1", [id]);
    await assert.rejects(db.query("update ebay_listings set shipping_policy_id='£20' where watch_id=$1", [id]), /check constraint/);
    const lease = '22222222-2222-4222-8222-222222222222';
    const claim = await db.query<{ r: any }>('select claim_ebay_listing($1,$2) r', [id, lease]); assert(claim.rows[0].r);
    const second = await db.query<{ r: any }>('select claim_ebay_listing($1,$2) r', [id, lease]); assert.equal(second.rows[0].r, null);
    await assert.rejects(db.query("select reserve_watch_checkout($1,'{}')", [id]), /synchronisation/);
    await assert.rejects(db.query("update watches set status='Sold' where id=$1", [id]), /synchronisation/);
    await db.query("update watches set description='Changed while remote request is pending' where id=$1", [id]);
    await db.query('select finish_ebay_sync($1,$2,0)', [id, lease]);
    const queued = await db.query<any>('select last_synced_at,needs_revision from ebay_listings where watch_id=$1', [id]);
    assert.equal(queued.rows[0].last_synced_at, null); assert.equal(queued.rows[0].needs_revision, true);
    const reservation = await db.query<{ r: any }>("select reserve_watch_checkout($1,'{}') r", [id]);
    const orderId = reservation.rows[0].r.order.id;
    const conflict = await db.query<{ r: any }>('select record_ebay_sale($1,$2) r', [id, itemId]); assert.equal(conflict.rows[0].r.conflict, true);
    await db.query('select record_ebay_sale($1,$2)', [id, itemId]);
    const n = await db.query<any>('select count(*) n from notifications'); assert.equal(Number(n.rows[0].n), 1);
    await db.query('select release_watch_checkout($1)', [orderId]);
    await db.query('select record_ebay_sale($1,$2)', [id, itemId]);
    const stock = await db.query<any>('select status from watches where id=$1', [id]); assert.equal(stock.rows[0].status, 'Sold');
    const paid = await db.query<any>("select count(*) n from orders where payment_status='Paid'"); assert.equal(Number(paid.rows[0].n), 0);
    const permission = await db.query<any>("select has_table_privilege('anon','public.ebay_connection','SELECT') t,has_function_privilege('authenticated','public.claim_ebay_listing(uuid,uuid)','EXECUTE') f");
    assert.equal(permission.rows[0].t, false); assert.equal(permission.rows[0].f, false);
  } finally { await db.close(); }
});

