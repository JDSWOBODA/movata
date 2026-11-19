-- Movata: Strava connection + activity cache
-- Run this once in Supabase → SQL Editor. Safe to re-run.

-- 1. Provider connections (one row per user per provider account).
--    Tokens are AES-GCM encrypted by the edge functions before they land here.
create table if not exists public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null,
  provider_user_id text not null,
  encrypted_access_token text,
  encrypted_refresh_token text,
  token_expiration timestamptz,
  sync_status text not null default 'connected',
  sync_error text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider, provider_user_id)
);

alter table public.provider_connections enable row level security;

drop policy if exists "Users read own connections" on public.provider_connections;
create policy "Users read own connections"
  on public.provider_connections for select
  using (auth.uid() = user_id);

-- Browsers never need the token columns, even encrypted. Only the edge functions
-- (service role) can read them.
revoke select on public.provider_connections from anon, authenticated;
grant select (id, user_id, provider, provider_user_id, sync_status, sync_error, last_synced_at, created_at, updated_at)
  on public.provider_connections to authenticated;

-- 2. Billing (used by the existing Stripe functions; created here so the
--    dashboard's subscription check doesn't error while Strava is free).
create table if not exists public.billing_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.billing_subscriptions enable row level security;

drop policy if exists "Users read own subscription" on public.billing_subscriptions;
create policy "Users read own subscription"
  on public.billing_subscriptions for select
  using (auth.uid() = user_id);

-- 3. Strava activity cache.
--    Strava's API Policy (6.2) allows caching Strava data for at most 7 days, and
--    only showing it to the athlete who owns it. Every sync refreshes fetched_at;
--    anything older than 7 days is purged. Rows are readable only by their owner.
create table if not exists public.strava_activities (
  user_id uuid not null references auth.users (id) on delete cascade,
  strava_activity_id bigint not null,
  activity jsonb not null,          -- NormalizedActivity shape used by the app
  local_date date not null,
  fetched_at timestamptz not null default now(),
  primary key (user_id, strava_activity_id)
);

create index if not exists strava_activities_user_date_idx
  on public.strava_activities (user_id, local_date desc);

alter table public.strava_activities enable row level security;

drop policy if exists "Owner reads own Strava activities" on public.strava_activities;
create policy "Owner reads own Strava activities"
  on public.strava_activities for select
  using (auth.uid() = user_id);

-- Purge helper (also called at the start of every sync).
create or replace function public.purge_stale_strava_cache()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.strava_activities where fetched_at < now() - interval '7 days';
$$;

revoke all on function public.purge_stale_strava_cache() from public, anon, authenticated;

-- Optional: nightly purge even if nobody syncs. Requires the pg_cron extension
-- (Database → Extensions → enable "pg_cron"), then uncomment:
-- select cron.schedule('purge-strava-cache', '17 3 * * *', $$select public.purge_stale_strava_cache()$$);
