-- Movata: Gear Corner — shoes, apparel, watches and other gear a runner wants to highlight.
--
-- Disclosure flags are stored with each item so public pages always show them:
--   is_affiliate → product_url earns the runner a commission
--   is_gifted    → the runner received the item free or is sponsored by the brand
-- brand is kept as its own column so Movata can later see which brands runners feature.
-- Visibility follows featured_runs: readable when the owner's profile is public, writable by the owner.

create table if not exists public.gear_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category text not null default 'other'
    check (category in ('shoes', 'apparel', 'socks', 'watch', 'hydration', 'nutrition', 'accessories', 'other')),
  brand text not null default '',
  name text not null,
  note text not null default '',
  photo_path text,
  product_url text,
  is_affiliate boolean not null default false,
  is_gifted boolean not null default false,
  video_url text,
  in_rotation boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gear_items_name_length check (char_length(name) between 1 and 100),
  constraint gear_items_brand_length check (char_length(brand) <= 60),
  constraint gear_items_note_length check (char_length(note) <= 300),
  constraint gear_items_product_url check (product_url is null or (product_url ~* '^https?://' and char_length(product_url) <= 1000)),
  constraint gear_items_video_url check (video_url is null or (video_url ~* '^https?://' and char_length(video_url) <= 500)),
  -- An affiliate disclosure only makes sense with a product link.
  constraint gear_items_affiliate_needs_link check (not is_affiliate or product_url is not null)
);

create index if not exists gear_items_user_idx on public.gear_items (user_id, position);
create index if not exists gear_items_brand_idx on public.gear_items (lower(brand));

alter table public.gear_items enable row level security;

drop policy if exists "Gear of public profiles is readable" on public.gear_items;
create policy "Gear of public profiles is readable"
  on public.gear_items for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = user_id and p.is_public)
  );

drop policy if exists "Owner manages own gear" on public.gear_items;
create policy "Owner manages own gear"
  on public.gear_items for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on public.gear_items from anon, authenticated;
grant select on public.gear_items to anon, authenticated;
grant insert, update, delete on public.gear_items to authenticated;
grant all on public.gear_items to service_role;
