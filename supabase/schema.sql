-- Aleksander Hatton production schema for Supabase
-- Run this in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text unique,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'dealer')),
  created_at timestamptz not null default now()
);

create table if not exists public.watches (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  reference text,
  year text,
  condition text,
  box text default 'Unsure' check (box in ('Yes', 'No', 'Unsure')),
  papers text default 'Unsure' check (papers in ('Yes', 'No', 'Unsure')),
  price integer not null check (price > 0),
  image text,
  images jsonb not null default '[]'::jsonb,
  status text not null default 'Available' check (status in ('Available', 'Reserved', 'Sold')),
  description text,
  stripe_link text,
  created_at timestamptz not null default now()
);

create table if not exists public.valuations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text,
  email text,
  phone text,
  preferred_contact text,
  location text,
  brand text,
  model text,
  reference text,
  year text,
  condition text,
  box text default 'Unsure',
  papers text default 'Unsure',
  receipt text default 'Unsure',
  service_history text,
  asking_price text,
  additional_details text,
  photos jsonb default '{}'::jsonb,
  status text not null default 'Pending Review' check (status in ('Pending Review', 'Offered', 'Approved', 'Declined')),
  admin_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.sourcing_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text,
  email text,
  phone text,
  brand text,
  model text,
  reference text,
  year text,
  condition text,
  box_papers text,
  budget text,
  timeframe text,
  notes text,
  status text not null default 'Active Sourcing' check (status in ('Active Sourcing', 'Watch Found', 'Completed', 'Cancelled')),
  admin_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  watch_id uuid references public.watches(id) on delete set null,
  watch_details jsonb default '{}'::jsonb,
  client_name text,
  client_email text,
  client_phone text,
  client_address text,
  client_city text,
  client_postcode text,
  stripe_session_id text,
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Paid', 'Failed')),
  payment_method text,
  amount integer,
  created_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  phone text,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text,
  message text,
  type text default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    'customer'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(public.profiles.name, excluded.name),
    phone = coalesce(public.profiles.phone, excluded.phone);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- security definer is required here: this function reads public.profiles,
-- and the profiles select policy itself calls is_admin(). Without definer
-- rights Postgres raises "infinite recursion detected in policy for relation
-- profiles" and profile reads fail for logged-in users.
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

alter table public.profiles enable row level security;
alter table public.watches enable row level security;
alter table public.valuations enable row level security;
alter table public.sourcing_requests enable row level security;
alter table public.orders enable row level security;
alter table public.contacts enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles_read_own_or_admin" on public.profiles;
create policy "profiles_read_own_or_admin" on public.profiles
for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "watches_public_available" on public.watches;
create policy "watches_public_available" on public.watches
for select using (status = 'Available' or public.is_admin());

drop policy if exists "watches_admin_all" on public.watches;
create policy "watches_admin_all" on public.watches
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "valuations_owner_read" on public.valuations;
create policy "valuations_owner_read" on public.valuations
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "valuations_owner_insert" on public.valuations;
create policy "valuations_owner_insert" on public.valuations
for insert with check (user_id = auth.uid() or user_id is null);

drop policy if exists "valuations_admin_all" on public.valuations;
create policy "valuations_admin_all" on public.valuations
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "sourcing_owner_read" on public.sourcing_requests;
create policy "sourcing_owner_read" on public.sourcing_requests
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "sourcing_owner_insert" on public.sourcing_requests;
create policy "sourcing_owner_insert" on public.sourcing_requests
for insert with check (user_id = auth.uid() or user_id is null);

drop policy if exists "sourcing_admin_all" on public.sourcing_requests;
create policy "sourcing_admin_all" on public.sourcing_requests
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "orders_owner_read" on public.orders;
create policy "orders_owner_read" on public.orders
for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_owner_insert" on public.orders;
create policy "orders_owner_insert" on public.orders
for insert with check (user_id = auth.uid() or user_id is null);

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "contacts_admin_all" on public.contacts;
create policy "contacts_admin_all" on public.contacts
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "contacts_public_insert" on public.contacts;
create policy "contacts_public_insert" on public.contacts
for insert with check (true);

drop policy if exists "notifications_admin_all" on public.notifications;
create policy "notifications_admin_all" on public.notifications
for all using (public.is_admin()) with check (public.is_admin());

-- After creating your own account through the website, run this once with your email:
-- update public.profiles set role = 'admin' where email = 'YOUR_EMAIL@example.com';
