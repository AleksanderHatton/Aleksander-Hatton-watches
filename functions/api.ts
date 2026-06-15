import {
  clampText,
  escapeHtml,
  fromSourcing,
  fromValuation,
  fromWatch,
  getRequester,
  getServiceSupabase,
  isHoneypotTripped,
  isValidEmail,
  json,
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

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });

  try {
    const supabase = getServiceSupabase();
    const requester = await getRequester(event, supabase);
    const method = event.httpMethod;
    const route = getRoute(event);
    const [resource, id, sub] = route;

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
          query = query.or(`user_id.eq.${requester.user.id},email.eq.${requester.user.email.toLowerCase()}`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return json(200, (data || []).map(toValuation));
      }

      if (method === 'POST') {
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
          query = query.or(`user_id.eq.${requester.user.id},email.eq.${requester.user.email.toLowerCase()}`);
        }
        const { data, error } = await query;
        if (error) throw error;
        return json(200, (data || []).map(toSourcing));
      }

      if (method === 'POST') {
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
          query = query.or(`user_id.eq.${requester.user.id},client_email.eq.${requester.user.email.toLowerCase()}`);
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
    console.error(err);
    return json(500, { error: err.message || 'Server error.' });
  }
};
