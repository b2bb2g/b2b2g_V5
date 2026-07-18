-- Web push infrastructure: subscription storage, feed engagement
-- notifications (likes/comments on own posts), and best-effort delivery of
-- every new notification to the push dispatcher endpoint.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create index push_subscriptions_profile_idx on public.push_subscriptions (profile_id);

create policy "push self all" on public.push_subscriptions
  for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- Likes and comments on a member's feed post notify the author; never for
-- the author's own actions.
create or replace function public.notify_feed_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  author uuid;
begin
  select author_id into author from public.member_feed_posts where id = new.post_id;
  if author is not null and author <> new.profile_id then
    perform public.notify(author, 'feed_liked',
      jsonb_build_object('feed_post_id', new.post_id));
  end if;
  return new;
end;
$$;
create trigger member_feed_likes_notify
after insert on public.member_feed_likes
for each row execute function public.notify_feed_like();

create or replace function public.notify_feed_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  author uuid;
begin
  select author_id into author from public.member_feed_posts where id = new.post_id;
  if author is not null and author <> new.author_id then
    perform public.notify(author, 'feed_commented',
      jsonb_build_object('feed_post_id', new.post_id, 'excerpt', left(new.body, 80)));
  end if;
  return new;
end;
$$;
create trigger member_feed_comments_notify
after insert on public.member_feed_comments
for each row execute function public.notify_feed_comment();

-- Every notification insert pings the push dispatcher with just the row id.
-- The route re-reads the notification server-side, so the ping carries no
-- payload worth forging; delivery is best-effort and never blocks inserts.
create extension if not exists pg_net;

create or replace function public.dispatch_push_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://b2bb2g.com/api/push/dispatch',
    body := jsonb_build_object('id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
exception when others then
  return new;
end;
$$;
create trigger notifications_dispatch_push
after insert on public.notifications
for each row execute function public.dispatch_push_notification();
