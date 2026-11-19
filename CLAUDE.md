# Movata — project notes for Claude Code

Movata is a running-streak / runner-profile app. Built with Dyad, deployed on Vercel
(https://movata.vercel.app) from GitHub `JDSWOBODA/movata` (`main`). The project was formerly
called RunStory (`DabbleJ/runstory`); that repo is retired, so don't push there.

## Stack
- Vite + React 19 + TypeScript, React Router (routes live in `src/App.tsx`), Tailwind, shadcn/ui,
  TanStack Query, sonner toasts. Follow `AI_RULES.md` (Dyad's conventions).
- Replacement Supabase project ref `ufazcckldxznchatctrt` (client in `src/integrations/supabase/client.ts`,
  auto-generated, don't edit). Edge functions in `supabase/functions/`, SQL in `supabase/migrations/`.
- Stripe: `create-stripe-checkout`, `stripe-webhook` functions (a $3/yr plan, currently not enforced).

## Strava integration (added Nov 2026)
- `supabase/functions/strava-oauth`: starts OAuth (POST, user JWT) and handles Strava's redirect (GET).
  Stores AES-GCM–encrypted tokens in `provider_connections`. Must be deployed with JWT verification OFF
  (`supabase/config.toml`, or the dashboard toggle).
- `supabase/functions/strava-sync`: POST `{action:"sync"}` pulls the athlete's runs
  (`/athlete/activities`, paginated, refreshes tokens) into `strava_activities`.
  POST `{action:"disconnect"}` deauthorizes and deletes all of the user's Strava data.
- Front end: `src/lib/strava.ts`, `src/hooks/use-strava.ts`, `src/lib/activity-stats.ts`. The dashboard
  (`src/pages/Dashboard.tsx`) shows real runs when connected and falls back to labeled sample data.
  `RunCard` shows "View on Strava".
- Paywall is off for testing: `STRAVA_REQUIRES_SUBSCRIPTION` in `src/lib/strava.ts` plus the
  `STRAVA_REQUIRE_SUBSCRIPTION` secret.
- Function secrets: `APP_URL`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_STATE_SECRET`,
  `STRAVA_TOKEN_ENCRYPTION_KEY` (never rotate the last one, or stored tokens become unreadable).
- Setup checklist: `STRAVA_SETUP.md`.

## Strava API Policy constraints (don't break these)
- Strava data may be shown **only to the athlete who owns it**. Public profile pages (`/:username`,
  `RunnerProfile.tsx`) must not read Strava data, including derived stats like streaks and totals.
  Public profiles should use CSV/manual data (e.g. the athlete's own Strava bulk-export uploaded as CSV).
- Cache Strava data at most 7 days: every sync re-stamps `fetched_at`, and `purge_stale_strava_cache()`
  deletes older rows. Reflect deletions within 48h. No AI/ML use of Strava data.
- New Strava apps allow 1 athlete (up to 10 without review); more needs Strava's approval.
- Follow Strava brand guidelines (attribution, "View on Strava" links, no "Strava" in the app name).

## Status / next steps after Supabase recreation
1. Rebuilt in the replacement project: `provider_connections`, `billing_subscriptions`,
   `strava_activities`, and the service-role-only purge helper. RLS and explicit grants are in place.
   This restores schema only, not deleted users or records.
2. To do: restore Auth redirect settings and function secrets, update the Strava callback domain
   to `ufazcckldxznchatctrt.supabase.co`, confirm automatic function deployment, and test a new account.
   If using Stripe, update its webhook endpoint and reconcile existing subscriptions to new Auth IDs.
   See `STRAVA_SETUP.md` for details. Do not rely on the historical migration alone for restored grants.
3. Later: real CSV import + manual entry, wire public profiles to non-Strava data, profile editor,
   Strava webhook for deauthorization/deletion events, decide on the paywall.
