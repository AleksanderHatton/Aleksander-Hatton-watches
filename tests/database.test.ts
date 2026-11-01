import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('migration and payment lifecycle on a real PostgreSQL engine',async()=>{
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role;create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;`);
 const schema=(await readFile('supabase/schema.sql','utf8')).replace('create extension if not exists pgcrypto;','');await db.exec(schema);
 const migration=await readFile('supabase/google-search-upgrade.sql','utf8');await db.exec(migration);await db.exec(migration);
 const ebayUpgrade=await readFile('supabase/ebay-integration.sql','utf8');await db.exec(ebayUpgrade);await db.exec(ebayUpgrade);
 const stock=await db.query<{id:string}>("insert into watches(brand,model,price) values('TAG Heuer','Aquaracer',795) returning id");const id=stock.rows[0].id;
 const reserve=()=>db.query<{r:any}>("select reserve_watch_checkout($1,$2) r",[id,JSON.stringify({client_name:'Test Buyer',client_email:'test@example.com'})]);
 const a=await reserve();const order=a.rows[0].r.order.id;
 await assert.rejects(reserve(),/no longer available/);
 await assert.rejects(db.query("update watches set status='Available' where id=$1",[id]),/active checkout/);
 await db.query("update orders set stripe_session_id='cs_test_1' where id=$1",[order]);
 await assert.rejects(db.query("select complete_watch_checkout($1,$2,'wrong',79500,'gbp')",[order,id]),/Session mismatch/);
 await assert.rejects(db.query("select complete_watch_checkout($1,$2,'cs_test_1',1,'gbp')",[order,id]),/amount mismatch/);
 const done=await db.query<{r:any}>("select complete_watch_checkout($1,$2,'cs_test_1',79500,'gbp') r",[order,id]);assert.equal(done.rows[0].r.duplicate,false);
 const again=await db.query<{r:any}>("select complete_watch_checkout($1,$2,'cs_test_1',79500,'gbp') r",[order,id]);assert.equal(again.rows[0].r.duplicate,true);
 await db.query("select release_watch_checkout($1,'cs_test_1')",[order]);
 const sold=await db.query<any>("select * from watches where id=$1",[id]);assert.equal(sold.rows[0].status,'Sold');assert(sold.rows[0].sold_at);
 const notifications=await db.query<any>('select count(*) n from notifications');assert.equal(Number(notifications.rows[0].n),1);
 await db.query("update watches set status='Available' where id=$1",[id]);const next=await reserve();await db.query('select release_watch_checkout($1)',[next.rows[0].r.order.id]);const available=await db.query<any>('select status from watches where id=$1',[id]);assert.equal(available.rows[0].status,'Available');
 const policies=await db.query<any>("select policyname from pg_policies where policyname in ('orders_owner_insert','valuations_owner_insert','sourcing_owner_insert','contacts_public_insert')");assert.equal(policies.rows.length,0);
 const permissions=await db.query<any>("select has_function_privilege('authenticated','public.reserve_watch_checkout(uuid,jsonb)','EXECUTE') allowed");assert.equal(permissions.rows[0].allowed,false);
 // A real authenticated SQL session cannot promote its own profile role.
 const profileId='99999999-9999-4999-8999-999999999999';
 await db.exec(`create or replace function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to authenticated;grant select,update on public.profiles to authenticated;`);
 await db.query("insert into auth.users(id,email,raw_user_meta_data) values($1,'role-test@example.com','{}')",[profileId]);
 await db.exec(`set request.jwt.claim.sub='${profileId}';set request.jwt.claim.role='authenticated';set session authorization authenticated;`);
 await assert.rejects(db.query("update profiles set role='admin' where id=$1",[profileId]),/Profile roles/);
 await db.exec('reset session authorization;');
 await db.close();
});
