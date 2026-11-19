-- Movata: public runner profiles + runner-curated featured runs.
--
-- featured_runs holds values the runner confirmed for publication (title, date, distance,
-- duration, note). They may have been prefilled from one of the runner's own Strava runs;
-- strava_activity_id is kept only to link back with "View on Strava". Nothing here is read
-- from strava_activities by public pages.

-- 1. Profiles: one per Auth user, addressed publicly by username.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text not null default '',
  bio text not null default '',
  location text not null default '',
  running_since date,
  preferred_unit text not null default 'mi' check (preferred_unit in ('mi', 'km')),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  constraint profiles_display_name_length check (char_length(display_name) <= 80),
  constraint profiles_bio_length check (char_length(bio) <= 500),
  constraint profiles_location_length check (char_length(location) <= 80)
);

create unique index if not exists profiles_username_key on public.profiles (username);

alter table public.profiles enable row level security;

drop policy if exists "Public profiles are readable" on public.profiles;
create policy "Public profiles are readable"
  on public.profiles for select
  using (is_public or auth.uid() = id);

drop policy if exists "Owner inserts own profile" on public.profiles;
create policy "Owner inserts own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Owner updates own profile" on public.profiles;
create policy "Owner updates own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- 2. Featured runs: what the runner chose to show on their public page.
create table if not exists public.featured_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  run_date date not null,
  distance_meters numeric(10, 1) not null check (distance_meters > 0 and distance_meters < 1000000),
  moving_time_seconds integer not null check (moving_time_seconds > 0 and moving_time_seconds < 1000000),
  note text not null default '',
  highlight_type text not null default 'featured'
    check (highlight_type in ('featured', 'favorite', 'memorable', 'scenic', 'best_race', 'toughest')),
  source text not null default 'manual' check (source in ('manual', 'strava')),
  strava_activity_id bigint,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint featured_runs_title_length check (char_length(title) between 1 and 120),
  constraint featured_runs_note_length check (char_length(note) <= 500),
  constraint featured_runs_strava_link check (source = 'strava' or strava_activity_id is null)
);

create index if not exists featured_runs_user_idx on public.featured_runs (user_id, position, run_date desc);
create unique index if not exists featured_runs_user_strava_key
  on public.featured_runs (user_id, strava_activity_id) where strava_activity_id is not null;

alter table public.featured_runs enable row level security;

drop policy if exists "Featured runs of public profiles are readable" on public.featured_runs;
create policy "Featured runs of public profiles are readable"
  on public.featured_runs for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = user_id and p.is_public)
  );

drop policy if exists "Owner manages own featured runs" on public.featured_runs;
create policy "Owner manages own featured runs"
  on public.featured_runs for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.featured_runs from anon, authenticated;
grant select on public.featured_runs to anon, authenticated;
grant insert, update, delete on public.featured_runs to authenticated;
grant all on public.featured_runs to service_role;
