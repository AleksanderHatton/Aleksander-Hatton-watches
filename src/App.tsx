import React,{Suspense,useEffect,useState} from 'react';
import Storefront from './components/Storefront';
import {emptyPage,metadata,schema,type PageData} from './shared/catalogue';
import {buyingBrands} from './shared/content';
import {apiFetch} from './lib/api';
import {getCurrentUserProfile,supabase} from './lib/supabase';
import type {Watch} from './types';
import {pathFromView,CONTACT_EMAIL} from './lib/contact';
const ValuationForm=React.lazy(()=>import('./components/ValuationForm'));
const SourcingForm=React.lazy(()=>import('./components/SourcingForm'));
const CheckoutModal=React.lazy(()=>import('./components/CheckoutModal'));
const AuthModal=React.lazy(()=>import('./components/AuthModal'));
const AdminDashboard=React.lazy(()=>import('./components/AdminDashboard'));
const ClientDashboard=React.lazy(()=>import('./components/ClientDashboard'));
function initialData():PageData|null{try{const el=document.getElementById('page-data');return el?JSON.parse(el.textContent||'null'):null;}catch{return null;}}
function ContextContact(){
 const params=new URLSearchParams(window.location.search);const context=[params.get('brand'),params.get('model'),params.get('reference')].filter(Boolean).join(' ');
 const [form,setForm]=useState({name:'',email:'',phone:'',company:'',message:context?`Enquiry about ${context}\nStock ID: ${params.get('stock')||''}\n\n`:''});
 const [state,setState]=useState('');const [pending,setPending]=useState(false);
 return <form className="contact-form" onSubmit={async e=>{e.preventDefault();setPending(true);setState('');try{await apiFetch('/api/contact',{method:'POST',body:JSON.stringify(form)});setState('Thank you. Your enquiry has been saved and we will reply using your contact details.');setForm({...form,message:''});}catch(e){setState(e instanceof Error?e.message:'Could not send. Please try again.');}finally{setPending(false);}}}><h2>Send an enquiry</h2>{(['name','email','phone'] as const).map(k=><label key={k}>{k==='phone'?'Phone (optional)':k==='email'?'Email':'Name'}<input name={k} type={k==='email'?'email':k==='phone'?'tel':'text'} autoComplete={k} required={k!=='phone'} maxLength={k==='email'?320:120} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}<div><label htmlFor="enquiry-message">Message</label><textarea id="enquiry-message" required rows={6} maxLength={4000} value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/></div><div hidden aria-hidden="true"><label>Company<input tabIndex={-1} autoComplete="off" value={form.company} onChange={e=>setForm({...form,company:e.target.value})}/></label></div><p className="muted">We use these details to respond to your enquiry. <a href="/policies/privacy">Privacy information</a>.</p><button className="primary" disabled={pending}>{pending?'Sending…':'Send enquiry'}</button>{state&&<p role="status">{state}</p>}</form>;
}
export default function App(){
 const [data,setData]=useState<PageData|null>(initialData);const [error,setError]=useState('');
 const [checkout,setCheckout]=useState<Watch|null>(null);const [auth,setAuth]=useState(false);const [session,setSession]=useState<any>(null);const [authLoading,setAuthLoading]=useState(true);
 const url=window.location.pathname+window.location.search;
 const refresh=async()=>{try{const d=await apiFetch<PageData>('/.netlify/functions/catalogue-page?url='+encodeURIComponent(url));if(d.route.redirect){window.location.replace(d.route.redirect);return;}setData(d);setError('');}catch{setError('We could not refresh availability. Please try again or contact us before purchasing.');}};
 useEffect(()=>{if(!data)void refresh();const onFocus=()=>{if(['home','catalogue','product'].includes((data||emptyPage(url)).route.kind))void refresh();};window.addEventListener('focus',onFocus);return()=>window.removeEventListener('focus',onFocus);},[]);
 useEffect(()=>{let active=true;const read=async()=>{try{const p=await getCurrentUserProfile();if(active)setSession(p?{role:['admin','dealer'].includes(p.role)?'dealer':'customer',user:p}:null);}catch{if(active)setSession(null);}finally{if(active)setAuthLoading(false);}};void read();const{data:l}=supabase.auth.onAuthStateChange(()=>{setTimeout(()=>{if(active)void read();},0);});return()=>{active=false;l.subscription.unsubscribe();};},[]);
 useEffect(()=>{if(!data)return;const m=metadata(data);document.title=m.title;const setMeta=(name:string,content:string)=>{let el=document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);if(!el){el=document.createElement('meta');el.name=name;document.head.append(el);}el.content=content;};setMeta('description',m.description);setMeta('robots',m.noindex?'noindex, follow':'index, follow, max-image-preview:large');let link=document.querySelector<HTMLLinkElement>('link[rel="canonical"]');if(!link){link=document.createElement('link');link.rel='canonical';document.head.append(link);}link.href=m.canonical;let el=document.getElementById('site-schema');if(!el){el=document.createElement('script');el.id='site-schema';el.setAttribute('type','application/ld+json');document.head.append(el);}el.textContent=JSON.stringify(schema(data));},[data]);
 const logout=async()=>{await supabase.auth.signOut();window.location.assign('/');};
 if(!data)return <main className="site-main"><h1>Aleksander Hatton</h1>{error?<><p role="alert">{error}</p><button onClick={refresh}>Try again</button></>:<p>Loading the catalogue…</p>}<a href={`mailto:${CONTACT_EMAIL}`}>Contact us</a></main>;
 const params=new URLSearchParams(window.location.search);const initial={brand:params.get('brand')||(data.route.key&&data.route.kind==='sell'?buyingBrands[data.route.key].name:''),model:params.get('model')||'',reference:params.get('reference')||'',stock:params.get('stock')||''};
 const form=<Suspense fallback={<p>Loading the enquiry form…</p>}>{data.route.kind==='sell'?<ValuationForm initial={initial}/>:<SourcingForm initial={initial}/>}</Suspense>;
 const account=authLoading?<p className="section">Checking your account…</p>:!session?<section className="section"><h1>Your account</h1><button className="primary" onClick={()=>setAuth(true)}>Sign in or register</button></section>:data.route.kind==='admin'&&session.role!=='dealer'?<section className="section"><h1>Dealer access required</h1><a href="/account">Open your account</a></section>:<Suspense fallback={<p>Loading your dashboard…</p>}>{session.role==='dealer'?<AdminDashboard onLogout={logout}/>:<ClientDashboard session={session} onLogout={logout} setView={v=>window.location.assign(pathFromView(v))}/>}</Suspense>;
 const payment=params.get('payment');
 return <>{payment&&<div className="notice" role="status">{payment==='success'?'Thank you. We are checking your payment with the payment provider. Confirmation follows once payment is verified.':'You left checkout. A temporary reservation may remain until the payment session expires.'}</div>}{error&&<div className="notice" role="alert">{error}</div>}<Storefront data={data} onBuy={w=>{if(w.status==='Available')setCheckout(w);}} form={form} account={account} contactForm={<ContextContact/>}/><Suspense fallback={null}>{checkout&&<CheckoutModal key={checkout.id} watch={checkout} isOpen onClose={()=>{setCheckout(null);void refresh();}} onSuccess={()=>{}}/>}{auth&&<AuthModal isOpen onClose={()=>setAuth(false)} onSuccess={s=>{setSession(s);setAuth(false);}}/>}</Suspense></>;
}
