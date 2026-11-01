# Validation — 30 October 2026

- TypeScript: `npm run lint` passed.
- Automated suite: all 20 tests passed, including the existing catalogue,
  payment lifecycle and profile-role protections with the eBay SQL upgrade applied.
- PostgreSQL tests: the additive upgrade can run twice; leases prevent checkout
  or a manual stock removal during a remote stock operation; late website edits
  remain queued; purchase conflicts retain the hold; private objects deny browser roles.
- eBay boundary tests: twelve photos and rejection of thirteen; XML escaping;
  authenticated encryption and tamper rejection; correct SKU/ItemID quantities;
  pausing before checkout and rechecking a purchase during the pause; recovery of
  a lost Add response without a second listing; server-side access-token refresh;
  rejection of forged OAuth callbacks; paginated account sales checks; fifty
  unchanged watches requiring one account request; preservation of manual pauses.
- Frontend: `npm run build` passed.
- Backend: all 11 non-helper function entrypoints bundled successfully with esbuild.
- Browser: synthetic admin data displayed twelve gallery slots and the condition
  choices, preserved an existing Mint label, and saved a separate £710.50 eBay price
  while the website price stayed £600. The temporary fixture is not shipped.

The eBay HTTP responses in automated tests were synthetic. The SQL tests ran in
PGlite/PostgreSQL. No production database, seller account or live listing was used.
Live OAuth consent, account policies, image acceptance, scheduled execution on
Netlify, payment expiry and actual cross-channel synchronisation still require
account-level acceptance testing before the integration is relied on.
