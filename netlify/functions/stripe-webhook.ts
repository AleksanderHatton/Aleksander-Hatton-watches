import Stripe from 'stripe';
import { getServiceSupabase, json, sendEmail } from './_shared';

export const handler = async (event: any) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) return json(500, { error: 'Missing Stripe environment variables.' });

  const stripe = new Stripe(stripeKey);
  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return json(400, { error: `Webhook error: ${err.message}` });
  }

  try {
    const supabase = getServiceSupabase();

    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      const watchId = session.metadata?.watch_id;

      if (!orderId || !watchId) return json(400, { error: 'Missing order_id or watch_id metadata.' });

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({ payment_status: 'Paid', payment_method: 'Stripe Checkout', stripe_session_id: session.id })
        .eq('id', orderId)
        .select('*')
        .single();
      if (orderError) throw orderError;

      const { data: watch, error: watchError } = await supabase
        .from('watches')
        .update({ status: 'Sold' })
        .eq('id', watchId)
        .select('*')
        .single();
      if (watchError) throw watchError;

      await supabase.from('notifications').insert({
        title: 'Payment confirmed',
        message: `${order.client_name} paid for ${watch.brand} ${watch.model}`,
        type: 'payment',
      });

      await sendEmail({
        subject: `Payment confirmed: ${watch.brand} ${watch.model}`,
        html: `<h2>Payment confirmed</h2><p><b>Client:</b> ${order.client_name}</p><p><b>Email:</b> ${order.client_email}</p><p><b>Watch:</b> ${watch.brand} ${watch.model}</p><p><b>Amount:</b> £${Number(order.amount || 0).toLocaleString()}</p>`,
      });

      if (order.client_email) {
        await sendEmail({
          to: order.client_email,
          subject: `Payment received - Aleksander Hatton`,
          html: `<h2>Payment received</h2><p>Thank you for your purchase of the ${watch.brand} ${watch.model}. We have received your payment and will contact you about insured delivery.</p>`,
        });
      }
    }

    return json(200, { received: true });
  } catch (err: any) {
    console.error(err);
    return json(500, { error: err.message || 'Webhook processing failed.' });
  }
};
