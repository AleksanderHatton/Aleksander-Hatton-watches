-- Supabase Storage buckets used by the website.
-- Run once in Supabase Dashboard > SQL Editor.
-- Signed upload URLs are issued by the Netlify API, so browser INSERT policies
-- are not required for these buckets.

-- Public catalogue images: permanent URLs are used by the shop and product pages.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'watch-images',
  'watch-images',
  true,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Private customer valuation photos: the API issues one-hour signed read URLs
-- only to the submitting client or an admin/dealer account.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'valuation-photos',
  'valuation-photos',
  false,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
