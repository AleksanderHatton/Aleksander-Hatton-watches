# Aleksander Hatton Website

Production website for Aleksander Hatton Watches using:

- Netlify for hosting and serverless API routes
- Supabase Auth, Postgres and Storage
- Stripe Checkout for payments
- Resend for transactional email

## 1. Install

```bash
npm install
```

## 2. Create or update Supabase

Open **Supabase Dashboard > SQL Editor**.

For a new project, run:

```text
supabase/schema.sql
```

For an existing project that already has the database tables, run this once as well:

```text
supabase/storage-setup.sql
```

That creates:

- `watch-images` — public catalogue photography
- `valuation-photos` — private customer photography

Both buckets accept JPEG, PNG and WEBP files up to 6 MB after browser compression. Original files up to 12 MB are accepted by the browser uploader.

The browser now compresses photos and uploads them directly to Supabase Storage using short-lived signed upload URLs. The Netlify function receives only small JSON records and storage paths, avoiding the previous `Request body too large` failure.

## 3. Create your admin account

Register through the website, then run:

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_EMAIL@example.com';
```

Only admin/dealer accounts can edit stock, see all customer submissions and use the dealer dashboard.

## 4. Environment variables

Copy `.env.example` to `.env` locally. Add the same variables in **Netlify > Site configuration > Environment variables**:

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

Use Stripe test keys first. In **Stripe Developers > Webhooks**, add:

```text
https://YOUR_SITE.netlify.app/.netlify/functions/stripe-webhook
```

Listen for:

```text
checkout.session.completed
```

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

Payment flow:

1. Customer starts checkout.
2. The Netlify function creates a Stripe Checkout Session using the database price.
3. Stripe takes payment.
4. The webhook confirms payment.
5. The order changes to `Paid` and the watch changes to `Sold`.

## 6. Run locally

Frontend only:

```bash
npm run dev
```

Frontend plus Netlify Functions:

```bash
npx netlify-cli dev
```

The app uses routes including:

```text
/api/stock
/api/uploads/sign
/api/valuations
/api/sourcing
/api/orders
```

Netlify rewrites these to `netlify/functions`.

## 7. Deploy to Netlify

Import the repository from GitHub and use:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

Netlify should detect `netlify.toml` automatically.

## Upload architecture

- Catalogue and valuation images are resized and converted to efficient JPEGs in the browser.
- Selected photos upload directly to Supabase in parallel for faster batches.
- Catalogue images use public URLs.
- Valuation photos stay private; the API returns temporary signed read URLs to authorised users.
- Listing and valuation API bodies contain URLs or storage paths, never base64 image data.
