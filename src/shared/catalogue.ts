import type { Watch } from '../types';
import { buyingBrands, guides, policies } from './content';
export const DEFAULT_ORIGIN = 'https://www.ahwatches.com';
export const PAGE_SIZE = 24;
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const watchUrl = (w: Pick<Watch,'id'>) => `/watch/${w.id}`; // Keep existing indexed URLs.
export const brandUrl = (brand: string) => `/shop/${slug(brand)}`;
export const identity = (w: Watch) => `${w.brand} ${w.model}${w.reference && !w.model.includes(w.reference) ? ` ${w.reference}` : ''}`;
export const money = (n: number) => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:2}).format(n);
export function images(w: Watch) { return [...new Set([...(w.images || []),w.image].filter((s): s is string => Boolean(s) && /^https?:\/\//i.test(s) && !s.includes('images.unsplash.com')))]; }
export const enquiryUrl = (kind: 'sell'|'source'|'contact', w: Watch) => `${kind==='sell'?'/sell-your-watch':kind==='source'?'/source-a-watch':'/contact'}?${new URLSearchParams({brand:w.brand,model:w.model,reference:w.reference,stock:w.id})}`;
export interface Route { kind: string; path: string; key?: string; brand?: string; page: number; query: string; redirect?: string; }
export function routeFor(input: string): Route {
  const u = new URL(input, DEFAULT_ORIGIN); const path = u.pathname.replace(/\/+$/, '') || '/';
  const aliases: Record<string,string>={'/watches':'/shop','/valuation':'/sell-your-watch','/sell':'/sell-your-watch','/watch-valuation':'/sell-your-watch','/source':'/source-a-watch','/index.html':'/'};
  const page = Math.max(1,Math.min(100000,Number.parseInt(u.searchParams.get('page')||'1',10)||1));
  const base = {path, page, query:(u.searchParams.get('q')||'').trim().slice(0,100)};
  if(aliases[path]) return {...base,kind:'redirect',redirect:aliases[path]+u.search};
  if(path==='/') return {...base,kind:'home'};
  if(path==='/shop'||path==='/sold-watches') return {...base,kind:'catalogue'};
  if(/^\/watch\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(path)) return {...base,kind:'product',key:path.split('/')[2]};
  if(/^\/shop\/[a-z0-9-]+$/.test(path)) return {...base,kind:'catalogue',brand:path.split('/')[2]};
  if(path==='/sell-your-watch') return {...base,kind:'sell'};
  if(path.split('/').length===3 && path.startsWith('/sell-your-watch/') && buyingBrands[path.split('/')[2]]) return {...base,kind:'sell',key:path.split('/')[2]};
  if(path==='/watch-guides') return {...base,kind:'guides'};
  if(path.split('/').length===3 && path.startsWith('/watch-guides/') && guides[path.split('/')[2]]) return {...base,kind:'guide',key:path.split('/')[2]};
  if(path.split('/').length===3 && path.startsWith('/policies/') && policies[path.split('/')[2]]) return {...base,kind:'policy',key:path.split('/')[2]};
  const kinds:Record<string,string>={'/source-a-watch':'source','/contact':'contact','/about':'about','/account':'account','/admin':'admin'};
  return {...base,kind:kinds[path]||'notfound'};
}
export interface PageData { route: Route; origin: string; watches: Watch[]; watch?: Watch; total: number; brands: string[]; status: number; noindex?: boolean; business?: {name?:string;number?:string;address?:string}; }
export const emptyPage = (url:string):PageData=>({route:routeFor(url),origin:DEFAULT_ORIGIN,watches:[],total:0,brands:[],status:200});
export function metadata(data:PageData) {
  const {route:r,watch:w}=data; let title='Aleksander Hatton | Buy, Sell & Source Pre-Owned Watches';
  let description='Discover pre-owned watches, request a valuation or ask Aleksander Hatton to source your next watch. Independent watch dealer based in Sheffield.';
  let noindex=Boolean(data.noindex)||['account','admin','notfound'].includes(r.kind)||data.status>=400||Boolean(r.query);
  if(r.kind==='product'&&w) { title=`${identity(w)} | ${w.status==='Sold'?'Sold':w.status==='Reserved'?'Reserved':'Pre-Owned'} | Aleksander Hatton`; description=`${identity(w)}. ${w.status==='Sold'?'This example has sold. Browse current stock or request another.':w.status==='Reserved'?'This example is reserved. Enquire about availability.':`Available at ${money(w.price)}.`} ${w.condition ? `Condition: ${w.condition}. `:''}${w.description||'View photographs and details of this individual watch.'}`.slice(0,300); }
  if(r.kind==='catalogue') { const brand=data.brands.find(b=>slug(b)===r.brand)||'';title=`${r.path==='/sold-watches'?'Sold Watch Archive':`${brand?brand+' ':''}Pre-Owned Watches for Sale`}${r.page>1?` – Page ${r.page}`:''} | Aleksander Hatton`;description=r.path==='/sold-watches'?'Explore previously sold watches, their references and original photographs. Find current alternatives or request a valuation for your watch.':`Browse ${brand||'our'} current watches with individual photographs, condition notes and prices.`; }
  if(r.kind==='sell') {const b=r.key?buyingBrands[r.key].name:''; title=`Sell Your ${b||'Watch'} | Watch Valuation | Aleksander Hatton`;description=`Request an initial valuation for your ${b||'watch'}. Share the reference, condition and photographs. Final offers are subject to inspection.`;}
  if(r.kind==='guide') {title=`${guides[r.key!].title} | Aleksander Hatton`;description=guides[r.key!].summary;}
  const names:Record<string,string>={guides:'Watch Guides',source:'Source a Watch',contact:'Contact',about:'About Aleksander Hatton',account:'Your Account',admin:'Dealer Dashboard',notfound:'Page Not Found'};
  if(names[r.kind]) title=`${names[r.kind]} | Aleksander Hatton`;
  if(r.kind==='policy') {title=`${policies[r.key!].title} | Aleksander Hatton`;description=policies[r.key!].paragraphs[0];}
  const canonical=data.origin+(w?watchUrl(w):r.path)+(r.kind==='catalogue'&&r.page>1?`?page=${r.page}`:'');
  return {title,description,canonical,noindex,image:w?images(w)[0]:undefined};
}
export function schema(data:PageData) {
  const org={'@type':'Organization','@id':`${data.origin}/#organisation`,name:'Aleksander Hatton',url:data.origin+'/',logo:data.origin+'/favicon.png',telephone:'+447469478871',email:'inquiries@ahwatches.com'};
  const graph:any[]=[org]; const m=metadata(data); const w=data.watch;
  if(w&&images(w).length){graph.push({'@type':'Product','@id':m.canonical+'#product',name:identity(w),description:w.description||`${identity(w)}. Condition: ${w.condition||'See photographs and ask for details'}.`,image:images(w),brand:{'@type':'Brand',name:w.brand},sku:w.id,...(w.mpn?{mpn:w.mpn}:{}),...(w.gtin?{gtin:w.gtin}:{}),itemCondition:'https://schema.org/UsedCondition',offers:{'@type':'Offer',url:m.canonical,price:w.price,priceCurrency:'GBP',itemCondition:'https://schema.org/UsedCondition',availability:`https://schema.org/${w.status==='Available'?'InStock':w.status==='Reserved'?'OutOfStock':'SoldOut'}`,seller:{'@id':org['@id']}}});}
  if(data.route.path!=='/'&&!m.noindex){const crumbs=[{name:'Home',url:data.origin+'/'}];if(w)crumbs.push({name:w.brand,url:data.origin+brandUrl(w.brand)});crumbs.push({name:w?identity(w):m.title.split(' | ')[0],url:m.canonical});graph.push({'@type':'BreadcrumbList',itemListElement:crumbs.map((c,i)=>({'@type':'ListItem',position:i+1,name:c.name,item:c.url}))});}
  return {'@context':'https://schema.org','@graph':graph};
}
export const jsonSafe = (x: unknown) => JSON.stringify(x).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
export const xml = (x:unknown)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export const staticPaths=['/','/shop','/sold-watches','/sell-your-watch','/source-a-watch','/contact','/about','/watch-guides',...Object.keys(buyingBrands).map(k=>`/sell-your-watch/${k}`),...Object.keys(guides).map(k=>`/watch-guides/${k}`),...Object.keys(policies).map(k=>`/policies/${k}`)];
