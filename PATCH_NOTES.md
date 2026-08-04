# Website patch notes — 4 August 2026

## Fixed

- Removed base64 photo data from Netlify API requests, which caused `Request body too large` errors.
- Added browser-side image resizing/compression and direct signed uploads to Supabase Storage.
- Added parallel uploads with progress feedback for catalogue and valuation photos.
- Kept catalogue images public and valuation photos private with temporary signed viewing URLs.
- Added a proper loading/disabled state to **Commit Edits**, publishing, refresh, delete, checkout, valuation and sourcing actions.
- Stopped dealer notes from saving on every keystroke; they now save explicitly.
- Updated the business phone number everywhere to `+44 7469 478871`.
- Replaced the thin typography with Manrope for body text and Marcellus for display headings.
- Restyled the cabinet login modal to a white interface matching the main website.
- Replaced cream photo frames with neutral zinc borders and backgrounds.

## Required before deployment

Run `supabase/storage-setup.sql` once in the Supabase SQL Editor, then redeploy the Netlify site.
