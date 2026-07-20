-- Members rarely open the Notices menu, so a newly published notice now
-- notifies every active member — lighting up the bell and riding the push
-- pipeline. Fires only on the transition INTO approved for posts on the
-- notices menu; existing notices are not re-broadcast.
create or replace function public.notify_notice_published()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'approved' then
    return new;
  end if;
  if not exists (
    select 1 from public.menus m
    where m.id = new.menu_id and m.slug = 'notices'
  ) then
    return new;
  end if;
  -- Only the approve transition (fresh insert-approved, or update into it).
  if tg_op = 'UPDATE' and old.status = 'approved' then
    return new;
  end if;

  insert into public.notifications (profile_id, type, payload)
  select p.id, 'notice_published',
         jsonb_build_object(
           'post_id', new.id,
           'title', coalesce(nullif(new.title_ko, ''), new.title_en)
         )
  from public.profiles p
  where p.status = 'active'
    and p.id <> new.author_id;
  return new;
end $$;

create trigger posts_notice_published
after insert or update of status on public.posts
for each row execute function public.notify_notice_published();
