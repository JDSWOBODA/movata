-- Movata: reasons to come back — profile views, cheers, and a weekly summary for the owner.
--
-- Like gear_clicks, visitors are reduced to a salted per-day hash (visitor_key) written only by
-- the "engage" edge function (service role). No IP address or visitor account is stored.

-- 1. Profile views: one row per visitor per profile per day.
create table if not exists public.profile_views (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  viewed_on date not null default (now() at time zone 'utc')::date,
  viewed_at timestamptz not null default now(),
  visitor_key text not null,
  constraint profile_views_unique_daily unique (profile_id, viewed_on, visitor_key)
);
create index if not exists profile_views_profile_idx on public.profile_views (profile_id, viewed_on desc);

alter table public.profile_views enable row level security;
drop policy if exists "Owner reads own profile views" on public.profile_views;
create policy "Owner reads own profile views" on public.profile_views for select to authenticated using (auth.uid() = profile_id);
revoke all on public.profile_views from anon, authenticated;
grant select on public.profile_views to authenticated;
grant all on public.profile_views to service_role;

-- 2. Cheers: a one-tap encouragement on a profile, featured run or race. One per visitor per target per day.
create table if not exists public.cheers (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null default 'profile' check (target_type in ('profile', 'featured_run', 'race')),
  target_id uuid,
  emoji text not null default '👏' check (emoji in ('👏', '🔥', '💪', '🏃')),
  cheered_on date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now(),
  visitor_key text not null,
  constraint cheers_target_shape check ((target_type = 'profile') = (target_id is null))
);
create unique index if not exists cheers_unique_daily
  on public.cheers (profile_id, target_type, coalesce(target_id, '00000000-0000-0000-0000-000000000000'::uuid), cheered_on, visitor_key);
create index if not exists cheers_profile_idx on public.cheers (profile_id, created_at desc);

alter table public.cheers enable row level security;
drop policy if exists "Owner reads own cheers" on public.cheers;
create policy "Owner reads own cheers" on public.cheers for select to authenticated using (auth.uid() = profile_id);
revoke all on public.cheers from anon, authenticated;
grant select on public.cheers to authenticated;
grant all on public.cheers to service_role;

-- When the owner last looked at their cheers, for the "new cheers" badge.
alter table public.profiles add column if not exists cheers_seen_at timestamptz;

-- 3. Public cheer totals for a public profile (counts only; no visitor data).
create or replace function public.public_cheer_counts(p_profile_id uuid)
returns table (target_type text, target_id uuid, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  select c.target_type, c.target_id, count(*)
  from public.cheers c
  join public.profiles p on p.id = c.profile_id
  where c.profile_id = p_profile_id and (p.is_public or p.id = auth.uid())
  group by c.target_type, c.target_id;
$$;
revoke all on function public.public_cheer_counts(uuid) from public;
grant execute on function public.public_cheer_counts(uuid) to anon, authenticated;

-- 4. The owner's "Your page this week": this week vs the week before, plus unseen cheers.
create or replace function public.engagement_summary()
returns table (
  views_7d bigint, views_prev_7d bigint,
  cheers_7d bigint, cheers_prev_7d bigint,
  gear_clicks_7d bigint, gear_clicks_prev_7d bigint,
  new_cheers bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with today as (select (now() at time zone 'utc')::date as d)
  select
    (select count(*) from public.profile_views v, today where v.profile_id = auth.uid() and v.viewed_on > today.d - 7),
    (select count(*) from public.profile_views v, today where v.profile_id = auth.uid() and v.viewed_on > today.d - 14 and v.viewed_on <= today.d - 7),
    (select count(*) from public.cheers c, today where c.profile_id = auth.uid() and c.cheered_on > today.d - 7),
    (select count(*) from public.cheers c, today where c.profile_id = auth.uid() and c.cheered_on > today.d - 14 and c.cheered_on <= today.d - 7),
    (select count(*) from public.gear_clicks g, today where g.owner_id = auth.uid() and g.clicked_on > today.d - 7),
    (select count(*) from public.gear_clicks g, today where g.owner_id = auth.uid() and g.clicked_on > today.d - 14 and g.clicked_on <= today.d - 7),
    (select count(*) from public.cheers c
       where c.profile_id = auth.uid()
         and c.created_at > coalesce((select cheers_seen_at from public.profiles where id = auth.uid()), '-infinity'::timestamptz));
$$;
revoke all on function public.engagement_summary() from public, anon;
grant execute on function public.engagement_summary() to authenticated;
