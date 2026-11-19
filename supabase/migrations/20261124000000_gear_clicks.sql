-- Movata: Gear Corner click tracking.
--
-- One row per unique visitor per gear link per day. Only the track-gear-click edge function
-- (service role) writes here. No IP addresses or account ids are stored: visitor_key is a
-- salted hash of (ip, user agent, item, link, day) used only to count each visitor once a day.
-- Runners can read their own counts; Movata can later aggregate by brand for partners.

create table if not exists public.gear_clicks (
  id bigint generated always as identity primary key,
  gear_item_id uuid not null references public.gear_items (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  link_type text not null check (link_type in ('product', 'video')),
  clicked_on date not null default (now() at time zone 'utc')::date,
  clicked_at timestamptz not null default now(),
  visitor_key text not null,
  constraint gear_clicks_unique_daily unique (gear_item_id, link_type, clicked_on, visitor_key)
);

create index if not exists gear_clicks_owner_idx on public.gear_clicks (owner_id, clicked_on desc);

alter table public.gear_clicks enable row level security;

drop policy if exists "Owner reads own gear clicks" on public.gear_clicks;
create policy "Owner reads own gear clicks"
  on public.gear_clicks for select
  to authenticated
  using (auth.uid() = owner_id);

revoke all on public.gear_clicks from anon, authenticated;
grant select on public.gear_clicks to authenticated;
grant all on public.gear_clicks to service_role;

-- Per-item counts for the signed-in runner's dashboard.
create or replace function public.gear_click_stats()
returns table (gear_item_id uuid, link_type text, last_30_days bigint, all_time bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select gear_item_id,
         link_type,
         count(*) filter (where clicked_on > (now() at time zone 'utc')::date - 30) as last_30_days,
         count(*) as all_time
  from public.gear_clicks
  where owner_id = auth.uid()
  group by gear_item_id, link_type;
$$;

revoke all on function public.gear_click_stats() from public, anon;
grant execute on function public.gear_click_stats() to authenticated;
