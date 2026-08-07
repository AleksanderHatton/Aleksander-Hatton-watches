import {
  checkRateLimit,
  HttpError,
  clampText,
  errorResponse,
  escapeHtml,
  fromSourcing,
  fromValuation,
  fromWatch,
  getRequester,
  getServiceSupabase,
  isHoneypotTripped,
  isValidEmail,
  json,
  orFilterValue,
  requireBody,
  sendEmail,
  toOrder,
  toSourcing,
  toValuation,
  toWatch,
} from './_shared';

function getRoute(event: any) {
  let path = event.path || '';
  path = path.replace(/^\/\.netlify\/functions\/api\/?/, '/');
  path = path.replace(/^\/api\/?/, '/');
  if (path === '') path = '/';
  return path.split('/').filter(Boolean);
}

async function createNotification(supabase: any, title: string, message: string, type = 'info') {
  try {
    await supabase.from('notifications').insert({ title, message, type });
  } catch (err) {
    console.warn('Notification insert skipped:', err);
  }
}


function createUploadId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

const UPLOAD_BUCKETS = {
  watch: {
    name: 'watch-images',
    public: true,
  },
  valuation: {
    name: 'valuation-photos',
    public: false,
  },
} as const;

const UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_FILE_SIZE_LIMIT = 6 * 1024 * 1024;

async function ensureUploadBucket(supabase: any, kind: 'watch' | 'valuation') {
  const config = UPLOAD_BUCKETS[kind];
  const { data: existing, error: getError } = await supabase.storage.getBucket(config.name);

  if (!getError && existing) return config.name;

  const { error: createError } = await supabase.storage.createBucket(config.name, {
    public: config.public,
    fileSizeLimit: UPLOAD_FILE_SIZE_LIMIT,
    allowedMimeTypes: UPLOAD_MIME_TYPES,
  });

  // Multiple images can request signed URLs at the same time. If two function
  // invocations race to create the same bucket, one can legitimately report that
  // it already exists. Treat that as success and continue.
  if (createError && !/already exists|duplicate/i.test(String(createError.message || ''))) {
    console.error('Upload bucket setup failed:', {
      bucket: config.name,
      getError: getError?.message,
      createError: createError.message,
    });
    throw new HttpError(503, 'Photo storage is not available yet. Please try again in a moment.');
  }

  return config.name;
}

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  try {
    const supabase = getServiceSupabase();
    const requester = await getRequester(event, supabase);
    const method = event.httpMethod;
    const route = getRoute(event);
    const [resource, id, sub] = route;

    if (resource === 'uploads' && id === 'sign' && method === 'POST') {
      const body = requireBody(event);
      const kind = body.kind === 'watch' ? 'watch' : body.kind === 'valuation' ? 'valuation' : '';
      const contentType = String(body.contentType || '').toLowerCase();
      const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

      if (!kind || !allowedTypes.has(contentType)) {
        return json(400, { error: 'A valid image upload type is required.' });
      }
      if (kind === 'watch' && !requester.isAdmin) {
        return json(403, { error: 'Admin access required.' });
      }
      if (kind === 'valuation') checkRateLimit(event, 'valuation-upload-sign', 20);

      const bucket = await ensureUploadBucket(supabase, kind);
      const folder = kind === 'watch' ? 'catalogue' : `submissions/${new Date().toISOString().slice(0, 7)}`;
      const path = `${folder}/${createUploadId()}.jpg`;
      const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

      if (error || !data?.token) {
        console.error('Could not create signed upload URL:', {
          bucket,
          path,
          message: error?.message || 'No upload token returned',
        });
        throw new HttpError(502, 'Photo upload could not be started. Please try again.');
      }

      return json(200, { bucket, path, token: data.token });
    }

    if (resource === 'stock') {
      if (method === 'GET') {
        const { data, error } = await supabase
          .from('watches')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return json(200, (data || []).map(toWatch));
      }

      if (!requester.isAdmin) return json(403, { error: 'Admin access required.' });

      if (method === 'POST') {
        const body = requireBody(event);
        const { data, error } = await supabase.from('watches').insert(fromWatch(body)).select('*').single();
        if (error) throw error;
        await createNotification(supabase, 'New stock added', `${data.brand} ${data.model} added to catalog`, 'stock');
        return json(201, toWatch(data));
      }

      if (method === 'PUT' && id) {
        const body = requireBody(event);
        const { data, error } = await supabase.from('watches').update(fromWatch(body)).eq('id', id).select('*').single();
        if (error) throw error;
        return json(200, toWatch(data));
      }

      if (method === 'DELETE' && id) {
        const { error } = await supabase.from('watches').delete().eq('id', id);
        if (error) throw error;
        return json(200, { ok: true });
      }
    }

    if (resource === 'valuations') {
      if (method === 'GET') {
        let query = supabase.from('valuations').select('*').order('created_at', { ascending: false });
        if (!requester.isAdmin) {
          if (!requester.user?.email) return json(401, { error: 'Login required.' });
          query = query.or(`user_id.eq.${requester.user.id},email.eq.${orFilterValue(requester.user.email.toLowerCase())}`);
        }
        const { data, error } = await query;
        if (error) throw error;

        const valuations = await Promise.all((data || []).map(async (row: any) => {
          const valuation = toValuation(row);
          const photoEntries = Object.entries(valuation.photos || {});
          const signedEntries = await Promise.all(photoEntries.map(async ([key, value]) => {
            const photo = typeof value === 'string' ? value : '';
            if (!photo || photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('data:image/')) {
              return [key, photo];
            }
            const { data: signedData, error: signedError } = await supabase.storage
              .from('valuation-photos')
              .createSignedUrl(photo, 3600);
            if (signedError) {
              console.warn('Could not sign valuation photo:', signedError.message);
              return [key, ''];
            }
            return [key, signedData.signedUrl];
          }));
          return { ...valuation, photos: Object.fromEntries(signedEntries) };
        }));

        return json(200, valuations);
      }

      if (method === 'POST') {
        checkRateLimit(event, 'valuations', 5);
        const body = requireBody(event);
        if (isHoneypotTripped(body)) return json(200, { ok: true });
        if (!String(body.name || '').trim() || !isValidEmail(body.email)) {
          return json(400, { error: 'A valid name and email are required.' });
        }
        const { data, error } = await supabase
          .from('valuations')
          .insert(fromValuation(body, requester.user?.id))
          .select('*')
          .single();
        if (error) throw error;
        await createNotification(supabase, 'New valuation request', `${data.name} submitted ${data.brand} ${data.model}`, 'valuation');
        await sendEmail({
          subject: `New valuation: ${clampText(data.brand, 80)} ${clampText(data.model, 80)}`,
          replyTo: data.email,
          html: `<h2>New valuation request</h2><p><b>Name:</b> ${escapeHtml(data.name)}</p><p><b>Email:</b> ${escapeHtml(data.email)}</p><p><b>Phone:</b> ${escapeHtml(data.phone)}</p><p><b>Watch:</b> ${escapeHtml(data.brand)} ${escapeHtml(data.model)} ${escapeHtml(data.reference || '')}</p><p><b>Asking price:</b> ${escapeHtml(data.asking_price || 'Not given')}</p>`,
        });
        return json(201, toValuation(data));
      }

      if (method === 'PUT' && id) {
        if (!requester.isAdmin) return json(403, { error: 'Admin access required.' });
        const body = requireBody(event);
        const { data, error } = await supabase
          .from('valuations')
          .update({ status: body.status, admin_notes: body.adminNotes || '' })
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return json(200, toValuation(data));
      }
    }

    if (resource === 'sourcing') {
      if (method === 'GET') {
        let query = supabase.from('sourcing_requests').select('*').order('created_at', { ascending: false });
        if (!requester.isAdmin) {
          if (!requester.user?.email) return json(401, { error: 'Login required.' });
          query = query.or(`user_id.eq.${requester.user.id},email.eq.${orFilterValue(requester.user.email.toLowerCase())}`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return json(200, (data || []).map(toSourcing));
      }

      if (method === 'POST') {
        checkRateLimit(event, 'sourcing', 5);
        const body = requireBody(event);
        if (isHoneypotTripped(body)) return json(200, { ok: true });
        if (!String(body.name || '').trim() || !isValidEmail(body.email)) {
          return json(400, { error: 'A valid name and email are required.' });
        }
        const { data, error } = await supabase
          .from('sourcing_requests')
          .insert(fromSourcing(body, requester.user?.id))
          .select('*')
          .single();
        if (error) throw error;
        await createNotification(supabase, 'New sourcing request', `${data.name} requested ${data.brand} ${data.model}`, 'sourcing');
        await sendEmail({
          subject: `New sourcing request: ${clampText(data.brand, 80)} ${clampText(data.model, 80)}`,
          replyTo: data.email,
          html: `<h2>New sourcing request</h2><p><b>Name:</b> ${escapeHtml(data.name)}</p><p><b>Email:</b> ${escapeHtml(data.email)}</p><p><b>Phone:</b> ${escapeHtml(data.phone)}</p><p><b>Watch wanted:</b> ${escapeHtml(data.brand)} ${escapeHtml(data.model)} ${escapeHtml(data.reference || '')}</p><p><b>Budget:</b> ${escapeHtml(data.budget || 'Not given')}</p>`,
        });
        return json(201, toSourcing(data));
      }

      if (method === 'PUT' && id) {
        if (!requester.isAdmin) return json(403, { error: 'Admin access required.' });
        const body = requireBody(event);
        const { data, error } = await supabase
          .from('sourcing_requests')
          .update({ status: body.status, admin_notes: body.adminNotes || '' })
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return json(200, toSourcing(data));
      }
    }

    if (resource === 'orders') {
      if (method === 'GET') {
        let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (!requester.isAdmin) {
          if (!requester.user?.email) return json(401, { error: 'Login required.' });
          query = query.or(`user_id.eq.${requester.user.id},client_email.eq.${orFilterValue(requester.user.email.toLowerCase())}`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return json(200, (data || []).map(toOrder));
      }
      // Orders are only ever created through the Stripe checkout function, which sets the
      // price server-side and marks payment status via the verified webhook. There is
      // deliberately no public POST route here so nobody can forge a 'Paid' order.
    }

    if (resource === 'contacts') {
      if (method === 'GET') {
        if (!requester.isAdmin) return json(403, { error: 'Admin access required.' });
        const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return json(200, (data || []).map((row: any) => ({
          id: row.id,
          name: row.name || '',
          email: row.email || '',
          phone: row.phone || '',
          message: row.message || '',
          createdAt: row.created_at || '',
        })));
      }
    }

    if (resource === 'contact' && method === 'POST') {
      checkRateLimit(event, 'contact', 5);
      const body = requireBody(event);
      if (isHoneypotTripped(body)) return json(200, { ok: true });
      if (!String(body.name || '').trim() || !isValidEmail(body.email) || !String(body.message || '').trim()) {
        return json(400, { error: 'Name, a valid email and a message are required.' });
      }
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          name: clampText(body.name, 120),
          email: clampText((body.email || '').toLowerCase(), 320),
          phone: clampText(body.phone, 40),
          message: clampText(body.message, 4000),
        })
        .select('*')
        .single();
      if (error) throw error;
      await createNotification(supabase, 'New contact message', `${data.name} sent a message`, 'contact');
      await sendEmail({
        subject: `New website message from ${clampText(data.name, 80)}`,
        replyTo: data.email,
        html: `<h2>New contact message</h2><p><b>Name:</b> ${escapeHtml(data.name)}</p><p><b>Email:</b> ${escapeHtml(data.email)}</p><p><b>Phone:</b> ${escapeHtml(data.phone || 'Not given')}</p><p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>`,
      });
      return json(201, {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        createdAt: data.created_at,
      });
    }

    if (resource === 'notifications' && method === 'GET') {
      if (!requester.isAdmin) return json(403, { error: 'Admin access required.' });
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return json(200, data || []);
    }

    if (resource === 'admin' && id === 'overview' && method === 'GET') {
      if (!requester.isAdmin) return json(403, { error: 'Admin access required.' });
      const [{ count: stockCount }, { count: valuationCount }, { count: sourcingCount }, { data: paidOrders }] = await Promise.all([
        supabase.from('watches').select('id', { count: 'exact', head: true }),
        supabase.from('valuations').select('id', { count: 'exact', head: true }),
        supabase.from('sourcing_requests').select('id', { count: 'exact', head: true }).eq('status', 'Active Sourcing'),
        supabase.from('orders').select('amount').eq('payment_status', 'Paid'),
      ]);
      const totalSales = (paidOrders || []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
      return json(200, {
        totalSales,
        totalValuationsCount: valuationCount || 0,
        activeSourcingCount: sourcingCount || 0,
        currentCatalogCount: stockCount || 0,
        payoutBankConnected: true,
        payoutAccountType: 'Stripe payouts to connected business bank',
        merchantStatus: 'Active after Stripe setup',
        payoutRecipientEmail: process.env.ADMIN_EMAIL || 'inquiries@ahwatches.com',
      });
    }

    return json(404, { error: `Route not found: /${route.join('/')}` });
  } catch (err: any) {
    return errorResponse(err);
  }
};
