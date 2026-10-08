import {origin,robotsHeader} from './_catalogue';
export const handler=async()=>({statusCode:200,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'},body:robotsHeader()?'User-agent: *\nDisallow: /\n':`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /.netlify/\nSitemap: ${origin()}/sitemap.xml\n`});
