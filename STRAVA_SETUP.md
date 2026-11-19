# Supabase and Strava setup for Movata

## Replacement Supabase project

The original Supabase project was deleted. The replacement project is
`ufazcckldxznchatctrt` (`https://ufazcckldxznchatctrt.supabase.co`).

The application client and Strava OAuth callback now point to this project.
The following database objects have been recreated through Dyad's database connection:

- `provider_connections`: authenticated owners can read connection metadata, not token columns.
- `billing_subscriptions`: authenticated owners can read their subscription.
- `strava_activities`: authenticated owners can read their cached runs.
- `purge_stale_strava_cache()`: service-role-only cleanup of cache rows older than seven days.

All three tables have RLS enabled, explicit service-role CRUD grants, and no anonymous access.
Clients cannot write these tables; verified backend functions perform writes.
Database changes are recorded in automatically generated migrations. The original
`20261119000000_strava_sync.sql` is historical and does not include all restored grants.
Do not use it alone to reproduce the replacement project's security configuration.

This recreated the schema, not deleted records or Auth users. Public profiles and
manual/CSV activity features currently use sample data; they are not database-backed.

## 1. Restore authentication settings

In the replacement Supabase project, open Authentication → URL Configuration.
Set the Site URL to the deployed app URL and allow the app's `/dashboard` redirect URL.
Also allow the current preview's `/dashboard` URL if testing email confirmation or magic links there.

The current login UI uses `/dashboard` for its Auth redirect. A dedicated password-update
screen is not implemented yet; do not consider password recovery verified by this rebuild.
Without an Auth backup, users must register again. Existing Stripe subscriptions require
reconciliation to the new Auth user IDs before enabling paid checkout for previous subscribers.

## 2. Update the Strava API app

In https://www.strava.com/settings/api, use:

- Application Name: Movata (do not include "Strava" in the name).
- Website: `https://movata.vercel.app` (or the actual deployed app URL).
- Authorization Callback Domain: `ufazcckldxznchatctrt.supabase.co`.

The OAuth callback endpoint is:
`https://ufazcckldxznchatctrt.supabase.co/functions/v1/strava-oauth`.

Keep the existing Strava API app if available; a new app is not required just because
Supabase changed. New Strava apps initially allow one athlete; higher limits require Strava approval.

## 3. Restore function secrets

Supabase → Edge Functions → Manage Secrets:

| Name | Value |
|---|---|
| `APP_URL` | The deployed app's absolute URL, e.g. `https://movata.vercel.app` |
| `STRAVA_CLIENT_ID` | Strava API app Client ID |
| `STRAVA_CLIENT_SECRET` | Strava API app Client Secret |
| `STRAVA_STATE_SECRET` | A cryptographically random, long secret |
| `STRAVA_TOKEN_ENCRYPTION_KEY` | A different cryptographically random, long secret |

Do not paste secret values into chat or browser source. Keep the encryption key stable
once connections are stored. If restoring encrypted tokens from a backup, use their original key.
Leave `STRAVA_REQUIRE_SUBSCRIPTION` unset while testing to keep the paywall disabled.

Supabase supplies its own runtime URL and API credentials to Edge Functions automatically.

## 4. Backend functions

Dyad deploys edited functions automatically to the connected project:

- `strava-oauth`: verifies JWTs itself for POST requests and signed state for Strava's GET callback.
- `strava-sync`: verifies the caller's JWT before syncing or disconnecting.
- `create-stripe-checkout`: verifies the caller's JWT before checkout.
- `stripe-webhook`: verifies Stripe's signature before database writes.

The OAuth callback and Stripe webhook must accept requests without a Supabase JWT;
platform JWT enforcement must not block these public callbacks.
Confirm these functions appear under Edge Functions after deployment completes.

## 5. Restore Stripe settings if using subscriptions

Add `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` in Manage Secrets.
Use the existing annual Stripe price if it is still active. Point the Stripe webhook to:

`https://ufazcckldxznchatctrt.supabase.co/functions/v1/stripe-webhook`

Subscribe it to `checkout.session.completed`, `customer.subscription.updated`, and
`customer.subscription.deleted`. Use this endpoint's signing secret for `STRIPE_WEBHOOK_SECRET`.
Do not charge previous subscribers again: their existing subscriptions need to be mapped
to replacement Auth users and billing records first.

## 6. Verify

1. Register/sign in with the replacement project.
2. Dashboard → Connect Strava → approve access.
3. Confirm the dashboard displays real runs and sync timestamps.
4. Check Edge Function logs if anything fails.
5. Disconnect and verify the user's connection and cached runs are removed.
6. If using Stripe, test checkout/webhook processing in test mode before enabling billing.

## Data rules

Strava data is private to its owner and never read by public profile pages.
Every sync refreshes the cache and invokes the seven-day purge helper.
Runs deleted on Strava disappear after a complete subsequent sync.
Disconnect revokes provider access and deletes the user's locally cached Strava data.
