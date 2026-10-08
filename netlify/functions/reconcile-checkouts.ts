// Scheduled recovery complements required Stripe webhooks. Reservations are only
// released after Stripe confirms expiry/failure or an exhaustive session lookup.
import Stripe from 'stripe';
import {getServiceSupabase} from './_shared';
export const config={schedule:'*/15 * * * *'};
export const handler=async()=>{
 if(!process.env.STRIPE_SECRET_KEY)return{statusCode:503};
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);const db=getServiceSupabase();
 const cutoff=new Date(Date.now()-65*60*1000).toISOString();
 const{data:orders,error}=await db.from('orders').select('id,watch_id,created_at,stripe_session_id').eq('payment_status','Pending').lt('created_at',cutoff).order('created_at').limit(50);
 if(error)throw error;
 for(const order of orders||[]){try{
  let session:Stripe.Checkout.Session|undefined;
  if(order.stripe_session_id)session=await stripe.checkout.sessions.retrieve(order.stripe_session_id);
  else{
   const created=Math.floor(new Date(order.created_at).getTime()/1000);
   for await(const candidate of stripe.checkout.sessions.list({created:{gte:created-300,lte:created+3600},limit:100})){if(candidate.metadata?.order_id===order.id){session=candidate;break;}}
   if(session){const update=await db.from('orders').update({stripe_session_id:session.id}).eq('id',order.id);if(update.error)throw update.error;}
  }
  if(!session||session.status==='expired'){
   const result=await db.rpc('release_watch_checkout',{p_order:order.id,p_session:session?.id||null});if(result.error)throw result.error;
  }else if(session.payment_status==='paid'){
   const result=await db.rpc('complete_watch_checkout',{p_order:order.id,p_watch:order.watch_id,p_session:session.id,p_amount:session.amount_total,p_currency:session.currency});if(result.error)throw result.error;
   if(!result.data?.duplicate){const n=await db.from('notifications').insert({title:'Recovered payment: contact customer',message:`Order ${order.id} was recovered from Stripe. Check its shipping details and send confirmation to the customer.`,type:'payment'});if(n.error)console.error(n.error);}
  }
  // Complete/unpaid sessions may represent delayed payment methods: retain hold.
 }catch(e){console.error('Checkout reconciliation needs review',order.id,e);}}
 return{statusCode:200};
};
