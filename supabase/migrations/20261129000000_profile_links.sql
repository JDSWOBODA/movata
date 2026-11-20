-- Movata: link blocks on the public profile (Instagram, YouTube, coaching, shop, race vlog…),
-- with the same privacy-preserving click counts as Gear Corner.

create table if not exists public.profile_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  url text not null,
  kind text not null default 'link'
    check (kind in ('link', 'instagram', 'tiktok', 'youtube', 'strava', 'x', 'threads', 'facebook', 'podcast', 'newsletter', 'shop', 'coaching')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_links_label_length check (char_length(label) between 1 and 60),
  constraint profile_links_url_format check (url ~* '^https?://' and char_length(url) <= 500)
);

create index if not exists profile_links_user_idx on public.profile_links (user_id, position);

alter table public.profile_links enable row level security;

drop policy if exists "Links of public profiles are readable" on public.profile_links;
create policy "Links of public profiles are readable"
  on public.profile_links for select
  using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = user_id and p.is_public));

drop policy if exists "Owner manages own links" on public.profile_links;
create policy "Owner manages own links"
  on public.profile_links for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.profile_links from anon, authenticated;
grant select on public.profile_links to anon, authenticated;
grant insert, update, delete on public.profile_links to authenticated;
grant all on public.profile_links to service_role;

-- One row per unique visitor per link per day. Only the track-link-click function writes here.
-- No IP or account is stored: visitor_key is a salted, per-day hash.
create table if not exists public.link_clicks (
  id bigint generated always as identity primary key,
  link_id uuid not null references public.profile_links (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  clicked_on date not null default (now() at time zone 'utc')::date,
  clicked_at timestamptz not null default now(),
  visitor_key text not null,
  constraint link_clicks_unique_daily unique (link_id, clicked_on, visitor_key)
);

create index if not exists link_clicks_owner_idx on public.link_clicks (owner_id, clicked_on desc);

alter table public.link_clicks enable row level security;

drop policy if exists "Owner reads own link clicks" on public.link_clicks;
create policy "Owner reads own link clicks"
  on public.link_clicks for select
  to authenticated
  using (auth.uid() = owner_id);

revoke all on public.link_clicks from anon, authenticated;
grant select on public.link_clicks to authenticated;
grant all on public.link_clicks to service_role;

create or replace function public.link_click_stats()
returns table (link_id uuid, last_30_days bigint, all_time bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select link_id,
         count(*) filter (where clicked_on > (now() at time zone 'utc')::date - 30) as last_30_days,
         count(*) as all_time
  from public.link_clicks
  where owner_id = auth.uid()
  group by link_id;
$$;

revoke all on function public.link_click_stats() from public, anon;
grant execute on function public.link_click_stats() to authenticated;
