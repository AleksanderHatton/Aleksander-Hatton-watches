import { getServiceSupabase } from './_shared';

const BASE_URL = 'https://www.ahwatches.com';

const STATIC_PAGES: Array<{ path: string; priority: string }> = [
  { path: '/', priority: '1.0' },
  { path: '/shop', priority: '0.9' },
  { path: '/sell-your-watch', priority: '0.8' },
  { path: '/source-a-watch', priority: '0.7' },
  { path: '/contact', priority: '0.5' },
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Serves /sitemap.xml with every static page plus a URL per available watch,
// so new listings get discovered and indexed without manual sitemap edits.
export const handler = async () => {
  let watchEntries = '';
  try {
    const supabase = getServiceSupabase();
    const { data } = await supabase
      .from('watches')
      .select('id, created_at')
      .eq('status', 'Available')
      .order('created_at', { ascending: false })
      .limit(1000);

    watchEntries = (data || [])
      .map((row: any) => {
        const lastmod = row.created_at ? `<lastmod>${escapeXml(String(row.created_at).slice(0, 10))}</lastmod>` : '';
        return `  <url><loc>${BASE_URL}/watch/${escapeXml(row.id)}</loc>${lastmod}<priority>0.8</priority></url>`;
      })
      .join('\n');
  } catch (err) {
    // Fall back to static pages only rather than serving an error to crawlers.
    console.error('Sitemap watch lookup failed:', err);
  }

  const staticEntries = STATIC_PAGES
    .map((page) => `  <url><loc>${BASE_URL}${page.path}</loc><priority>${page.priority}</priority></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticEntries}${watchEntries ? '\n' + watchEntries : ''}\n</urlset>\n`;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
    body: xml,
  };
};
