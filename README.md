# Aleksander Hatton Watches

Vite / React storefront, Netlify server-rendered public pages and functions, Supabase inventory/accounts/storage, Stripe Checkout and Resend notifications.

**Start with [docs/DEPLOYMENT_GOOGLE_SETUP.md](docs/DEPLOYMENT_GOOGLE_SETUP.md).** Run the additive database migration before deploying. That guide covers updating an existing site, the required Stripe webhook events, Search Console, Merchant Center and final business-policy checks.

See [docs/CHANGES_AND_VALIDATION.md](docs/CHANGES_AND_VALIDATION.md) for the changes delivered, completed checks and remaining live checks.

```sh
npm ci
npm run check
```

`npm run check` runs TypeScript, catalogue/payment database tests and the Vite production build. Node 22+ is recommended. For local API-backed development, use Netlify CLI with `netlify dev` after building. A Vite-only preview does not serve backend functions.

Canonical source:

- `src/App.tsx`: browser interactions, existing account/admin components and enquiry forms
- `src/components/Storefront.tsx`: shared public page layout, used by both server and browser
- `src/shared/catalogue.ts`: routes, identity, metadata and product schema
- `src/shared/content.ts`: guides, buying information and public policies
- `netlify/functions/page.ts`: server HTML for public routes
- `netlify/functions/_catalogue.ts`: public data queries and pagination
- `netlify/functions/sitemap.ts`, `products-feed.ts`, `robots.ts`: Google discovery endpoints
- `netlify/functions/create-checkout-session.ts`, `stripe-webhook.ts`, `reconcile-checkouts.ts`: reserved inventory and payment lifecycle
- `supabase/google-search-upgrade.sql`: additive database upgrade and security corrections
- `tests/`: synthetic data only; never import these fixtures into production

Copy `.env.example` to a private local `.env` if needed. Set production credentials through Netlify configuration. Never commit service-role keys, Stripe secrets or email keys. The old top-level TSX/functions duplicates are compatibility exports; edit the canonical files above.

This archive supplies implementation code. No live deployment, database migration, payment transaction or Google account setup has been performed for you.
# Website and eBay update

This version allows 12 watch photographs and offers Fair, Good, Great and
Excellent in the admin condition selector. Existing labels are preserved.

**Before deploying:** follow [docs/EBAY_SETUP.md](docs/EBAY_SETUP.md), starting
with the additive SQL upgrade. eBay publishing starts disabled and needs a
separate seller authorisation. No credentials are included in this ZIP.

The eBay backend runs on Netlify alongside the shop. Your n8n watch finder
does not need changes. See the setup guide for stock handling and limitations.

