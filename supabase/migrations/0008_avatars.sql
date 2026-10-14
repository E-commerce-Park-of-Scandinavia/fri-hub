-- FRI Hub — profile photo storage
--
-- v1 deliberately had no file storage: documents live in Google Drive and the
-- hub only links to them. Profile photos are the exception, because Drive
-- cannot serve an image to a web page and asking founders to find a public
-- image URL for themselves is a step most of them will simply not take.
--
-- Scope is kept deliberately narrow: one small image per person, nothing else.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Files are stored at "<auth user id>/avatar.<ext>", so the first path segment
-- is the owner and every policy below keys off it.

drop policy if exists "avatar read"   on storage.objects;
drop policy if exists "avatar insert" on storage.objects;
drop policy if exists "avatar update" on storage.objects;
drop policy if exists "avatar delete" on storage.objects;

-- The bucket is public: an avatar URL contains the owner's UUID, so it is
-- unguessable, but anyone holding the link can load the image. That is the
-- normal trade-off for profile pictures and keeps the page fast.
create policy "avatar read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatar insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
