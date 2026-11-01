import { createHmac } from 'node:crypto';
import { config as ebayConfig } from './ebay/client';
// Each minute in UTC, equally spaced throughout UK daylight-saving changes.
// Scheduled functions only run on the published production deploy.
export const config = { schedule: '*/1 * * * *' };
export default async () => {
  if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_TOKEN_ENCRYPTION_KEY) return new Response(null, { status: 204 });
  ebayConfig();
  const origin = process.env.SITE_URL || process.env.URL;
  if (!origin) throw new Error('SITE_URL is required for the eBay stock worker.');
  const timestamp = String(Date.now());
  const signature = createHmac('sha256', process.env.EBAY_TOKEN_ENCRYPTION_KEY).update(timestamp).digest('hex');
  const result = await fetch(`${origin.replace(/\/$/, '')}/.netlify/functions/ebay-sync-background`, {
    method: 'POST', signal: AbortSignal.timeout(8000), headers: { 'X-AHW-Time': timestamp, 'X-AHW-Signature': signature },
  });
  if (result.status !== 202) throw new Error(`eBay stock worker could not start (${result.status}).`);
  return new Response(null, { status: 204 });
};
