-- Run this once in Supabase Dashboard > SQL Editor on the live project.
--
-- Fixes: "infinite recursion detected in policy for relation profiles".
-- The profiles select policy calls is_admin(), and is_admin() reads
-- profiles, so without security definer the policy re-triggers itself and
-- profile reads fail for logged-in users (breaking admin role detection).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'dealer')
  );
$$;
