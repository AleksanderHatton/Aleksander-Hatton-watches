import React, { useState } from 'react';
import { apiFetch } from '../lib/api';

export interface EbayListing {
  watch_id: string; item_id?: string; enabled: boolean; price: number; title: string;
  shipping_policy_id?: string | null;
  aspects: Record<string, string>; state: string; last_error: string; warnings: string[]; last_synced_at?: string;
}
export interface EbayData {
  ready: boolean; configured: boolean; environment?: string; error?: string;
  connection?: { seller_username: string; environment: string; refresh_expires_at?: string };
  settings?: { enabled: boolean; auto_list_new: boolean; markup_percent: number; payment_policy_id: string; shipping_policy_id: string; return_policy_id: string; location: string; postcode: string; last_worker_at?: string; last_sales_check_at?: string; worker_error?: string };
  listings: EbayListing[];
}
export const ebayItemUrl = (id: string, environment?: string) => `https://www.${environment === 'sandbox' ? 'sandbox.' : ''}ebay.co.uk/itm/${id}`;

export default function EbaySettings({ data, refresh }: { data: EbayData; refresh: () => Promise<void> }) {
  const [draft, setDraft] = useState<EbayData['settings'] | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [sourceId, setSourceId] = useState('');
  const settings = draft || data.settings;
  const change = (k: string, v: unknown) => setDraft({ ...settings!, [k]: v });
  const action = async (fn: () => Promise<void>) => {
    setBusy(true); setMessage('');
    try { await fn(); } catch (e) { setMessage(e instanceof Error ? e.message : 'The eBay action failed.'); } finally { setBusy(false); }
  };
  return <details className="border border-zinc-200 bg-zinc-50 rounded p-4" open={!data.connection}>
    <summary className="cursor-pointer font-semibold text-sm">eBay connection {data.connection ? `— ${data.connection.seller_username}` : '— setup required'} {data.environment === 'sandbox' ? '(Sandbox test account)' : ''}</summary>
    <div className="space-y-4 mt-4 text-sm">
      {!data.ready ? <p role="status">{data.error || 'The eBay controls are unavailable. Follow the included eBay setup guide. The website shop still works.'}</p> : <>
        <p>Add a watch once and queue it for eBay. Existing shop stock is not automatically enrolled. Use the existing item ID when the same watch is already listed on eBay.</p>
        {!data.configured && <p className="text-amber-800">Server settings are incomplete. Follow <b>docs/EBAY_SETUP.md</b> in the updated website ZIP before connecting.</p>}
        <button type="button" disabled={busy || !data.configured} className="border border-zinc-400 px-3 py-2 rounded disabled:opacity-50" onClick={() => action(async () => {
          const r = await apiFetch<{ url: string }>('/api/ebay/connect', { method: 'POST' }); window.location.assign(r.url);
        })}>{data.connection ? 'Reconnect eBay seller' : 'Connect eBay seller'}</button>
        {settings && <fieldset disabled={busy} className="space-y-3">
          <legend className="font-semibold mb-2">Listing defaults</legend>
          <label className="flex gap-2 items-start"><input type="checkbox" checked={settings.enabled} onChange={e => change('enabled', e.target.checked)} />Allow publication and content updates on eBay. Normal eBay fees apply.</label>
          <label className="flex gap-2 items-start"><input type="checkbox" checked={settings.auto_list_new} onChange={e => change('auto_list_new', e.target.checked)} />Tick “Also list on eBay” automatically for new watches.</label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label>Default eBay price increase (%)<input type="number" min="0" max="100" step="0.01" value={settings.markup_percent} onChange={e => change('markup_percent', e.target.value)} className="block border p-2 w-full bg-white" /></label>
            {(['location','postcode','payment_policy_id','shipping_policy_id','return_policy_id'] as const).map(k => <label key={k}>{{ location: 'Actual dispatch town', postcode: 'Actual dispatch postcode', payment_policy_id: 'Payment policy ID', shipping_policy_id: 'Postage policy ID', return_policy_id: 'Returns policy ID' }[k]}<input value={settings[k]} onChange={e => change(k, e.target.value)} className="block border p-2 w-full bg-white" /></label>)}
          </div>
          <p className="text-xs text-zinc-600">The postage policy above is the default for new eBay listings. Choose a different policy on each watch for a different buyer-paid charge or service. Existing listings retain their eBay payment, postage and returns settings when website content is updated.</p>
          <div className="border border-zinc-200 p-3 space-y-2">
            <label className="block">Reuse settings from one of your existing eBay watch listings<input placeholder="Numeric eBay item ID" value={sourceId} onChange={e => setSourceId(e.target.value.trim())} className="block border p-2 w-full bg-white mt-1" /></label>
            <button type="button" disabled={!data.connection || !sourceId} className="border px-3 py-2 rounded disabled:opacity-50" onClick={() => action(async () => {
              const source = await apiFetch<any>('/api/ebay/policies', { method: 'POST', body: JSON.stringify({ itemId: sourceId }) });
              setDraft({ ...settings, ...source }); setMessage('Settings loaded. Check the dispatch address and policies, then save.');
            })}>Load listing settings</button>
          </div>
          <p className="text-xs text-zinc-600">Stock checks continue for linked listings when publication is switched off. Turning off “Also list on eBay” for a watch pauses that listing; it does not remove its history.</p>
          <button type="button" className="bg-[#C5A880] text-black px-4 py-2 rounded" onClick={() => action(async () => {
            await apiFetch('/api/ebay/settings', { method: 'PUT', body: JSON.stringify(settings) }); setDraft(null); await refresh(); setMessage('eBay defaults saved.');
          })}>Save eBay defaults</button>
        </fieldset>}
        <p className="text-xs text-zinc-600">Worker last started: {data.settings?.last_worker_at ? new Date(data.settings.last_worker_at).toLocaleString('en-GB') : 'Not yet'}. Last sales check: {data.settings?.last_sales_check_at ? new Date(data.settings.last_sales_check_at).toLocaleString('en-GB') : 'Not yet'}. Sales are checked each minute; changes are queued, and a full stock comparison runs every ten minutes.</p>
        {data.settings?.worker_error && <p role="status" className="text-red-800">{data.settings.worker_error}</p>}
        <p className="text-xs text-zinc-600">Before enabling publication, switch on eBay out-of-stock control in eBay Selling preferences. That setting applies to your whole eBay account. It allows a website checkout to pause and later restore its linked listing.</p>
      </>}
      {message && <p role="status" className="whitespace-pre-wrap text-amber-900">{message}</p>}
    </div>
  </details>;
}

export interface EbayForm { enabled: boolean; price: string; title: string; existingItemId: string; shippingPolicyId: string; department: string; display: string; extra: string }
export const emptyEbayForm = (): EbayForm => ({ enabled: false, price: '', title: '', existingItemId: '', shippingPolicyId: '', department: '', display: '', extra: '' });
export function formFromListing(link?: EbayListing): EbayForm {
  if (!link) return emptyEbayForm();
  return { enabled: link.enabled, price: String(link.price), title: link.title, existingItemId: link.item_id || '', shippingPolicyId: link.shipping_policy_id || '', department: link.aspects.Department || '', display: link.aspects.Display || '', extra: Object.entries(link.aspects).filter(([k]) => !['Department','Display'].includes(k)).map(([k,v]) => `${k}: ${v}`).join('\n') };
}
export function ebayPayload(form: EbayForm, suggested: number) {
  const aspects: Record<string, string> = {};
  for (const line of form.extra.split('\n').filter(l => l.trim())) {
    const i = line.indexOf(':');
    if (i < 1 || !line.slice(i + 1).trim()) throw new Error('Write each extra eBay specific as Name: Value on a separate line.');
    aspects[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  if (form.department) aspects.Department = form.department;
  if (form.display) aspects.Display = form.display;
  const shippingPolicyId = form.shippingPolicyId.trim();
  if (shippingPolicyId && !/^\d{1,20}$/.test(shippingPolicyId)) throw new Error('Enter a numeric eBay postage policy ID, or leave it empty to use the default.');
  return { enabled: form.enabled, price: Number(form.price || suggested), title: form.title, existingItemId: form.existingItemId, shippingPolicyId, aspects };
}
export function EbayWatchFields({ data, form, setForm, suggested }: { data: EbayData; form: EbayForm; setForm: React.Dispatch<React.SetStateAction<EbayForm>>; suggested: number }) {
  const change = (k: keyof EbayForm, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));
  if (!data.ready) return null;
  return <fieldset className="border border-zinc-200 p-4 space-y-3 text-sm">
    <legend>eBay listing</legend>
    <label className="flex gap-2"><input type="checkbox" checked={form.enabled} onChange={e => change('enabled', e.target.checked)} />Also list on eBay</label>
    <p className="text-xs text-zinc-600">Website saving is immediate. Enabled eBay listings are queued for the worker once publication is switched on. All four shop condition grades are listed as pre-owned on eBay.</p>
    {(form.enabled || form.existingItemId) && <>
      <label className="block">eBay price (£)<input aria-label="eBay price" type="number" min="0.01" step="0.01" value={form.price || suggested || ''} onChange={e => change('price', e.target.value)} className="block border p-2 w-full" /></label>
      <label className="block">eBay title (optional, maximum 80 characters)<input value={form.title} maxLength={80} onChange={e => change('title', e.target.value)} placeholder="Default: brand, model and reference" className="block border p-2 w-full" /></label>
      <label className="block">Existing eBay item ID (if already listed)<input value={form.existingItemId} onChange={e => change('existingItemId', e.target.value.trim())} inputMode="numeric" className="block border p-2 w-full" /></label>
      <p className="text-xs text-zinc-600">Enter the item ID for this exact physical watch to avoid a second listing. A linked item ID cannot be replaced with a different listing.</p>
      {form.existingItemId ? <p className="text-xs text-zinc-600">This watch keeps the payment, postage and returns settings already on its eBay listing. Change its delivery service and buyer-paid postage charge in eBay.</p> : <>
        <label className="block">Postage policy ID for this watch (optional)<input value={form.shippingPolicyId} onChange={e => change('shippingPolicyId', e.target.value.trim())} inputMode="numeric" placeholder="Leave empty to use the default postage policy" className="block border p-2 w-full" /></label>
        <p className="text-xs text-zinc-600">Choose an eBay postage policy with the service and charge for this watch, such as £5 delivery or £20 insured delivery. Enter its policy ID, not the price. The policy sets what the buyer pays; this website does not calculate courier or insurance costs.</p>
      </>}
      <label className="block">eBay department<select value={form.department} onChange={e => change('department', e.target.value)} className="block border p-2 w-full"><option value="">Select if verified</option><option>Men</option><option>Women</option><option>Unisex Adults</option></select></label>
      <label className="block">Display<select value={form.display} onChange={e => change('display', e.target.value)} className="block border p-2 w-full"><option value="">Select if verified</option><option>Analogue</option><option>Digital</option><option>Analogue &amp; Digital</option></select></label>
      <label className="block">Additional verified eBay specifics<textarea value={form.extra} onChange={e => change('extra', e.target.value)} placeholder={'Style: Diver\nCase Colour: Silver'} rows={3} className="block border p-2 w-full" /></label>
      <p className="text-xs text-zinc-600">Use one Name: Value per line. Brand, reference, movement, case size, dial colour, material, box and papers come from the watch fields. eBay may require extra specifics; its check will show what is missing.</p>
      <p className="text-xs text-amber-900">Saving changes to a linked watch can replace its eBay title, price, description, photos and specifics. Its existing eBay payment, postage and returns settings are retained. Other Seller Hub content edits are not imported to the website.</p>
    </>}
  </fieldset>;
}

