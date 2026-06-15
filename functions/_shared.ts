import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Only allow the live site (and localhost during dev) to call these functions.
// Set SITE_URL in your environment. Falls back to '*' only if nothing is configured.
function allowedOrigin() {
  return process.env.SITE_URL || process.env.URL || '*';
}

export function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin(),
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      Vary: 'Origin',
    },
    body: JSON.stringify(body),
  };
}

// Escape user-supplied text before it goes into notification emails so nobody can
// inject markup or links into your inbox.
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isValidEmail(value: unknown): boolean {
  const email = String(value ?? '').trim();
  return email.length > 3 && email.length < 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Trim and cap free-text fields so nobody can post megabyte-sized payloads.
export function clampText(value: unknown, max = 2000): string {
  return String(value ?? '').trim().slice(0, max);
}

// Simple spam trap. The form renders a hidden field that real users never see.
// If it comes back filled, it was a bot. Returns true when the request looks like spam.
export function isHoneypotTripped(body: any): boolean {
  const trap = body?.company || body?.website || body?.hp;
  return typeof trap === 'string' && trap.trim().length > 0;
}

export function getServiceSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getRequester(event: any, supabase = getServiceSupabase()) {
  const auth = event.headers?.authorization || event.headers?.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return { user: null, profile: null, isAdmin: false };

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return { user: null, profile: null, isAdmin: false };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, phone, role')
    .eq('id', userData.user.id)
    .maybeSingle();

  const role = profile?.role || 'customer';
  return {
    user: userData.user,
    profile,
    isAdmin: role === 'admin' || role === 'dealer',
  };
}

export function requireBody(event: any) {
  if (!event.body) return {};
  return JSON.parse(event.body);
}

export async function sendEmail(params: { subject: string; html: string; to?: string; replyTo?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Aleksander Hatton <onboarding@resend.dev>';
  const to = params.to || process.env.ADMIN_EMAIL || 'inquiries@ahwatches.com';

  if (!apiKey || !to) {
    console.warn('Email skipped. Missing RESEND_API_KEY.');
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo,
  });
}

export function toWatch(row: any) {
  return {
    id: row.id,
    brand: row.brand || '',
    model: row.model || '',
    reference: row.reference || '',
    year: row.year || '',
    condition: row.condition || '',
    box: row.box || 'Unsure',
    papers: row.papers || 'Unsure',
    price: Number(row.price || 0),
    image: row.image || '',
    images: Array.isArray(row.images) ? row.images : (row.image ? [row.image] : []),
    status: row.status || 'Available',
    description: row.description || '',
    createdAt: row.created_at || row.createdAt || '',
    stripeLink: row.stripe_link || row.stripeLink || '',
  };
}

export function fromWatch(body: any) {
  const images = Array.isArray(body.images)
    ? body.images.filter((image: any) => typeof image === 'string' && image.trim().length > 0)
    : [];
  const primaryImage = images[0] || body.image || '';

  return {
    brand: body.brand,
    model: body.model,
    reference: body.reference || '',
    year: body.year || '',
    condition: body.condition || '',
    box: body.box || 'Unsure',
    papers: body.papers || 'Unsure',
    price: Number(body.price || 0),
    image: primaryImage,
    images: images.length > 0 ? images : (primaryImage ? [primaryImage] : []),
    status: body.status || 'Available',
    description: body.description || '',
    stripe_link: body.stripeLink || body.stripe_link || '',
  };
}

export function toValuation(row: any) {
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    preferredContact: row.preferred_contact || 'Email',
    location: row.location || '',
    brand: row.brand || '',
    model: row.model || '',
    reference: row.reference || '',
    year: row.year || '',
    condition: row.condition || '',
    box: row.box || 'Unsure',
    papers: row.papers || 'Unsure',
    receipt: row.receipt || 'Unsure',
    serviceHistory: row.service_history || '',
    askingPrice: row.asking_price || '',
    additionalDetails: row.additional_details || '',
    photos: row.photos || {},
    status: row.status || 'Pending Review',
    adminNotes: row.admin_notes || '',
    createdAt: row.created_at || '',
  };
}

export function fromValuation(body: any, userId?: string | null) {
  return {
    user_id: userId || null,
    name: body.name || '',
    email: (body.email || '').toLowerCase().trim(),
    phone: body.phone || '',
    preferred_contact: body.preferredContact || 'Email',
    location: body.location || '',
    brand: body.brand || '',
    model: body.model || '',
    reference: body.reference || '',
    year: body.year || '',
    condition: body.condition || '',
    box: body.box || 'Unsure',
    papers: body.papers || 'Unsure',
    receipt: body.receipt || 'Unsure',
    service_history: body.serviceHistory || '',
    asking_price: body.askingPrice || '',
    additional_details: body.additionalDetails || '',
    photos: body.photos || {},
    status: body.status || 'Pending Review',
    admin_notes: body.adminNotes || '',
  };
}

export function toSourcing(row: any) {
  return {
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    brand: row.brand || '',
    model: row.model || '',
    reference: row.reference || '',
    year: row.year || '',
    condition: row.condition || '',
    boxPapers: row.box_papers || '',
    budget: row.budget || '',
    timeframe: row.timeframe || '',
    notes: row.notes || '',
    status: row.status || 'Active Sourcing',
    adminNotes: row.admin_notes || '',
    createdAt: row.created_at || '',
  };
}

export function fromSourcing(body: any, userId?: string | null) {
  return {
    user_id: userId || null,
    name: body.name || '',
    email: (body.email || '').toLowerCase().trim(),
    phone: body.phone || '',
    brand: body.brand || '',
    model: body.model || '',
    reference: body.reference || '',
    year: body.year || '',
    condition: body.condition || '',
    box_papers: body.boxPapers || '',
    budget: body.budget || '',
    timeframe: body.timeframe || '',
    notes: body.notes || '',
    status: body.status || 'Active Sourcing',
    admin_notes: body.adminNotes || '',
  };
}

export function toOrder(row: any) {
  return {
    id: row.id,
    watchId: row.watch_id || '',
    watchDetails: row.watch_details || {},
    clientName: row.client_name || '',
    clientEmail: row.client_email || '',
    clientPhone: row.client_phone || '',
    clientAddress: row.client_address || '',
    clientCity: row.client_city || '',
    clientPostcode: row.client_postcode || '',
    paymentStatus: row.payment_status || 'Pending',
    paymentMethod: row.payment_method || '',
    createdAt: row.created_at || '',
  };
}

export function fromOrder(body: any, userId?: string | null) {
  return {
    user_id: userId || null,
    watch_id: body.watchId || body.watch_id,
    watch_details: body.watchDetails || body.watch_details || {},
    client_name: body.clientName || '',
    client_email: (body.clientEmail || '').toLowerCase().trim(),
    client_phone: body.clientPhone || '',
    client_address: body.clientAddress || '',
    client_city: body.clientCity || '',
    client_postcode: body.clientPostcode || '',
    payment_status: body.paymentStatus || 'Pending',
    payment_method: body.paymentMethod || 'Stripe Checkout',
    amount: Number(body.amount || 0),
  };
}
