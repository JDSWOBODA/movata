-- Movata: race results (the running résumé).
--
-- Extends race_plans so a "done" race can carry the result the runner typed in:
-- finish time, a standard distance (for automatic PRs), course type, DNF, a race report,
-- tags and a per-race public/private switch. Goals live in race_goals so a private goal is
-- never readable by visitors (row-level security can't hide one column of a public row).
--
-- Strava: none of these values are read from strava_activities. Runners enter their own
-- results, so public pages stay within Strava's API Policy.

alter table public.race_plans
  add column if not exists finish_seconds integer,
  add column if not exists distance_key text,
  add column if not exists course_type text not null default 'road',
  add column if not exists dnf boolean not null default false,
  add column if not exists report text not null default '',
  add column if not exists tags text[] not null default '{}',
  add column if not exists is_public boolean not null default true;

alter table public.race_plans drop constraint if exists race_plans_finish_range;
alter table public.race_plans add constraint race_plans_finish_range
  check (finish_seconds is null or (finish_seconds > 0 and finish_seconds < 1000000));

alter table public.race_plans drop constraint if exists race_plans_distance_key_check;
alter table public.race_plans add constraint race_plans_distance_key_check
  check (distance_key is null or distance_key in
    ('1mi', '5k', '8k', '10k', '15k', '10mi', 'half', 'marathon', '50k', '50mi', '100k', '100mi', 'other'));

alter table public.race_plans drop constraint if exists race_plans_course_type_check;
alter table public.race_plans add constraint race_plans_course_type_check
  check (course_type in ('road', 'trail', 'track', 'xc', 'other'));

alter table public.race_plans drop constraint if exists race_plans_report_length;
alter table public.race_plans add constraint race_plans_report_length check (char_length(report) <= 4000);

alter table public.race_plans drop constraint if exists race_plans_tags_limit;
alter table public.race_plans add constraint race_plans_tags_limit
  check (cardinality(tags) <= 8 and array_to_string(tags, '') !~ '[<>]');

alter table public.race_plans drop constraint if exists race_plans_result_needs_done;
alter table public.race_plans add constraint race_plans_result_needs_done
  check (status = 'done' or (finish_seconds is null and dnf = false));

-- Visitors see a race only if the profile AND the race are public. Owners see everything.
drop policy if exists "Races of public profiles are readable" on public.race_plans;
create policy "Races of public profiles are readable"
  on public.race_plans for select
  using (
    auth.uid() = user_id
    or (is_public and exists (select 1 from public.profiles p where p.id = user_id and p.is_public))
  );

create index if not exists race_plans_results_idx
  on public.race_plans (user_id, distance_key, finish_seconds) where status = 'done' and finish_seconds is not null;

-- Goals: private by default.
create table if not exists public.race_goals (
  race_id uuid primary key references public.race_plans (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_seconds integer not null check (goal_seconds > 0 and goal_seconds < 1000000),
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists race_goals_user_idx on public.race_goals (user_id);

alter table public.race_goals enable row level security;

drop policy if exists "Public goals of public races are readable" on public.race_goals;
create policy "Public goals of public races are readable"
  on public.race_goals for select
  using (
    auth.uid() = user_id
    or (
      is_public
      and exists (
        select 1 from public.race_plans r
        join public.profiles p on p.id = r.user_id
        where r.id = race_id and r.is_public and p.is_public
      )
    )
  );

drop policy if exists "Owner manages own goals" on public.race_goals;
create policy "Owner manages own goals"
  on public.race_goals for all
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.race_plans r where r.id = race_id and r.user_id = auth.uid())
  );

revoke all on public.race_goals from anon, authenticated;
grant select on public.race_goals to anon, authenticated;
grant insert, update, delete on public.race_goals to authenticated;
grant all on public.race_goals to service_role;
