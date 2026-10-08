import {allWatches,origin,robotsHeader,sitemapPaths} from './_catalogue';
import {xml} from '../../src/shared/catalogue';
export const handler=async(event:any={})=>{
 try{
  const rows=await allWatches(undefined,'id,brand,updated_at,created_at');const paths=sitemapPaths(rows);const size=40000;const part=Number(event.queryStringParameters?.part||0);
  const updated=new Map(rows.map(r=>[`/watch/${r.id}`,r.updated_at||r.created_at]));
  let body:string;
  if(paths.length>size&&!part){body=`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Array.from({length:Math.ceil(paths.length/size)},(_,i)=>`<sitemap><loc>${xml(origin())}/sitemap.xml?part=${i+1}</loc></sitemap>`).join('')}</sitemapindex>`;}
  else{if(part&&(!Number.isInteger(part)||part<1||part>Math.ceil(paths.length/size)))return{statusCode:404,body:''};const selected=paths.slice(part?(part-1)*size:0,part?part*size:size);body=`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${selected.map(path=>`<url><loc>${xml(origin()+path)}</loc>${updated.get(path)?`<lastmod>${xml(updated.get(path))}</lastmod>`:''}</url>`).join('')}</urlset>`;}
  return{statusCode:200,headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store',...(robotsHeader()?{'X-Robots-Tag':robotsHeader()!}:{})},body:'<?xml version="1.0" encoding="UTF-8"?>'+body};
 }catch(e){console.error('Sitemap unavailable',e);return{statusCode:503,headers:{'Retry-After':'60','Cache-Control':'no-store'},body:'Sitemap temporarily unavailable'};}
};
