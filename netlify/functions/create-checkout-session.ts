import Stripe from 'stripe';
import {randomBytes} from 'node:crypto';
import {checkRateLimit,clampText,errorResponse,getRequester,getServiceSupabase,isHoneypotTripped,isValidEmail,json,requireBody} from './_shared';
import {origin} from './_catalogue';
import {pauseForCheckout} from './ebay/sync';
export const handler=async(event:any)=>{
 if(event.httpMethod==='OPTIONS')return json(200,{ok:true});if(event.httpMethod!=='POST')return json(405,{error:'Method not allowed.'});
 let db:ReturnType<typeof getServiceSupabase>|undefined;let orderId:string|undefined;let stripe:Stripe|undefined;let session:Stripe.Checkout.Session|undefined;
 try{
  if(!process.env.STRIPE_SECRET_KEY)return json(503,{error:'Checkout is unavailable. Please contact us.'});
  checkRateLimit(event,'checkout',6);db=getServiceSupabase();const requester=await getRequester(event,db);const body=requireBody(event);
  if(isHoneypotTripped(body))return json(400,{error:'Invalid request.'});
  if(!/^[a-f0-9-]{36}$/i.test(body.watchId||''))return json(400,{error:'A valid watch ID is required.'});
  const details={user_id:requester.user?.id||null,client_name:clampText(body.clientName,120),client_email:clampText(body.clientEmail,320).toLowerCase(),client_phone:clampText(body.clientPhone,40),client_address:clampText(body.clientAddress,300),client_city:clampText(body.clientCity,120),client_postcode:clampText(body.clientPostcode,20)};
  if(!isValidEmail(details.client_email)||!details.client_name||!details.client_phone||!details.client_address||!details.client_city||!details.client_postcode)return json(400,{error:'Please provide valid contact and delivery details.'});
  const result=await db.rpc('reserve_watch_checkout',{p_watch:body.watchId,p_details:details});
  if(result.error){if(/no longer available/i.test(result.error.message))return json(409,{error:'This watch is reserved or sold. Please refresh the listing.'});throw result.error;}
  const{watch,order}=result.data;orderId=order.id;
  await pauseForCheckout(db,watch.id);
  stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
  const checkoutImage=[...(watch.images||[]),watch.image].find((x:any)=>typeof x==='string'&&/^https:\/\//.test(x));
  const params:Stripe.Checkout.SessionCreateParams={mode:'payment',expires_at:Math.floor(Date.now()/1000)+30*60,customer_email:details.client_email,success_url:`${origin()}/account?payment=success`,cancel_url:`${origin()}/watch/${watch.id}?payment=cancelled`,metadata:{order_id:order.id,watch_id:watch.id},shipping_address_collection:{allowed_countries:['GB']},line_items:[{quantity:1,price_data:{currency:'gbp',unit_amount:order.amount*100,product_data:{name:`${watch.brand} ${watch.model}`,description:watch.reference?`Reference: ${watch.reference}`:undefined,images:checkoutImage?[checkoutImage]:undefined}}}]};
  // A stable integration label identifies this checkout flow in the Stripe Dashboard.
  params.integration_identifier='ahwatches_'+Array.from(randomBytes(8),b=>String.fromCharCode(97+b%26)).join('');
  session=await stripe.checkout.sessions.create(params,{idempotencyKey:`watch-order-${order.id}`});
  const{error}=await db.from('orders').update({stripe_session_id:session.id}).eq('id',order.id);if(error)throw error;
  return json(200,{url:session.url,orderId:order.id});
 }catch(e:any){
  // An ambiguous Stripe network error must keep the hold: a payable session may
  // exist. Expire a known session before releasing; never blindly restock it.
  if(db&&orderId){let safeToRelease=!stripe; if(session&&stripe){try{await stripe.checkout.sessions.expire(session.id);safeToRelease=true;}catch{safeToRelease=false;}}else if(stripe){safeToRelease=['StripeInvalidRequestError','StripeAuthenticationError','StripePermissionError'].includes(e?.type);}
   if(safeToRelease){const r=await db.rpc('release_watch_checkout',{p_order:orderId,p_session:session?.id||null});if(r.error)console.error('Reservation release failed',r.error.message);}else console.error('Checkout reservation needs reconciliation for order',orderId);
  }
  return errorResponse(e);
 }
};
