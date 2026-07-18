-- Comment management: member editing already has RLS; add reporting,
-- admin moderation of comments, and mention notifications.

create table public.member_feed_comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.member_feed_comments(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam', 'misleading', 'abuse', 'other')),
  details text check (char_length(details) <= 500),
  status text not null default 'pending'
    check (status in ('pending', 'resolved', 'dismissed')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (comment_id, reporter_id)
);
alter table public.member_feed_comment_reports enable row level security;
create index member_feed_comment_reports_status_idx
  on public.member_feed_comment_reports (status, created_at);
create index member_feed_comment_reports_reporter_idx
  on public.member_feed_comment_reports (reporter_id, created_at desc);

create policy "comment reports own insert" on public.member_feed_comment_reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "comment reports reviewer read" on public.member_feed_comment_reports
  for select to authenticated using (
    reporter_id = (select auth.uid())
    or (select public.has_admin_permission('review'))
  );
create policy "comment reports reviewer update" on public.member_feed_comment_reports
  for update to authenticated
  using ((select public.has_admin_permission('review')))
  with check ((select public.has_admin_permission('review')));

-- Reviewers may remove reported comments.
create policy "feed comments reviewer delete" on public.member_feed_comments
  for delete to authenticated
  using ((select public.has_admin_permission('review')));

-- @UID mentions in comments notify the mentioned member.
create or replace function public.notify_feed_mentions()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target record;
begin
  for target in
    select distinct p.id
      from regexp_matches(new.body, '@(\d{4,9})', 'g') as m
      join public.profiles p on p.uid::text = m[1]
  loop
    if target.id <> new.author_id then
      perform public.notify(target.id, 'feed_mentioned',
        jsonb_build_object('feed_post_id', new.post_id, 'excerpt', left(new.body, 80)));
    end if;
  end loop;
  return new;
end;
$$;
create trigger member_feed_comments_mention_notify
after insert on public.member_feed_comments
for each row execute function public.notify_feed_mentions();
