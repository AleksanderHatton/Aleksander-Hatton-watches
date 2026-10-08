import {buyingBrands} from '../../src/shared/content';
import {getServiceSupabase,toWatch} from './_shared';
import {brandUrl,DEFAULT_ORIGIN,PAGE_SIZE,routeFor,slug,staticPaths,type PageData} from '../../src/shared/catalogue';
export const PUBLIC_FIELDS='id,brand,model,reference,year,condition,box,papers,price,image,images,status,description,created_at,updated_at,sold_at,movement,case_size,dial_colour,material,service_notes,warranty_notes,mpn,gtin';
export function origin(){return (process.env.SITE_URL||DEFAULT_ORIGIN).replace(/\/+$/,'');}
export const robotsHeader=()=>process.env.CONTEXT&&process.env.CONTEXT!=='production'?'noindex, nofollow':undefined;
export async function allWatches(db=getServiceSupabase(),fields=PUBLIC_FIELDS){
 const rows:any[]=[];for(let offset=0;;offset+=1000){const{data,error}=await db.from('watches').select(fields).order('id').range(offset,offset+999);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<1000)break;}return rows;
}
export async function loadPage(input:string,db=getServiceSupabase()):Promise<PageData>{
 const route=routeFor(input);const data:PageData={route,origin:origin(),watches:[],total:0,brands:[],status:route.kind==='notfound'?404:200,noindex:Boolean(robotsHeader()),business:{name:process.env.BUSINESS_LEGAL_NAME||'',number:process.env.BUSINESS_COMPANY_NUMBER||'',address:process.env.BUSINESS_CORRESPONDENCE_ADDRESS||''}};
 if(['home','catalogue','product'].includes(route.kind)){
  const brandRows=await allWatches(db,'id,brand');data.brands=[...new Map(brandRows.map(x=>[slug(x.brand),x.brand as string])).values()].sort();
 }
 if(route.brand&&!data.brands.some(b=>slug(b)===route.brand)){if(buyingBrands[route.brand]){data.brands.push(buyingBrands[route.brand].name);data.noindex=true;}else{data.route.kind='notfound';data.status=404;return data;}}
 if(route.kind==='product'){
  const{data:row,error}=await db.from('watches').select(PUBLIC_FIELDS).eq('id',route.key).maybeSingle();if(error)throw error;
  if(!row){data.route.kind='notfound';data.status=404;return data;}data.watch=toWatch(row);
  const related=await db.from('watches').select(PUBLIC_FIELDS).eq('brand',row.brand).eq('status','Available').neq('id',row.id).order('created_at',{ascending:false}).limit(4);if(related.error)throw related.error;data.watches=(related.data||[]).map(toWatch);
 }else if(['home','catalogue'].includes(route.kind)){
  let q=db.from('watches').select(PUBLIC_FIELDS,{count:'exact'}).order('created_at',{ascending:false}).order('id');
  q=route.path==='/sold-watches'?q.eq('status','Sold'):q.in('status',route.kind==='home'?['Available']:['Available','Reserved']);
  if(route.brand)q=q.ilike('brand',data.brands.find(b=>slug(b)===route.brand));
  if(route.query){const safe=route.query.replace(/[^\p{L}\p{N}\s.\-]/gu,'').replace(/\s+/g,' ').trim();if(safe)q=q.or(`brand.ilike.%${safe}%,model.ilike.%${safe}%,reference.ilike.%${safe}%`);}
  const size=route.kind==='home'?4:PAGE_SIZE;const start=(route.page-1)*size;
  const{data:rows,error,count}=await q.range(start,start+size-1);if(error)throw error;
  data.watches=(rows||[]).map(toWatch);data.total=count||0;
  if(route.page>1&&start>=data.total){data.route.kind='notfound';data.status=404;}
 }
 return data;
}
export function sitemapPaths(rows:any[]){return [...staticPaths,...[...new Set(rows.map(r=>r.brand as string))].map(brandUrl),...rows.map(r=>`/watch/${r.id}`)];}
