# Website update and eBay selling setup

The code is prepared, but it is not a live eBay connection yet. You must deploy
it, authorise your seller account and complete the first listing check. No real
eBay listing, order, credential or production database was changed during development.

## What changed

- The dealer console accepts **12 photographs**, including the cover, instead of 8.
  Uploads are processed three at a time to reduce browser memory use.
- New admin condition choices are **Fair, Good, Great, Excellent**. Existing
  labels such as Mint and Unworn remain visible until you choose another label.
  Their descriptions, photographs and public URLs are retained.
- “Also list on eBay” adds a separate eBay price, optional title, existing item
  ID and verified item specifics. A default percentage increase is optional.
- The eBay settings panel connects your seller, reuses business policies and
  controls automatic enrolment of newly uploaded watches.
- The integration uses the **Trading API** and single-watch, quantity-one,
  fixed-price, GBP, Good 'Til Cancelled listings in UK Wristwatches (31387).
  All four website grades map to eBay's pre-owned condition (3000). An Excellent
  pre-owned watch is never silently advertised as new.
- The scanner and deletion workflows on n8n do not need modification.

## 1. Apply the database upgrade

1. Keep a database backup before applying the upgrade.
2. Open the **existing website project** in Supabase → SQL Editor.
3. The previous `supabase/google-search-upgrade.sql` must already be installed.
   If you have not installed that earlier update, follow its existing deployment
   instructions first. Do not recreate the website's schema on top of its data.
4. Open `supabase/ebay-integration.sql` from this ZIP, paste its complete contents
   into the SQL Editor and run it.

This script is additive and repeatable. It creates four private tables, row
leases and stock guards. It does not rename watches, replace IDs, delete orders
or regrade existing watches. New publishing and automatic enrolment start OFF.
It is a SQL Editor upgrade script, not a command to reset your database.

The photo and condition changes can operate without connecting eBay. If the
eBay tables are missing, the admin shows setup instructions and unlinked shop
checkouts keep working.

## 2. Upload the updated source

Use your existing website repository and Netlify project. Unzip the download,
open its `Aleksander-Hatton-watches-main` folder, then upload/replace its contents
at the repository root. Keep the folder structure, including `src`, `netlify`,
`supabase`, `docs` and `tests`. Do not put another enclosing website folder inside
your existing repository. Include `package.json` and `package-lock.json`.

Continue using `npm run build`, publish directory `dist`, and functions directory
`netlify/functions`. These existing Netlify settings are retained. No change to
DNS, your main domain, the watch finder server or payment credentials is required.

Do not upload a real `.env` file or private keys. `.env.example` is a template.

## 3. Configure eBay on the server

In Netlify → your existing project → Environment variables, keep your existing
Supabase, Stripe and email values and add these **server-only** values. Scope
them to Functions and Production where the UI offers those choices, then redeploy.

| Variable | Value |
| --- | --- |
| `SITE_URL` | `https://www.ahwatches.com` (the exact public origin you use) |
| `EBAY_ENVIRONMENT` | `production` |
| `EBAY_CLIENT_ID` | Your existing Production App ID / Client ID |
| `EBAY_CLIENT_SECRET` | Your existing Production Cert ID / Client Secret |
| `EBAY_RUNAME` | The OAuth redirect URL name generated in eBay Developers |
| `EBAY_TOKEN_ENCRYPTION_KEY` | One private 64-character hexadecimal key |

You can reuse the eBay app used by the scanner. The scanner's application token
does not authorise selling; the new connection requires the seller consent below.
Never use a `VITE_` prefix for any eBay credentials or the encryption key.

To generate the encryption key locally, run `openssl rand -hex 32` in Terminal.
Copy its output directly into Netlify, and retain a private backup alongside your
other server secrets. Do not paste the key or Client Secret into chat or GitHub.
Do not generate a new key on every deployment. Changing it makes the saved tokens
unreadable until you reconnect the seller account.

In **eBay Developers → Application Keys → Production → User Tokens / redirect URL
settings**, add an OAuth redirect URL name (RuName) for this selling connection.
Choose OAuth rather than the older Auth'n'Auth method. Set the accepted callback
URL, and the declined callback URL if requested, to:

```text
https://www.ahwatches.com/api/ebay/callback
```

Use the same exact origin as `SITE_URL`. Copy eBay's generated **RuName**, not the
literal HTTPS callback address, into `EBAY_RUNAME`. The code requests the base
`https://api.ebay.com/oauth/api_scope` user permission used by the Trading API.

Leave your existing n8n marketplace-account-deletion endpoint and verification
token unchanged. This is a separate seller sign-in callback.

## 4. Connect the seller and policies

1. Open your website's dealer console at `/admin` and expand **eBay connection**.
2. Click **Connect eBay seller** and authorise your actual business seller account
   on eBay. You return to the dealer console when finished.
3. Leave **Allow publication and content updates** OFF during setup.
4. If you already have a suitable watch listed on eBay, paste its numeric item ID
   into **Reuse settings from one of your existing eBay watch listings** and click
   **Load listing settings**. This reads your payment, postage and returns policy
   IDs, plus its dispatch location. Check every value before saving.
5. Alternatively, enter your three existing business policy IDs manually. If your
   seller has no business policies yet, set those up in Seller Hub first.
   The postage policy here is a default for **new** listings. You can create
   separate eBay policies with different delivery services and buyer-paid charges
   (for example, £5 delivery and £20 insured delivery). When adding a watch, enter
   the appropriate numeric ID in **Postage policy ID for this watch**. A blank
   value uses the default. The website does not quote courier or insurance costs.
   Once a listing exists, edit its postage in eBay: website content updates retain
   its existing payment, postage and returns policies and postage-cost overrides.
6. Enter your **actual dispatch** town and postcode, not a virtual registered-office
   address that does not dispatch the watches. Save the eBay defaults.
7. In eBay's **Selling preferences**, enable **Out-of-stock control** yourself.
   This is an account-wide setting affecting existing and future listings. The
   integration checks it and does not enable it silently. It lets quantity-zero
   listings remain active but hidden while a website buyer is checking out.

Seller tokens are encrypted in a private Supabase table. They are never returned
to the browser. Expired access tokens refresh automatically; revoked or expired
refresh authorisation requires **Reconnect eBay seller**. Keep the same connected
seller and environment while linked listings exist.

## 5. Check one watch, then enable automatic publication

1. Start with one complete, accurately described watch. Upload its actual photos,
   select its condition and disclose wear, repairs and known faults.
2. Tick **Also list on eBay**. Set the separate eBay price and verified specifics.
   For a new listing, choose its postage policy ID if it needs a different
   buyer-paid charge or delivery service from the default. Check the actual
   delivery charge in eBay before enabling automated publication for other stock.
   If the generated brand/model/reference title would exceed 80 characters, enter
   a shorter eBay title. The code reports an error instead of truncating it.
3. **If this exact watch is already on eBay, enter that existing item ID.** It must
   belong to the connected seller and be an unsold, single-watch fixed-price listing.
   An existing physical watch must not be published as a second listing by mistake.
4. Save the watch. Website saving completes independently; any eBay settings failure
   appears as a warning. Reopen the saved watch rather than adding it a second time.
5. Click **Check eBay requirements** on its inventory card. This uses eBay's
   `VerifyAddFixedPriceItem` and does not publish a listing. It reports missing
   specifics, policy problems, photo problems, warnings and estimated listing fees.
   eBay's actual fee may differ at publication, and transaction fees are separate.
6. Correct any errors and repeat the check. Do not guess missing specifications.
7. When ready, enable **Allow publication and content updates**, save the defaults,
   then click **Sync eBay now** for that watch. This button can create a live listing
   when the watch is enrolled and publication is enabled.
8. Check the eBay link, title, price, all photos, condition, postage and returns in
   Seller Hub. Confirm that the live listing represents this actual watch.
9. To make the routine automatic, enable **Tick “Also list on eBay” automatically
   for new watches**. Set a default price increase if wanted. Each new watch can
   still override its eBay price or untick the eBay option before saving.

Existing website watches are not enrolled just because you turn on this default.
Open and enrol them individually, linking existing eBay item IDs where appropriate.
Missing or invalid details leave a visible error instead of an assumed successful
listing. New code alone does not publish all your stock.

## Stock behaviour and practical limits

| Event | Result |
| --- | --- |
| New enrolled watch saved | Queued; the worker validates and publishes when enabled. |
| Website checkout starts | Atomically reserves the watch, pauses eBay quantity, rechecks stock, then creates the payable Stripe session. An uncertain check stops checkout. |
| Website payment succeeds | Existing Stripe webhook records the sale. eBay remains unavailable. |
| Stripe confirms expiry/failure | Existing release logic makes the watch available; the worker can restore an unsold listing that this integration paused. Closing the payment tab alone does not release it immediately. |
| eBay purchase appears | Sales polling finds the linked ID, verifies its listing, then makes the website watch unavailable. It is not added as a paid website order or website revenue. |
| Purchase conflicts with a website payment hold | The watch stays reserved; an urgent dealer notification asks you to check eBay and Stripe before fulfilment. |
| Watch marked Reserved or Sold manually | A queued stock update pauses its linked eBay listing. This is asynchronous, so check the eBay status for urgent changes. |
| “Also list on eBay” unticked | Its existing listing is paused, retaining the item ID/history. It does not delete the eBay listing. |
| Listing manually paused/ended on eBay | A manual pause is respected. An ended listing is not relisted automatically. |
| Saved website description/photos changed | Those changes queue an eBay content revision when publication is enabled. |

Sales are checked once per minute with an account-level request, with overlap and
pagination. A bulk active-stock comparison runs every ten minutes; changed watches
receive targeted checks. A minute is a schedule, not a guaranteed delivery deadline:
provider delays, queues, outages and revoked access can make updates take longer.
The checkout safeguard reduces double-sale risk, but two independent marketplaces
cannot offer an absolute cross-platform transaction guarantee. Check both channels
before fulfilment, especially if the console shows errors.

For an ordinary account needing one page per check, the baseline is about 1,440
sales calls plus 144 bulk checks per day, plus listing, checkout and retry calls.
Large accounts need additional pages. Check your own eBay app's call allowance and
Netlify usage. The worker handles up to 100 changed watches per batch and reads up
to 1,000 linked records; larger inventory needs extended batching/pagination. Normal
eBay fees, possible GTC renewals, hosting usage, photo storage and bandwidth remain
your responsibility. Twelve photos can take longer to upload than eight.

Do not rely on editing an eBay quantity outside this integration to represent a
website sale. The website remains the source of its own availability. A manual
Seller Hub restock of a sold website watch can create a temporary stock conflict
until reconciliation detects it.

## Managing listings afterwards

- Trading API listings remain in the traditional listing model. They are not
  migrated into the Inventory API model that restricts editing to that API.
- Scheduled stock checks do not overwrite Seller Hub titles/descriptions/prices.
  **Saving an enrolled website watch can overwrite those fields, photos and
  specifics on its linked eBay listing.** Keep permanent content edits in the
  website. Existing payment, postage and returns policies, including per-listing
  postage-cost overrides, are retained from the current eBay listing during
  content revisions. Change those settings in Seller Hub.
  Seller Hub edits are not imported into the website automatically.
- The generated description includes the watch description and verified notes.
  It contains no instruction to buy off eBay or avoid eBay fees.
- This version does not import buyer details, shipping addresses, payments,
  tracking, offers, messages or refunds into the shop. Fulfil eBay orders in Seller
  Hub. Buyer details are not stored by the sales polling code.
- Returns, cancellations, relisting and refunded website sales need manual review.
  Historical eBay purchases are not silently reversed into available website stock.
- An eBay-linked watch is retained for stock history. Use Sold/Reserved rather than
  deleting its website record. It cannot be rebound to another item ID by accident.
- Existing Inventory API listings, auctions, variations and multi-quantity listings
  are outside this integration's supported linking model.

## Checks, troubleshooting and rollback

Run `npm ci` followed by `npm run check`. Tests use synthetic eBay responses and a
local PostgreSQL engine. They do not use real credentials or make live listings.
**Live seller authorisation, Netlify scheduling, eBay acceptance and the complete
cross-channel flow still need checking in your account.** Prefer a separate sandbox
seller, Supabase test project and Stripe test environment for full payment/expiry
testing. Do not switch the environment of a database with existing live links.

In the console check the seller name, worker timestamp, successful sales-check
timestamp, global worker error and each watch's status/error. A started worker alone
does not prove a successful sales check. Netlify runs schedules on published
production deploys; deploy previews cannot perform production eBay mutations.

If a listing remains queued, check publication is enabled, the watch is Available,
its eBay checkbox is ticked, the seller is connected, and the worker has run. After
fixing an error, use **Sync eBay now**; automatic error retries back off to fifteen
minutes unless another saved change queues the record sooner.

If eBay is down or the seller connection expires, linked website checkouts may be
blocked until availability can be verified. This deliberately avoids charging a
buyer when the same watch might still sell elsewhere.

To stop new publishing, turn off publication in the console. Existing linked stock
checks continue. Before removing the integration, manually reconcile and pause/end
its eBay listings. Restoring old website code alone removes its checkout safeguard;
it does not end existing eBay listings. Keep the additive private tables and the
encryption-key backup until all links and outstanding payments are resolved.

Official references: [Trading AddFixedPriceItem](https://developer.ebay.com/devzone/xml/docs/Reference/ebay/AddFixedPriceItem.html),
[verification](https://developer.ebay.com/devzone/xml/docs/Reference/ebay/VerifyAddFixedPriceItem.html),
[OAuth](https://developer.ebay.com/develop/guides/sell/authorization),
[out-of-stock control](https://www.developer.ebay.com/api-docs/user-guides/static/trading-user-guide/out-of-stock-enable.html),
[seller transactions](https://developer.ebay.com/devzone/xml/docs/reference/ebay/getsellertransactions.html).

