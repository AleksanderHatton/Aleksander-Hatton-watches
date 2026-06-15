-- Run this once in Supabase Dashboard > SQL Editor if your watches table already exists.
-- It adds support for multiple catalogue photos per listed watch.

alter table public.watches
add column if not exists images jsonb not null default '[]'::jsonb;

update public.watches
set images = jsonb_build_array(image)
where (images is null or images = '[]'::jsonb)
  and image is not null
  and image <> '';
