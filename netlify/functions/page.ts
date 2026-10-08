import React from 'react';
import {renderToString} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import Storefront from '../../src/components/Storefront';
import {emptyPage,jsonSafe,metadata,routeFor,schema,xml} from '../../src/shared/catalogue';
import {loadPage,origin,robotsHeader} from './_catalogue';
let templatePromise:Promise<string>;
export function renderDocument(template:string,data:ReturnType<typeof emptyPage>){
 const meta=metadata(data);const robots=robotsHeader()||(meta.noindex?'noindex, follow':'index, follow, max-image-preview:large');
 const head=`<title>${xml(meta.title)}</title><meta name="description" content="${xml(meta.description)}"><link rel="canonical" href="${xml(meta.canonical)}"><meta name="robots" content="${robots}"><meta property="og:title" content="${xml(meta.title)}"><meta property="og:description" content="${xml(meta.description)}"><meta property="og:url" content="${xml(meta.canonical)}"><meta property="og:type" content="${data.watch?'product':'website'}"><meta property="og:site_name" content="Aleksander Hatton"><meta name="twitter:card" content="${meta.image?'summary_large_image':'summary'}">${meta.image?`<meta property="og:image" content="${xml(meta.image)}"><meta name="twitter:image" content="${xml(meta.image)}">`:''}<script id="site-schema" type="application/ld+json">${jsonSafe(schema(data))}</script>`;
 return template.replace(/<title>[\s\S]*?<\/title>/,'').replace('<!--SEO_HEAD-->',head).replace('<div id="root"></div>',`<div id="root">${renderToString(React.createElement(Storefront,{data}))}</div><script id="page-data" type="application/json">${jsonSafe(data)}</script>`);
}
export const handler=async(event:any)=>{
 if(!['GET','HEAD'].includes(event.httpMethod))return{statusCode:405,headers:{Allow:'GET, HEAD'},body:''};
 const path=event.path||'/'; const query=event.rawQuery||new URLSearchParams(event.queryStringParameters||{}).toString();const input=path+(query?'?'+query:'');const r=routeFor(input);
 if(r.redirect)return{statusCode:301,headers:{Location:r.redirect},body:''};
 // Canonicalise trailing slashes without dropping enquiry / attribution parameters.
 if(path!=='/'&&path.endsWith('/'))return{statusCode:301,headers:{Location:r.path+(query?'?'+query:'')},body:''};
 try{
  let data;try{data=await loadPage(input);}catch(e){console.error('Public catalogue unavailable',e);data=emptyPage(input);data.origin=origin();data.status=503;data.route.kind='unavailable';}
  templatePromise??=readFile(resolve('dist/index.html'),'utf8');
  const body=renderDocument(await templatePromise,data);
  return{statusCode:data.status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store',...(data.status===503?{'Retry-After':'60'}:{}),...(robotsHeader()?{'X-Robots-Tag':robotsHeader()!}:{})},body:event.httpMethod==='HEAD'?'':body};
 }catch(e){console.error(e);return{statusCode:503,headers:{'Retry-After':'60','Cache-Control':'no-store','Content-Type':'text/html; charset=utf-8'},body:'<h1>Temporarily unavailable</h1><p>Please try again shortly.</p>'};}
};
