# Movata — project notes for Claude Code

Movata is a running-streak / runner-profile app. Built with Dyad, deployed on Vercel
(https://movata.vercel.app) from GitHub `JDSWOBODA/movata` (`main`). The project was formerly
called RunStory (`DabbleJ/runstory`); that repo is retired, so don't push there.

## Stack
- Vite + React 19 + TypeScript, React Router (routes live in `src/App.tsx`), Tailwind, shadcn/ui,
  TanStack Query, sonner toasts. Follow `AI_RULES.md` (Dyad's conventions).
- Supabase project ref `txaicetmxfehpnhjmjpc` (client in `src/integrations/supabase/client.ts`,
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

## Status / next steps (as of 2026-11-19)
1. Done: code merged to `main`.
2. To do: create the Strava API app (callback domain `txaicetmxfehpnhjmjpc.supabase.co`), run the
   migration in the Supabase SQL Editor, add the 5 secrets, deploy `strava-oauth` (JWT off) and
   `strava-sync`, then connect a Strava account and check the function logs.
3. Later: real CSV import + manual entry, wire public profiles to non-Strava data, profile editor,
   Strava webhook for deauthorization/deletion events, decide on the paywall.
