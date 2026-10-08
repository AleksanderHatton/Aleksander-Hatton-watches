import {allWatches,origin,robotsHeader} from './_catalogue';
import {identity,images,watchUrl,xml} from '../../src/shared/catalogue';
import {toWatch} from './_shared';
export function feedItems(rows:any[],base:string){return rows.map(toWatch).filter(w=>w.status!=='Sold'&&images(w).length>0&&w.price>0).map(w=>{
 const img=images(w);const el=(key:string,value:unknown)=>`<g:${key}>${xml(value)}</g:${key}>`;
 return '<item>'+el('id',w.id)+el('title',identity(w)+' – Pre-Owned')+el('description',w.description||`${identity(w)}. Condition: ${w.condition||'See listing'}. Box: ${w.box}. Papers: ${w.papers}.`)+el('link',base+watchUrl(w))+el('image_link',img[0])+img.slice(1,11).map(i=>el('additional_image_link',i)).join('')+el('price',w.price.toFixed(2)+' GBP')+el('availability',w.status==='Available'?'in_stock':'out_of_stock')+el('condition','used')+el('brand',w.brand)+(w.mpn?el('mpn',w.mpn):'')+(w.gtin?el('gtin',w.gtin):'')+'</item>';
 }).join('');}
export const handler=async()=>{
 if(robotsHeader())return{statusCode:404,body:'Feed is available on production only.'};
 try{return{statusCode:200,headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'no-store'},body:`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Aleksander Hatton</title><link>${xml(origin())}</link><description>Current pre-owned watches</description>${feedItems(await allWatches(),origin())}</channel></rss>`};}
 catch(e){console.error('Product feed unavailable',e);return{statusCode:503,headers:{'Retry-After':'60','Cache-Control':'no-store'},body:'Feed temporarily unavailable'};}
};
