-- Tighten the private `attachments` bucket read policy.
--
-- Before: `attachments member read` used `bucket_id = 'attachments'`, i.e. ANY
-- authenticated member could list() and createSignedUrl() EVERY object in the
-- bucket -- including attachments on posts they are not allowed to read (pending,
-- rejected, or other members' drafts). The /api/attachments/[id] route gated
-- downloads via post_attachments RLS (can_read_post), but a member could bypass
-- the route and hit the Storage API directly, so the object policy itself was
-- the real (over-broad) boundary.
--
-- After: a member may read an attachment object only when
--   (a) it lives in their own upload folder (`<uid>/...`), matching the upload
--       and delete policies, so preview/manage of their own files still works, OR
--   (b) it is referenced by a post_attachments row on a post they can read
--       (can_read_post: approved/closed, own post, or review/content admin).
-- The anon "approved notice attachment objects public read" policy is unchanged,
-- so public notice downloads keep working.

drop policy if exists "attachments member read" on storage.objects;

create policy "attachments member read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'attachments'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1
        from public.post_attachments a
        where a.path = storage.objects.name
          and public.can_read_post(a.post_id)
      )
    )
  );
