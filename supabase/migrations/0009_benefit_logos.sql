-- FRI Hub — partner logos on benefits

alter table benefits add column if not exists logo_url text;

-- A second small bucket, writable only by admins. Same reasoning as avatars:
-- documents stay in Drive, but an image has to be servable to a web page.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "logo read"   on storage.objects;
drop policy if exists "logo write"  on storage.objects;
drop policy if exists "logo update" on storage.objects;
drop policy if exists "logo delete" on storage.objects;

create policy "logo read" on storage.objects
  for select using (bucket_id = 'logos');

create policy "logo write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and public.is_admin());

create policy "logo update" on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and public.is_admin());

create policy "logo delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and public.is_admin());
