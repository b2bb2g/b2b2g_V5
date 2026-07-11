-- Approved notices are operational information and must be readable in full
-- before sign-in. Other post types keep their existing member-only full-row
-- policy; the public_posts teaser view remains unchanged.
create policy "approved notices public read"
on public.posts
for select
to anon
using (
  status in ('approved', 'closed')
  and exists (
    select 1
    from public.menus m
    where m.id = posts.menu_id
      and m.slug = 'notices'
      and m.board_type = 'notice'
  )
);

-- Defense in depth: the Notices menu is administered content. The UI already
-- hides writing, but this trigger also rejects forged direct inserts/updates
-- from non-admin authenticated users.
create or replace function public.enforce_notice_admin_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.menus m
    where m.id = new.menu_id
      and m.slug = 'notices'
  ) and not public.is_admin() then
    raise exception 'Only administrators can write notices'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger posts_notice_admin_write
before insert or update of menu_id, title_en, title_ko, body_en, body_ko, status
on public.posts
for each row execute function public.enforce_notice_admin_write();
