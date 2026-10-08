-- Run once on the EXISTING project before deploying the accompanying code.
-- Additive migration. Keeps watch IDs, URLs, orders and customer submissions.
begin;
alter table public.watches add column if not exists updated_at timestamptz not null default now();
alter table public.watches add column if not exists sold_at timestamptz;
alter table public.watches add column if not exists movement text not null default '';
alter table public.watches add column if not exists case_size text not null default '';
alter table public.watches add column if not exists dial_colour text not null default '';
alter table public.watches add column if not exists material text not null default '';
alter table public.watches add column if not exists service_notes text not null default '';
alter table public.watches add column if not exists warranty_notes text not null default '';
alter table public.watches add column if not exists mpn text not null default '';
alter table public.watches add column if not exists gtin text not null default '';
alter table public.watches add column if not exists reserved_order_id uuid;
create index if not exists watches_status_created_idx on public.watches(status,created_at desc);
create index if not exists watches_brand_idx on public.watches(brand);
create index if not exists orders_session_idx on public.orders(stripe_session_id);

create or replace function public.touch_watch() returns trigger language plpgsql set search_path=public as $$
begin
  new.updated_at=now();
  if new.status='Sold' and old.status<>'Sold' then new.sold_at=now(); end if;
  if old.status='Sold' and new.status<>'Sold' then new.sold_at=null; end if;
  return new;
end; $$;
drop trigger if exists watch_updated on public.watches;
create trigger watch_updated before update on public.watches for each row execute function public.touch_watch();

-- Prevent customers from changing their profile role to grant themselves admin access.
create or replace function public.protect_profile_role() returns trigger language plpgsql set search_path=public as $$
begin
 if new.role is distinct from old.role and coalesce(auth.role(),'') not in ('service_role') and session_user not in ('postgres','supabase_admin') then
  raise exception 'Profile roles may only be changed by the database administrator';
 end if;
 return new;
end; $$;
drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role before update on public.profiles for each row execute function public.protect_profile_role();

-- Browser clients use the validated server endpoints for submissions and payments.
-- Close direct writes that otherwise bypass validation and permit fake paid orders.
drop policy if exists "orders_owner_insert" on public.orders;
drop policy if exists "valuations_owner_insert" on public.valuations;
drop policy if exists "sourcing_owner_insert" on public.sourcing_requests;
drop policy if exists "contacts_public_insert" on public.contacts;

-- Lock order then watch consistently in all payment routines. Only one reservation
-- can win; the order insert and inventory transition commit as one transaction.
create or replace function public.reserve_watch_checkout(p_watch uuid,p_details jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare w public.watches; o public.orders;
begin
 select * into w from public.watches where id=p_watch for update;
 if not found then raise exception 'Watch not found'; end if;
 if w.status<>'Available' or w.reserved_order_id is not null then raise exception 'Watch is no longer available'; end if;
 insert into public.orders(user_id,watch_id,watch_details,client_name,client_email,client_phone,client_address,client_city,client_postcode,payment_status,payment_method,amount)
 values(nullif(p_details->>'user_id','')::uuid,w.id,jsonb_build_object('brand',w.brand,'model',w.model,'price',w.price,'reference',w.reference),p_details->>'client_name',p_details->>'client_email',p_details->>'client_phone',p_details->>'client_address',p_details->>'client_city',p_details->>'client_postcode','Pending','Stripe Checkout',w.price) returning * into o;
 update public.watches set status='Reserved',reserved_order_id=o.id where id=w.id;
 return jsonb_build_object('order',to_jsonb(o),'watch',to_jsonb(w));
end; $$;

create or replace function public.release_watch_checkout(p_order uuid,p_session text default null)
returns boolean language plpgsql security definer set search_path=public as $$
declare o public.orders;
begin
 select * into o from public.orders where id=p_order for update;
 if not found or o.payment_status<>'Pending' then return false; end if;
 if p_session is not null and o.stripe_session_id is not null and o.stripe_session_id<>p_session then raise exception 'Session mismatch'; end if;
 update public.watches set status='Available',reserved_order_id=null where id=o.watch_id and status='Reserved' and reserved_order_id=o.id;
 update public.orders set payment_status='Failed' where id=o.id;
 return true;
end; $$;

create or replace function public.complete_watch_checkout(p_order uuid,p_watch uuid,p_session text,p_amount integer,p_currency text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare o public.orders;w public.watches;
begin
 select * into o from public.orders where id=p_order for update;
 if not found or o.watch_id<>p_watch then raise exception 'Order mismatch'; end if;
 if o.stripe_session_id is not null and o.stripe_session_id<>p_session then raise exception 'Session mismatch'; end if;
 if p_currency<>'gbp' or p_amount<>o.amount*100 then raise exception 'Payment amount mismatch'; end if;
 if o.payment_status='Paid' then return jsonb_build_object('duplicate',true); end if;
 select * into w from public.watches where id=p_watch for update;
 if not found or (w.status<>'Reserved' or w.reserved_order_id is distinct from o.id) then raise exception 'Stock reservation conflict: manual payment review required'; end if;
 update public.orders set payment_status='Paid',stripe_session_id=p_session where id=o.id;
 update public.watches set status='Sold',reserved_order_id=null where id=w.id;
 insert into public.notifications(title,message,type) values('Payment confirmed',concat(o.client_name,' paid for ',w.brand,' ',w.model),'payment');
 return jsonb_build_object('duplicate',false,'order',to_jsonb(o),'watch',to_jsonb(w));
end; $$;

-- Admin edits must also honour payment holds (including direct database API edits).
create or replace function public.protect_checkout_hold() returns trigger language plpgsql set search_path=public as $$
begin
 if old.reserved_order_id is not null and new.reserved_order_id is not null then
  if new.status<>old.status or new.price<>old.price or new.brand<>old.brand or new.model<>old.model or new.reference is distinct from old.reference then
   raise exception 'An active checkout reserves this watch. Resolve the payment session first.';
  end if;
 end if;
 return new;
end; $$;
drop trigger if exists watch_checkout_hold on public.watches;
create trigger watch_checkout_hold before update on public.watches for each row execute function public.protect_checkout_hold();

revoke all on function public.reserve_watch_checkout(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.release_watch_checkout(uuid,text) from public,anon,authenticated;
revoke all on function public.complete_watch_checkout(uuid,uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.reserve_watch_checkout(uuid,jsonb) to service_role;
grant execute on function public.release_watch_checkout(uuid,text) to service_role;
grant execute on function public.complete_watch_checkout(uuid,uuid,text,integer,text) to service_role;
commit;
