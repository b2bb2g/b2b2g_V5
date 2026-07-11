-- Approved operational notices are public documents, so their attachments
-- follow the notice body's public-read rule. Other post attachments remain
-- covered only by the existing authenticated-member policy.
create policy "approved notice attachments public read"
on public.post_attachments
for select
to anon
using (
  exists (
    select 1
    from public.posts p
    join public.menus m on m.id = p.menu_id
    where p.id = post_attachments.post_id
      and p.status in ('approved', 'closed')
      and m.slug = 'notices'
      and m.board_type = 'notice'
  )
);

-- The attachments bucket stays private. Anonymous signed-URL creation can
-- read only objects that are referenced by an approved notice attachment.
create policy "approved notice attachment objects public read"
on storage.objects
for select
to anon
using (
  bucket_id = 'attachments'
  and exists (
    select 1
    from public.post_attachments a
    join public.posts p on p.id = a.post_id
    join public.menus m on m.id = p.menu_id
    where a.path = storage.objects.name
      and p.status in ('approved', 'closed')
      and m.slug = 'notices'
      and m.board_type = 'notice'
  )
);
