# Google website upgrade: changes and validation

Prepared 8 October 2026. This is an implementation handover, not a live-site or Google-account approval.

## Included changes

- Public pages now return visible catalogue content, unique titles, descriptions, canonical URLs and structured data in the first HTML response.
- Existing `/watch/:id` URLs remain valid. Available, reserved and sold watches have distinct behaviour. Sold pages retain their content and connect visitors to current stock, sourcing and valuations.
- Navigation uses real links. Collections support pagination and reference search; missing pages return 404 instead of a duplicate home page.
- A database-driven sitemap includes useful sold pages. The scheduled Merchant Center feed includes accurate live availability, original photographs and verified identifiers where supplied.
- Sell Your Watch pages cover TAG Heuer, Longines, Breitling and Tudor. Two watch guides, clearer policies and contact paths are included.
- Watch-specific enquiries carry the original reference and stock ID into sourcing, valuation and contact forms.
- Mobile layouts, form feedback and accessible labelling have been improved. The dealer dashboard supports optional verified specifications, warranty notes and product identifiers.
- Checkout reserves each individual watch. Database transactions protect against overlapping purchases and repeated payment events. Expired reservations and missed events have a reconciliation path.
- Database permissions prevent customer role escalation and unauthorised direct enquiry/order inserts. Server-only credentials stay out of client code.

## Verification completed

| Check | Result and scope |
| --- | --- |
| TypeScript | `npm run lint` passed. |
| Automated tests | All 7 tests passed with `npm test`; catalogue behaviour, canonical URLs, structured data, feeds, sitemap and database/payment transitions were covered. |
| Database migration | Applied twice in an isolated PGlite PostgreSQL engine. Reservation conflicts, mismatched payment data, duplicate events, paid-stock protection, permissions and customer role escalation were exercised. |
| Production build | `npm run build` passed. |
| Desktop/mobile browser | Chromium checks passed at desktop width and 390px mobile width; no uncaught page errors were observed. The mobile product page had no horizontal overflow. |
| Enquiry forms | Sourcing, valuation and contact submissions reached a local mock endpoint with the expected watch context. Success messages and prefilled references were checked. |
| Product states | A sold product had no purchase button; an available product opened the checkout form. Unknown routes returned HTTP 404. |

The browser preview used synthetic watches and mocked form endpoints. It did not write to the business database, send customer emails, perform a Stripe transaction, or access Google accounts. These checks do not replace the live integration checks below.

## Before launch

Follow [DEPLOYMENT_GOOGLE_SETUP.md](DEPLOYMENT_GOOGLE_SETUP.md) in order. In particular:

1. Back up the existing database and apply `supabase/google-search-upgrade.sql` before deploying the code. Resolve outstanding sessions from the previous checkout implementation during cutover.
2. Preserve the existing Netlify site/domain, set the required environment variables, and confirm the server functions are deployed.
3. Verify real company/contact details, delivery charges and timings, returns arrangements, product photographs and any warranty claims.
4. Run a complete Stripe sandbox purchase with the four documented webhook events; confirm one paid order, one sold watch, customer/admin notifications and shipping details. Exercise an expired session and a repeated webhook. Check the reconciliation function's logs.
5. Test each enquiry form and image upload against the intended Supabase and email configuration. Verify account/admin access with the appropriate roles.
6. Inspect live HTML and test live product URLs in Google's Rich Results Test. Verify Search Console ownership and sitemap fetching.
7. Connect Merchant Center, configure shipping/returns, fetch the product feed and confirm available/reserved/sold transitions. Google feed processing is scheduled, not instant.

The code is ready for deployment review. Live deployment, database migration, payment testing, Google verification, indexing and Merchant Center approval remain unperformed.
