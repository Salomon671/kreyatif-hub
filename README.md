# Kreyatif Hub

Kreyatif Hub is a creator marketplace for independent artists, creative services, physical products, and digital documents.

## Files on `v1-build`

- `index.html` — responsive French landing page and authentication dialog
- `styles.css` — responsive styling
- `app.js` — Supabase authentication, public listing retrieval, search and category interactions
- `supabase-client.js` — browser-only project URL and publishable key
- `supabase/rls-audit.sql` — read-only SQL queries to inspect Row Level Security and grants

## Supabase integration status

The browser uses Supabase JS v2 and supports:
- Sign-up with email/password
- Sign-in and sign-out
- Persisted sessions
- Loading published listings from `public.listings`
- Searching loaded listings by text/category

The app currently expects `public.listings` to have a `status` column with the published value `published`. It attempts to render common fields such as `title`, `description`, `category`, `listing_type`, `price`, `image_url`, and `created_at`. If your actual schema differs, update the query/rendering after checking the table definitions.

## Important: RLS and production readiness

This front end does **not** replace database security. The Supabase publishable key is meant for browser use, but only when RLS and storage policies correctly limit access. Run `supabase/rls-audit.sql` in the Supabase SQL Editor and inspect the results before launch. Do not disable RLS to make the app work.

Never put a Supabase `service_role` key, `sb_secret_*` key, database password, or other server secret in this repository or browser code.

The following features are not implemented yet: creator shop creation/editing, listing submission and image upload, buyer/seller messaging, admin dashboard, report moderation, checkout and real payments. Authentication success alone does not grant seller or admin privileges. Admin permissions must be enforced in database policies or trusted server-side code.

## Test locally

Open `index.html` in a browser or serve the folder through a static web server. The browser needs internet access to load the Supabase JS CDN and reach Supabase.

## Launch approach

The first release is planned to be free to use with no platform commission. Do not accept real payments until server-side validation, provider integration, refunds, and security controls have been implemented and tested.
