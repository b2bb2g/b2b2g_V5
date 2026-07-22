-- Private bucket for 1:1 inquiry message images.
--
-- Previously inquiry attachments were uploaded to the PUBLIC `post-media` bucket
-- and rendered via a public URL, so anyone holding the (random) URL could open a
-- private correspondence image without auth. This bucket is private; images are
-- served only through short-lived signed URLs, and the read policy below mirrors
-- the inquiry_messages read rule so a signed URL is issued only to someone
-- actually allowed to see that message.

insert into storage.buckets (id, name, public, file_size_limit)
values ('inquiry-media', 'inquiry-media', false, 10485760)
on conflict (id) do nothing;

-- Upload: authenticated may write only into their own `<uid>/...` folder.
drop policy if exists "inquiry media upload own" on storage.objects;
create policy "inquiry media upload own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'inquiry-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Read: own uploads, or an object referenced by an inquiry message the caller
-- may read. Mirrors the `inquiry messages read` policy: own message always; the
-- counterpart's only once forwarded; admins and referring coordinators too.
drop policy if exists "inquiry media read" on storage.objects;
create policy "inquiry media read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'inquiry-media'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1
        from public.inquiry_messages m
        where storage.objects.name = any (m.media_paths)
          and (
            public.is_admin()
            or m.sender_id = (select auth.uid())
            or (public.is_inquiry_participant(m.inquiry_id) and m.review_status = 'forwarded')
            or public.coordinator_can_view_inquiry(m.inquiry_id)
          )
      )
    )
  );

-- Delete: own uploads, or review staff (cleanup).
drop policy if exists "inquiry media delete own" on storage.objects;
create policy "inquiry media delete own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'inquiry-media'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.has_admin_permission('review'))
    )
  );
