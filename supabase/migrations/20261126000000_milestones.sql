-- Movata: milestones a runner chooses to publish (e.g. "2,000 miles in 2026", "100-day streak").
--
-- The dashboard suggests milestones privately from the runner's own synced runs; nothing is saved
-- or shown publicly until the runner confirms (and can edit) it. "key" identifies a suggestion so
-- it isn't offered twice; dismissed suggestion keys live on the profile.
-- Visibility follows featured_runs: readable when the owner's profile is public, writable by the owner.

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  key text,
  kind text not null default 'custom' check (kind in ('yearly_distance', 'streak', 'long_run', 'race', 'custom')),
  title text not null,
  detail text not null default '',
  achieved_on date not null,
  photo_path text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint milestones_title_length check (char_length(title) between 1 and 100),
  constraint milestones_detail_length check (char_length(detail) <= 300),
  constraint milestones_key_length check (key is null or char_length(key) <= 80)
);

create unique index if not exists milestones_user_key on public.milestones (user_id, key) where key is not null;
create index if not exists milestones_user_idx on public.milestones (user_id, achieved_on desc);

alter table public.milestones enable row level security;

drop policy if exists "Milestones of public profiles are readable" on public.milestones;
create policy "Milestones of public profiles are readable"
  on public.milestones for select
  using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = user_id and p.is_public));

drop policy if exists "Owner manages own milestones" on public.milestones;
create policy "Owner manages own milestones"
  on public.milestones for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on public.milestones from anon, authenticated;
grant select on public.milestones to anon, authenticated;
grant insert, update, delete on public.milestones to authenticated;
grant all on public.milestones to service_role;

-- Suggestions the runner said "no thanks" to. Owner-only: keys are derived from private Strava data,
-- so they must not live on the publicly readable profiles table.
create table if not exists public.milestone_dismissals (
  user_id uuid not null references public.profiles (id) on delete cascade,
  key text not null check (char_length(key) <= 80),
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.milestone_dismissals enable row level security;
drop policy if exists "Owner manages own milestone dismissals" on public.milestone_dismissals;
create policy "Owner manages own milestone dismissals"
  on public.milestone_dismissals for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke all on public.milestone_dismissals from anon, authenticated;
grant select, insert, delete on public.milestone_dismissals to authenticated;
grant all on public.milestone_dismissals to service_role;

-- Milestones can be cheered too.
alter table public.cheers drop constraint if exists cheers_target_type_check;
alter table public.cheers add constraint cheers_target_type_check check (target_type in ('profile', 'featured_run', 'race', 'milestone'));
