-- Movata: runner-uploaded images (avatar, cover, one photo per featured run).
--
-- Images live in the public "profile-media" bucket under <user id>/<kind>/<random>.webp.
-- Anyone can view them by URL (they appear on public pages); only the owner can add,
-- replace or delete files in their own folder. These are the runner's own uploads,
-- never images fetched from Strava.

alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists cover_path text;
alter table public.featured_runs add column if not exists photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-media', 'profile-media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners upload profile media" on storage.objects;
create policy "Owners upload profile media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Owners update profile media" on storage.objects;
create policy "Owners update profile media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Owners delete profile media" on storage.objects;
create policy "Owners delete profile media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- Owners can list their own files (needed for delete/replace); public viewing goes
-- through the bucket's public URLs, so no anonymous select policy is needed.
drop policy if exists "Owners read own profile media" on storage.objects;
create policy "Owners read own profile media"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'profile-media' and (storage.foldername(name))[1] = auth.uid()::text);
