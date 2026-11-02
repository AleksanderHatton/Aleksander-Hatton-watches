-- Additive, repeatable upgrade for the existing AHW project.
-- Prerequisite: google-search-upgrade.sql has already been applied.
-- Run this in the SQL Editor BEFORE deploying the new code.
begin;
create table if not exists public.ebay_settings (
  id integer primary key default 1 check(id=1),
  enabled boolean not null default false,
  auto_list_new boolean not null default false,
  markup_percent numeric(6,2) not null default 0 check(markup_percent between 0 and 100),
  payment_policy_id text not null default '',
  return_policy_id text not null default '',
  shipping_policy_id text not null default '',
  location text not null default '',
  postcode text not null default '',
  last_worker_at timestamptz
);
insert into public.ebay_settings(id) values(1) on conflict do nothing;
alter table public.ebay_settings add column if not exists last_sales_check_at timestamptz;
alter table public.ebay_settings add column if not exists last_active_check_at timestamptz;
alter table public.ebay_settings add column if not exists worker_error text not null default '';
create table if not exists public.ebay_connection (
  id integer primary key default 1 check(id=1),
  environment text not null check(environment in ('production','sandbox')),
  seller_username text not null,
  tokens text not null,
  access_expires_at timestamptz not null,
  refresh_expires_at timestamptz,
  connected_at timestamptz not null default now()
);
create table if not exists public.ebay_oauth_states (
  state_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null
);
create table if not exists public.ebay_listings (
  watch_id uuid primary key references public.watches(id) on delete restrict,
  sku text not null unique,
  create_uuid text not null unique,
  item_id text unique,
  environment text not null check(environment in ('production','sandbox')),
  enabled boolean not null default false,
  price numeric(12,2) not null check(price > 0),
  title text not null default '' check(length(title)<=80),
  aspects jsonb not null default '{}'::jsonb,
  state text not null default 'draft' check(state in ('draft','queued','live','paused','sold','ended','error','needs_review')),
  needs_revision boolean not null default false,
  creation_attempted boolean not null default false,
  paused_by_us boolean not null default false,
  last_error text not null default '',
  warnings jsonb not null default '[]'::jsonb,
  last_synced_at timestamptz,
  lock_token uuid,
  lock_until timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ebay_listings_sync_idx on public.ebay_listings(last_synced_at nulls first);
alter table public.ebay_listings add column if not exists desired_revision bigint not null default 0;
alter table public.ebay_listings add column if not exists shipping_policy_id text
  check (shipping_policy_id is null or shipping_policy_id ~ '^[0-9]{1,20}$');
alter table public.ebay_settings enable row level security;
alter table public.ebay_connection enable row level security;
alter table public.ebay_oauth_states enable row level security;
alter table public.ebay_listings enable row level security;
revoke all on public.ebay_settings,public.ebay_connection,public.ebay_oauth_states,public.ebay_listings from public,anon,authenticated;
grant select,insert,update,delete on public.ebay_settings,public.ebay_connection,public.ebay_oauth_states,public.ebay_listings to service_role;

-- Lease both the local watch and its linked listing before any remote mutation.
-- The watch lock orders this atomically with reserve_watch_checkout(). A lease
-- persists across HTTP calls and a dead worker's lease expires after 240s.
create or replace function public.claim_ebay_listing(p_watch uuid,p_lock uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare w public.watches; l public.ebay_listings;
begin
  select * into w from public.watches where id=p_watch for update;
  if not found then return null; end if;
    update public.ebay_listings set lock_token=p_lock,lock_until=now()+interval '240 seconds'
    where watch_id=p_watch and (lock_until is null or lock_until<now()) returning * into l;
  if not found then return null; end if;
  return jsonb_build_object('watch',to_jsonb(w),'listing',to_jsonb(l));
end; $$;

-- Do not lose a newly queued website change when an older HTTP job finishes.
create or replace function public.finish_ebay_sync(p_watch uuid,p_lock uuid,p_revision bigint)
returns boolean language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  update public.ebay_listings set
    last_synced_at=case when desired_revision=p_revision then now() else null end,
    needs_revision=needs_revision or desired_revision<>p_revision,
    lock_token=null,lock_until=null where watch_id=p_watch and lock_token=p_lock;
  return found;
end; $$;

-- An eBay sale reserves the physical watch even if eBay payment is outstanding.
-- It is NOT recorded as a paid website order or added to website sales totals.
create or replace function public.record_ebay_sale(p_watch uuid,p_item text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare w public.watches; l public.ebay_listings;
begin
  select * into w from public.watches where id=p_watch for update;
  select * into l from public.ebay_listings where watch_id=p_watch and item_id=p_item for update;
  if not found then raise exception 'eBay listing mismatch'; end if;
  if w.reserved_order_id is not null then
    if l.state<>'needs_review' then
      insert into public.notifications(title,message,type) values('Urgent: check both sales channels',concat('eBay item ',p_item,' has a purchase while website order ',w.reserved_order_id,' holds the watch. Check eBay and Stripe before fulfilment.'),'payment');
    end if;
    update public.ebay_listings set state='needs_review',last_error='An eBay purchase conflicts with a website payment reservation. Check both channels before fulfilment.' where watch_id=p_watch;
    return jsonb_build_object('conflict',true,'order_id',w.reserved_order_id);
  end if;
  if l.state<>'sold' then
    insert into public.notifications(title,message,type) values('Watch purchased on eBay',concat(w.brand,' ',w.model,' (eBay ',p_item,') is unavailable on the website. Confirm payment and fulfilment in Seller Hub.'),'stock');
  end if;
  perform set_config('ahw.ebay_stock_update','true',true);
  update public.watches set status='Sold' where id=p_watch and status<>'Sold';
  update public.ebay_listings set state='sold',needs_revision=false,last_error='' where watch_id=p_watch;
  return jsonb_build_object('conflict',false);
end; $$;

create or replace function public.guard_ebay_checkout() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  if old.status='Available' and new.status<>'Available' and
    coalesce(current_setting('ahw.ebay_stock_update',true),'')<>'true' and
    exists(select 1 from public.ebay_listings where watch_id=new.id and lock_until>now()) then
    raise exception 'Watch is no longer available: stock synchronisation is in progress. Please try again shortly.';
  end if;
  return new;
end; $$;
drop trigger if exists watch_ebay_checkout on public.watches;
create trigger watch_ebay_checkout before update on public.watches for each row execute function public.guard_ebay_checkout();

create or replace function public.queue_ebay_watch_change() returns trigger
language plpgsql security invoker set search_path=public,pg_temp as $$
begin
  update public.ebay_listings set last_synced_at=null,desired_revision=desired_revision+1,
    needs_revision=needs_revision or (
      row(new.brand,new.model,new.reference,new.condition,new.description,new.images,new.image,new.box,new.papers,new.movement,new.case_size,new.dial_colour,new.material,new.service_notes,new.warranty_notes)
      is distinct from row(old.brand,old.model,old.reference,old.condition,old.description,old.images,old.image,old.box,old.papers,old.movement,old.case_size,old.dial_colour,old.material,old.service_notes,old.warranty_notes))
    where watch_id=new.id;
  return new;
end; $$;
drop trigger if exists watch_ebay_queue on public.watches;
create trigger watch_ebay_queue after update on public.watches for each row execute function public.queue_ebay_watch_change();

-- No browser role may invoke privileged stock/connection routines.
revoke all on function public.claim_ebay_listing(uuid,uuid),public.finish_ebay_sync(uuid,uuid,bigint),public.record_ebay_sale(uuid,text),public.guard_ebay_checkout(),public.queue_ebay_watch_change() from public,anon,authenticated;
grant execute on function public.claim_ebay_listing(uuid,uuid),public.finish_ebay_sync(uuid,uuid,bigint),public.record_ebay_sale(uuid,text),public.guard_ebay_checkout(),public.queue_ebay_watch_change() to service_role;
commit;

