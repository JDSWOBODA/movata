-- Movata: races a runner is registered for or dreams of running.
--
-- status:
--   registered  → signed up; needs a date; shows under "On the calendar"
--   bucket_list → dream race; date optional; runner-ordered
--   done        → happened; optionally linked to the featured run that tells the story
-- Visibility follows featured_runs: readable when the owner's profile is public, writable by the owner.

create table if not exists public.race_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  race_date date,
  location text not null default '',
  distance_label text not null default '',
  url text,
  note text not null default '',
  status text not null default 'bucket_list' check (status in ('registered', 'bucket_list', 'done')),
  photo_path text,
  featured_run_id uuid references public.featured_runs (id) on delete set null,
  completed_on date,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint race_plans_name_length check (char_length(name) between 1 and 120),
  constraint race_plans_location_length check (char_length(location) <= 80),
  constraint race_plans_distance_length check (char_length(distance_label) <= 30),
  constraint race_plans_note_length check (char_length(note) <= 300),
  constraint race_plans_url_format check (url is null or (url ~* '^https?://' and char_length(url) <= 500)),
  constraint race_plans_registered_has_date check (status <> 'registered' or race_date is not null)
);

create index if not exists race_plans_user_idx on public.race_plans (user_id, status, position, race_date);

alter table public.race_plans enable row level security;

drop policy if exists "Races of public profiles are readable" on public.race_plans;
create policy "Races of public profiles are readable"
  on public.race_plans for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = user_id and p.is_public)
  );

drop policy if exists "Owner manages own races" on public.race_plans;
create policy "Owner manages own races"
  on public.race_plans for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.race_plans from anon, authenticated;
grant select on public.race_plans to anon, authenticated;
grant insert, update, delete on public.race_plans to authenticated;
grant all on public.race_plans to service_role;
