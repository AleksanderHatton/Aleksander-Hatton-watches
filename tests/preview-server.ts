// Local, synthetic-data preview only. Never a production entrypoint.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {renderDocument} from '../netlify/functions/page';
import {emptyPage,routeFor,type PageData} from '../src/shared/catalogue';
import type {Watch} from '../src/types';
const live:Watch={id:'11111111-1111-4111-8111-111111111111',brand:'TAG Heuer',model:'Aquaracer',reference:'CAF7010',year:'Not confirmed',condition:'Light surface wear; see photographs',box:'Unsure',papers:'No',price:795,image:'https://example.com/test-watch.svg',images:['https://example.com/test-watch.svg'],status:'Available',description:'Synthetic test record. Original condition notes are preserved in the archive.',movement:'Quartz chronograph',caseSize:'Test specification',createdAt:'2026-01-01'};
const sold={...live,id:'22222222-2222-4222-8222-222222222222',status:'Sold' as const};
const reserved={...live,id:'33333333-3333-4333-8333-333333333333',status:'Reserved' as const};
function page(url:string):PageData{const d=emptyPage(url);d.brands=['TAG Heuer'];d.origin='http://127.0.0.1:4173';if(d.route.kind==='product'){d.watch=[live,sold,reserved].find(w=>w.id===d.route.key);if(!d.watch){d.route.kind='notfound';d.status=404;}d.watches=[live].filter(w=>w.id!==d.watch?.id);}else if(['home','catalogue'].includes(d.route.kind)){d.watches=d.route.path==='/sold-watches'?[sold]:[live,reserved];d.total=d.watches.length;}if(d.route.kind==='notfound')d.status=404;return d;}
const template=await readFile('dist/index.html','utf8');
createServer(async(req,res)=>{try{const u=new URL(req.url||'/','http://localhost');
 if(u.pathname.startsWith('/assets/')||u.pathname==='/favicon.png'){const p=resolve('dist','.'+u.pathname);if(!p.startsWith(resolve('dist')+'/'))throw Error('bad path');res.setHeader('content-type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'image/png');res.end(await readFile(p));return;}
 if(u.pathname==='/test-submissions'){res.setHeader('content-type','application/json');res.end(JSON.stringify(submissions));return;}
 if(u.pathname.startsWith('/api/')){let body='';for await(const chunk of req)body+=chunk;submissions.push({path:u.pathname,body:JSON.parse(body||'{}')});res.setHeader('content-type','application/json');res.statusCode=201;res.end('{"ok":true}');return;}
 if(u.pathname==='/.netlify/functions/catalogue-page'){res.setHeader('content-type','application/json');res.end(JSON.stringify(page(u.searchParams.get('url')||'/')));return;}
 const d=page(req.url||'/');if(d.route.redirect){res.statusCode=301;res.setHeader('location',d.route.redirect);res.end();return;}res.statusCode=d.status;res.setHeader('content-type','text/html');res.end(renderDocument(template,d));
 }catch(e){console.error(e);res.statusCode=500;res.end('Preview error');}
}).listen(4173,'127.0.0.1',()=>console.log('Synthetic preview listening on 4173'));
const submissions:any[]=[];
