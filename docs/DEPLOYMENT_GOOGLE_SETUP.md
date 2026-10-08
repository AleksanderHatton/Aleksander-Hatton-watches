# Aleksander Hatton: deploy and connect Google

This archive updates the existing Vite + Netlify + Supabase website. It does not deploy itself or configure your Google accounts. The public catalogue retains `/watch/:id` URLs. Customer accounts, the dealer dashboard, upload storage and Stripe-hosted Checkout remain supported.

## 1. Apply the database upgrade before deploying

1. Back up your existing Supabase database.
2. Open Supabase → SQL Editor and run **`supabase/google-search-upgrade.sql`**.
3. For an existing business database, do **not** recreate it or import demo data. The upgrade preserves watch IDs, photos, orders and enquiries.
4. For a brand-new project only, run `supabase/schema.sql`, then `supabase/storage-setup.sql`, then `supabase/google-search-upgrade.sql`.

The upgrade adds optional specifications, modification dates and checkout reservations; prevents customers promoting themselves to admin; and makes payment/stock updates atomic. Re-running the upgrade is supported. Do not run the old base schema after the upgrade: it recreates old policies.

Before switching payment code, pause checkout briefly and expire outstanding old open Checkout Sessions in Stripe. The old implementation did not reserve watches. Investigate any completed but unpaid sessions before switching; don't release a watch awaiting a delayed payment. This prevents old payment sessions colliding with the new reservation system. Fulfil already-paid orders as normal.

## 2. Upload the code and deploy

Replace the files in the GitHub repository with the contents of the updated project folder. Keep `.env` and credentials out of GitHub. Commit the updated `package-lock.json` as well as the code. Keep the same connected Netlify site and custom domain.

- Node: use Node 22 or newer.
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Configuration: `netlify.toml` must remain at the project root.

Use Netlify's normal Git deployment. A static-file-only host or `vite preview` cannot provide the server-rendered pages, feeds or API. The page function includes the generated `dist/index.html` template in its deployment bundle. There is no Shopify migration.

Preserve existing working environment variables. Set these on Netlify for build and/or function scope as appropriate:

| Setting | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Public frontend authentication/storage configuration; required at build time |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Server database access; server only |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Server payment credentials; a restricted key with the required Checkout read/write permissions is preferred |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` | Transactional email; use your verified sending domain |
| `SITE_URL` | Exact production origin, e.g. `https://www.ahwatches.com`, with no path or trailing slash |
| `BUSINESS_LEGAL_NAME`, `BUSINESS_COMPANY_NUMBER`, `BUSINESS_CORRESPONDENCE_ADDRESS` | Verified trading/legal details displayed publicly |

Netlify deploy previews/branch deploys receive noindex signals and do not expose a Merchant Center feed. Use separate test credentials/database for preview deployments. On production, confirm HTTP→HTTPS and your chosen primary hostname in Netlify domain settings. The code's canonical URLs use `SITE_URL`.

Run `npm ci` and `npm run check` locally for type checking, automated tests and a production build. For a full local backend preview, install Netlify CLI and run `npm run build` followed by `netlify dev`. `npm run dev` alone serves the frontend and requires a backend for data.

## 3. Required Stripe webhook events

Keep the endpoint at:

`https://www.ahwatches.com/.netlify/functions/stripe-webhook`

Enable all four events, using the real deployed domain if different:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Test in a Stripe sandbox before live use. There are no live keys or live payments in the automated tests supplied here.

Checkout now reserves the individual watch atomically and creates a 30-minute payment session. Other buyers cannot start a session for the same watch. A verified paid event marks the order Paid and the watch Sold once; repeat events have no extra stock effect. Complete but unpaid sessions stay reserved while awaiting delayed payment. Failed/expired sessions release their own reservation only.

A Netlify scheduled function, `reconcile-checkouts`, checks older pending orders every 15 minutes. It can recover a paid order, release an expired session or investigate a missing session through Stripe. It never releases a completed/unpaid session just because time has passed. A recovered payment creates an admin notification to contact the customer and check shipping details. Review Netlify function logs and dashboard notifications for unresolved conflicts. Payment emails are best effort; the saved order is the source of truth.

Checkout collects a UK shipping address through Stripe. Confirm your actual delivery charges and timings before launch. The code adds no new shipping charge, tax registration or warranty term. Your Merchant Center shipping settings must match checkout. Free delivery should only be configured if that is your intended offer.

## 4. Search Console

1. Open Google Search Console using the business-owned Google account.
2. Add the real domain property and verify it using the DNS record Google supplies.
3. Submit `https://www.ahwatches.com/sitemap.xml`.
4. Inspect the home page, one available watch, one sold watch, a brand collection and Sell Your Watch. Run the live URL test and inspect rendered HTML.
5. Request indexing for a few important URLs after verification. It is not an instant-indexing guarantee.

The sitemap reads live database records, includes useful sold listings and brand/category pages, and uses modification dates. It fetches beyond the old 1,000-row limit and can return a sitemap index when large. A database outage returns 503 rather than an empty successful sitemap. Product/page URLs do not require renaming.

## 5. Merchant Center free listings

1. Create/use the business-owned Merchant Center account and verify/claim the same website.
2. Enter truthful business information, contact details, shipping coverage, costs, processing/delivery times and return settings.
3. Add a **scheduled URL product data source** pointing to `https://www.ahwatches.com/products.xml`. Choose the most frequent fetch schedule available and run an initial fetch.
4. Enable free listings and review account-level and product-level issues. Paid ads are optional and are not configured here.
5. Test an available watch, reserve it, then mark an example permanently Sold. Fetch again and verify the corresponding offer is removed. Configure this as a complete replacement data source, not an incremental append-only upload. Keep no second source auto-recreating sold offers.

The feed uses stable stock IDs, GBP prices, actual photos, used condition, and correct `in_stock`/`out_of_stock` values. Permanently sold watches are omitted from the live feed; their website pages remain in the organic archive. Empty-photo records and legacy Unsplash stock-photo placeholders are excluded. Supply valid manufacturer identifiers where they exist. Do not set `identifier_exists=false` just because a barcode is unknown. The editor includes optional verified MPN/GTIN fields.

**Timing limitation:** the feed changes as the database changes, but Google only sees a scheduled feed on its next fetch/processing pass. This is not an instant push integration. Enable Google's automatic item updates as a secondary check where available and use Fetch now after urgent changes. If sales volume demands faster propagation, add authenticated Merchant API offer updates later. Google displays may lag; checkout still enforces availability immediately.

Existing Google Search/Shopping approvals cannot be verified from a ZIP. Use Google's Rich Results Test on the live product URLs and resolve critical issues. Policy/business details, accurate photos and a working checkout matter as well as markup. Review any AI image/title/description disclosure or metadata requirements applicable to your assets; the feed does not invent proof of asset provenance.

## 6. Catalogue workflow

- Add each physical watch as a new record. Do not overwrite an older sold watch just because its reference matches.
- Enter the exact verified reference, honest condition notes, original photos, box/papers and current GBP price.
- Optional fields: movement, case size, dial colour, material, service/inspection notes, actual warranty terms, MPN and GTIN. Leave unknowns blank.
- Mark an off-platform sale **Sold** in the dealer dashboard immediately. A Stripe sale does this automatically. Do not delete sold listings.
- A stock item with an active payment hold cannot have its price/availability changed until the payment is resolved. Do not manually sell it elsewhere during that hold.
- Sold listings retain the original photos and description. Their previous asking price is labelled **Last advertised at**, not an asserted transaction price.
- Archive pages link buyers to current stock or sourcing and owners to valuations, carrying the reference and stock ID into the form.
- A returned watch can be made Available again once checked and ready; update condition/photos before offering it.

Unknown product URLs return 404. Useful sold pages stay 200. Search results and account/admin pages are noindex. Product schema uses the physical stock ID as SKU, not the model reference. No fake review stars, full serials, manufacturer warranties or showroom opening hours are generated.

## 7. Business copy to confirm

The old product template asserted universal 24-month certification, in-house servicing and audited provenance. Those unsupported blanket statements have been removed. Real inspection/warranty information can be entered per watch. The business uses Organization markup, with no fabricated walk-in premises.

Review the public delivery, returns, warranty, privacy and terms pages in `src/shared/content.ts` against your actual operation. Add your verified company/address information above. Confirm return postage arrangements, delivery timings, retention practices and any specific warranties before launch; generic copy is not a substitute for your final business terms. Do not claim Business Profile/Maps eligibility while operating only online. Reassess eligibility if your actual in-person business model changes.

Two practical watch guides and four brand buying pages are included. No guessed CAF7010 specifications or invented market-price guide has been published. Add reference-specific guides only with verified information and meaningful experience/photos.

## 8. Review after launch

Weekly initially: check Search Console indexing issues, sitemap fetches, Merchant Center diagnostics and live stock accuracy. Monthly: compare watch-reference queries, buying/selling intent queries, landing-page clicks, qualified valuation leads and completed purchases. Search Console/Google account data is not accessible from the repository alone.

No advertising pixels or third-party analytics scripts have been installed. The existing dealer dashboard still records sales and enquiries. If you add analytics, configure consent as required, exclude personal details, and record confirmed payments once rather than treating a success URL as payment proof.

Useful official references:

- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- https://support.google.com/merchants/answer/6324448
- https://support.google.com/merchants/answer/7052112
- https://support.google.com/business/answer/13763036
- https://docs.stripe.com/checkout/fulfillment
- https://docs.netlify.com/build/configure-builds/file-based-configuration/
- https://www.gov.uk/accepting-returns-and-giving-refunds
