-- Feed social upgrade: threaded comments with media, comment likes, post
-- view tracking, and author notifications for the new interactions.

alter table public.member_feed_comments
  add column parent_id uuid references public.member_feed_comments(id) on delete cascade,
  add column media_paths text[] not null default '{}'
    check (cardinality(media_paths) <= 2);

create index member_feed_comments_parent_idx
  on public.member_feed_comments (parent_id, created_at);

create table public.member_feed_comment_likes (
  comment_id uuid not null references public.member_feed_comments(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, profile_id)
);
alter table public.member_feed_comment_likes enable row level security;
create index member_feed_comment_likes_profile_idx
  on public.member_feed_comment_likes (profile_id, created_at desc);

create policy "comment likes public read" on public.member_feed_comment_likes
  for select using (true);
create policy "comment likes own insert" on public.member_feed_comment_likes
  for insert to authenticated with check (profile_id = (select auth.uid()));
create policy "comment likes own delete" on public.member_feed_comment_likes
  for delete to authenticated using (profile_id = (select auth.uid()));

-- Unique signed-in viewers per post; refreshed on revisit. Readable by the
-- viewer themselves, the post author, and admins.
create table public.member_feed_post_views (
  post_id uuid not null references public.member_feed_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
alter table public.member_feed_post_views enable row level security;
create index member_feed_post_views_post_idx
  on public.member_feed_post_views (post_id, viewed_at desc);

create policy "feed views own write" on public.member_feed_post_views
  for insert to authenticated with check (profile_id = (select auth.uid()));
create policy "feed views own update" on public.member_feed_post_views
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
create policy "feed views author read" on public.member_feed_post_views
  for select to authenticated using (
    profile_id = (select auth.uid())
    or exists (
      select 1 from public.member_feed_posts p
      where p.id = post_id and p.author_id = (select auth.uid())
    )
    or public.is_admin()
  );

-- Notifications: comment likes and replies alert the comment author.
create or replace function public.notify_feed_comment_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  comment_author uuid;
  comment_post uuid;
begin
  select author_id, post_id into comment_author, comment_post
    from public.member_feed_comments where id = new.comment_id;
  if comment_author is not null and comment_author <> new.profile_id then
    perform public.notify(comment_author, 'feed_comment_liked',
      jsonb_build_object('feed_post_id', comment_post, 'comment_id', new.comment_id));
  end if;
  return new;
end;
$$;
create trigger member_feed_comment_likes_notify
after insert on public.member_feed_comment_likes
for each row execute function public.notify_feed_comment_like();

create or replace function public.notify_feed_comment_reply()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  parent_author uuid;
begin
  if new.parent_id is null then
    return new;
  end if;
  select author_id into parent_author
    from public.member_feed_comments where id = new.parent_id;
  if parent_author is not null and parent_author <> new.author_id then
    perform public.notify(parent_author, 'feed_comment_replied',
      jsonb_build_object('feed_post_id', new.post_id, 'excerpt', left(new.body, 80)));
  end if;
  return new;
end;
$$;
create trigger member_feed_comments_reply_notify
after insert on public.member_feed_comments
for each row execute function public.notify_feed_comment_reply();
