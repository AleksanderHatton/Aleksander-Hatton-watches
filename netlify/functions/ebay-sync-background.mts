import { createHmac } from 'node:crypto';
import { getServiceSupabase } from './_shared';
import { equal } from './ebay/client';
import { runSync } from './ebay/sync';
export const config = { background: true };
export default async (request: Request) => {
  const timestamp = request.headers.get('X-AHW-Time') || '';
  const secret = process.env.EBAY_TOKEN_ENCRYPTION_KEY;
  if (request.method !== 'POST' || !secret || !/^\d{13}$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp)) > 60000) return new Response(null, { status: 403 });
  const expected = createHmac('sha256', secret).update(timestamp).digest('hex');
  if (!equal(expected, request.headers.get('X-AHW-Signature') || '')) return new Response(null, { status: 403 });
  await runSync(getServiceSupabase());
  return new Response(null, { status: 204 });
};
