-- Movata: keep Strava data off public pages.
--
-- Strava's API Policy lets an app show a user's Strava data (including values derived from it, like
-- totals and streaks) only to that user, and cache it for at most 7 days. Earlier versions prefilled
-- featured runs and milestone suggestions from synced Strava runs and published them. From now on the
-- runner types what gets published; the app only shows their Strava numbers to them as a private
-- reference.
--
-- Existing rows that were filled in from Strava are hidden from visitors (needs_review) until the
-- runner opens and saves them. Stored Strava activity IDs are cleared, and suggestion keys (which
-- contain derived numbers such as "year:2026:2000mi") are replaced by one-way hashes.

-- 1. Featured runs --------------------------------------------------------------------------------
alter table public.featured_runs add column if not exists needs_review boolean not null default false;

update public.featured_runs
   set needs_review = true, strava_activity_id = null
 where source = 'strava';

drop index if exists public.featured_runs_user_strava_key;

-- New rows can't be Strava-sourced; old ones stay flagged until reviewed.
alter table public.featured_runs drop constraint if exists featured_runs_no_new_strava;
alter table public.featured_runs add constraint featured_runs_no_new_strava
  check (source = 'manual' or needs_review);
alter table public.featured_runs drop constraint if exists featured_runs_no_strava_ids;
alter table public.featured_runs add constraint featured_runs_no_strava_ids
  check (strava_activity_id is null);

drop policy if exists "Featured runs of public profiles are readable" on public.featured_runs;
create policy "Featured runs of public profiles are readable"
  on public.featured_runs for select
  using (
    auth.uid() = user_id
    or (not needs_review and exists (select 1 from public.profiles p where p.id = user_id and p.is_public))
  );

-- 2. Milestones -----------------------------------------------------------------------------------
alter table public.milestones add column if not exists needs_review boolean not null default false;

update public.milestones
   set needs_review = true
 where key is not null and kind in ('yearly_distance', 'streak', 'long_run');

-- Opaque keys: 'h:' + first 24 hex chars of sha256(key). Same formula as src/lib/hash.ts.
update public.milestones
   set key = 'h:' || left(encode(sha256(convert_to(key, 'UTF8')), 'hex'), 24)
 where key is not null and key not like 'h:%';

update public.milestone_dismissals
   set key = 'h:' || left(encode(sha256(convert_to(key, 'UTF8')), 'hex'), 24)
 where key not like 'h:%';

alter table public.milestones drop constraint if exists milestones_opaque_key;
alter table public.milestones add constraint milestones_opaque_key check (key is null or key like 'h:%');

drop policy if exists "Milestones of public profiles are readable" on public.milestones;
create policy "Milestones of public profiles are readable"
  on public.milestones for select
  using (
    auth.uid() = user_id
    or (not needs_review and exists (select 1 from public.profiles p where p.id = user_id and p.is_public))
  );
