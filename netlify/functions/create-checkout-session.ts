import Stripe from 'stripe';
import { getRequester, getServiceSupabase, json, requireBody, sendEmail } from './_shared';

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL;

    if (!stripeKey) return json(500, { error: 'Missing STRIPE_SECRET_KEY.' });
    if (!siteUrl) return json(500, { error: 'Missing SITE_URL.' });

    const stripe = new Stripe(stripeKey);
    const supabase = getServiceSupabase();
    const requester = await getRequester(event, supabase);
    const body = requireBody(event);

    const watchId = body.watchId || body.watch_id;
    if (!watchId) return json(400, { error: 'watchId is required.' });

    const { data: watch, error: watchError } = await supabase
      .from('watches')
      .select('*')
      .eq('id', watchId)
      .single();

    if (watchError || !watch) return json(404, { error: 'Watch not found.' });
    if (watch.status !== 'Available') return json(409, { error: 'This watch is no longer available.' });

    const amount = Number(watch.price || 0);
    if (!amount || amount <= 0) return json(400, { error: 'Watch price is invalid.' });

    const orderPayload = {
      user_id: requester.user?.id || null,
      watch_id: watch.id,
      watch_details: {
        brand: watch.brand,
        model: watch.model,
        price: amount,
        reference: watch.reference || '',
      },
      client_name: body.clientName || '',
      client_email: String(body.clientEmail || '').toLowerCase().trim(),
      client_phone: body.clientPhone || '',
      client_address: body.clientAddress || '',
      client_city: body.clientCity || '',
      client_postcode: body.clientPostcode || '',
      payment_status: 'Pending',
      payment_method: 'Stripe Checkout',
      amount,
    };

    if (!orderPayload.client_name || !orderPayload.client_email || !orderPayload.client_phone) {
      return json(400, { error: 'Client name, email and phone are required.' });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select('*')
      .single();

    if (orderError) throw orderError;

    const checkoutImage = [
      ...(Array.isArray(watch.images) ? watch.images : []),
      watch.image
    ].find((image: any) => typeof image === 'string' && image.startsWith('http'));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: orderPayload.client_email,
      success_url: `${siteUrl}/?payment=success&order=${order.id}`,
      cancel_url: `${siteUrl}/?payment=cancelled&watch=${watch.id}`,
      metadata: {
        order_id: order.id,
        watch_id: watch.id,
        user_id: requester.user?.id || '',
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `${watch.brand} ${watch.model}`,
              description: watch.reference ? `Reference: ${watch.reference}` : undefined,
              images: checkoutImage ? [checkoutImage] : undefined,
            },
          },
        },
      ],
    });

    const { error: updateError } = await supabase
      .from('orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    if (updateError) throw updateError;

    await sendEmail({
      subject: `Checkout started: ${watch.brand} ${watch.model}`,
      html: `<h2>Checkout started</h2><p><b>Client:</b> ${orderPayload.client_name}</p><p><b>Email:</b> ${orderPayload.client_email}</p><p><b>Watch:</b> ${watch.brand} ${watch.model}</p><p><b>Amount:</b> £${amount.toLocaleString()}</p>`,
      replyTo: orderPayload.client_email,
    });

    return json(200, {
      url: session.url,
      orderId: order.id,
      order: {
        id: order.id,
        clientName: order.client_name,
        clientEmail: order.client_email,
        clientPhone: order.client_phone,
        clientCity: order.client_city,
        clientPostcode: order.client_postcode,
      },
    });
  } catch (err: any) {
    console.error(err);
    return json(500, { error: err.message || 'Could not create checkout session.' });
  }
};
