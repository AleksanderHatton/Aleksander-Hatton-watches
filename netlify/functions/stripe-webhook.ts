import Stripe from 'stripe';
import {escapeHtml,getServiceSupabase,json,sendEmail} from './_shared';
export const handler=async(event:any)=>{
 if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed.'});
 if(!process.env.STRIPE_SECRET_KEY||!process.env.STRIPE_WEBHOOK_SECRET)return json(503,{error:'Payment processing unavailable.'});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);let notification:Stripe.Event;
 try{notification=stripe.webhooks.constructEvent(event.isBase64Encoded?Buffer.from(event.body,'base64'):event.body,event.headers?.['stripe-signature']||event.headers?.['Stripe-Signature'],process.env.STRIPE_WEBHOOK_SECRET);}catch{return json(400,{error:'Invalid webhook signature.'});}
 const handled=['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'];
 if(!handled.includes(notification.type))return json(200,{received:true});
 try{
  const session=notification.data.object as Stripe.Checkout.Session;const orderId=session.metadata?.order_id;const watchId=session.metadata?.watch_id;
  // Ignore other integrations in the same account.
  if(!orderId||!watchId)return json(200,{received:true});
  const db=getServiceSupabase();
  if(['checkout.session.expired','checkout.session.async_payment_failed'].includes(notification.type)){
   const{error}=await db.rpc('release_watch_checkout',{p_order:orderId,p_session:session.id});if(error)throw error;return json(200,{received:true});
  }
  if(session.payment_status!=='paid')return json(200,{received:true}); // delayed payments retain the hold
  const{data,error}=await db.rpc('complete_watch_checkout',{p_order:orderId,p_watch:watchId,p_session:session.id,p_amount:session.amount_total,p_currency:session.currency});
  if(error)throw error;if(data.duplicate)return json(200,{received:true});
  const{order,watch}=data;
  // Payment state and stock are committed atomically before best-effort email.
  const shipping=(session as any).collected_information?.shipping_details || (session as any).shipping_details;
  if(shipping?.address){const a=shipping.address;const update=await db.from('orders').update({client_name:shipping.name||order.client_name,client_address:[a.line1,a.line2].filter(Boolean).join(', '),client_city:a.city||'',client_postcode:a.postal_code||''}).eq('id',orderId);if(update.error)console.error('Checkout shipping update failed',orderId);}
  await sendEmail({subject:`Payment confirmed: ${watch.brand} ${watch.model}`,html:`<h2>Payment confirmed</h2><p>Order ${escapeHtml(order.id)}: ${escapeHtml(order.client_name)} paid £${Number(order.amount).toFixed(2)} for ${escapeHtml(watch.brand)} ${escapeHtml(watch.model)}.</p>`});
  if(order.client_email)await sendEmail({to:order.client_email,subject:'Payment received – Aleksander Hatton',html:`<h2>Thank you for your order</h2><p>We have received payment for ${escapeHtml(watch.brand)} ${escapeHtml(watch.model)}. Your order reference is ${escapeHtml(order.id)}. We will be in touch about delivery.</p>`});
  return json(200,{received:true});
 }catch(e){console.error('Payment requires retry or manual review',e);return json(500,{error:'Payment update could not be completed. Retry required.'});}
};
