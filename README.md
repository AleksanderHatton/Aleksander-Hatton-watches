# Aleksander Hatton Website

This version has been refactored away from the unsafe local `server.ts` / `data_db.json` prototype pattern.

It now uses:

- Netlify for hosting
- Netlify Functions for backend routes
- Supabase for Auth + Postgres database
- Stripe Checkout for real payments
- Resend for email notifications

## 1. Install

```bash
npm install
```

## 2. Create Supabase project

Go to Supabase, create a project, then open:

```text
Supabase Dashboard > SQL Editor
```

Paste and run:

```text
supabase/schema.sql
```

This creates:

- profiles
- watches
- valuations
- sourcing_requests
- orders
- contacts
- notifications

It also creates a trigger so new user signups automatically get a profile.

## 3. Create your admin account

Start the site, register using your real admin email, then go back to Supabase SQL Editor and run:

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_EMAIL@example.com';
```

Only admin/dealer accounts can edit stock, see all customer submissions, and see the full dashboard.

## 4. Environment variables

Copy `.env.example` to `.env` locally.

For Netlify, add the same variables in:

```text
Netlify > Site configuration > Environment variables
```

Required variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
VITE_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
EMAIL_FROM
ADMIN_EMAIL
SITE_URL
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` in frontend code.

## 5. Stripe setup

Create a Stripe account.

Use test keys first:

```text
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

In Stripe Developers > Webhooks, add this endpoint:

```text
https://YOUR_SITE.netlify.app/.netlify/functions/stripe-webhook
```

Listen for:

```text
checkout.session.completed
```

Copy the webhook signing secret into:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

Payment flow:

1. Customer clicks checkout.
2. Function creates a Stripe Checkout Session using the database price.
3. Customer pays on Stripe.
4. Stripe webhook confirms payment.
5. Order changes to `Paid`.
6. Watch changes to `Sold`.

## 6. Run locally

For frontend-only testing:

```bash
npm run dev
```

For functions + frontend testing, use Netlify Dev:

```bash
npx netlify-cli dev
```

The app expects API routes like:

```text
/api/stock
/api/valuations
/api/sourcing
/api/orders
```

Netlify rewrites these to the functions in `netlify/functions`.

## 7. Deploy to Netlify

Push to GitHub, then in Netlify:

```text
Add new site > Import from GitHub
```

Use:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

Netlify should detect `netlify.toml` automatically.

## 8. Important notes

This fixes the big broken parts:

- no local JSON database
- no plaintext passwords
- no hardcoded dealer password
- no fake paid orders
- no manual Stripe payment links required
- no Express server required

Photo uploads from the valuation form are currently stored in the `photos` JSON column. That works for early testing, but for a serious live site you should move those images into Supabase Storage before taking real customer uploads at scale.
