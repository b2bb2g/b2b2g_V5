-- Public member feed: a lightweight social layer separate from marketplace
-- listings. Public reading supports external sharing; every mutation remains
-- authenticated and ownership-scoped.
create table public.member_feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  media_paths text[] not null default '{}'
    check (cardinality(media_paths) <= 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.member_feed_posts enable row level security;
create index member_feed_posts_created_idx
  on public.member_feed_posts (created_at desc);
create index member_feed_posts_author_created_idx
  on public.member_feed_posts (author_id, created_at desc);
create trigger member_feed_posts_updated_at
before update on public.member_feed_posts
for each row execute function public.set_updated_at();

create table public.member_feed_likes (
  post_id uuid not null references public.member_feed_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
alter table public.member_feed_likes enable row level security;
create index member_feed_likes_profile_idx
  on public.member_feed_likes (profile_id, created_at desc);

create policy "feed posts public read" on public.member_feed_posts
  for select to anon, authenticated using (true);
create policy "feed posts own insert" on public.member_feed_posts
  for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "feed posts own update" on public.member_feed_posts
  for update to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()))
  with check (author_id = (select auth.uid()) or (select public.is_admin()));
create policy "feed posts own delete" on public.member_feed_posts
  for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));

create policy "feed likes public read" on public.member_feed_likes
  for select to anon, authenticated using (true);
create policy "feed likes own insert" on public.member_feed_likes
  for insert to authenticated
  with check (profile_id = (select auth.uid()));
create policy "feed likes own delete" on public.member_feed_likes
  for delete to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

-- Database-level anti-burst guard. The action also validates input, but direct
-- Data API writes must obey the same minimum interval.
create or replace function public.guard_member_feed_rate()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.member_feed_posts p
    where p.author_id = new.author_id
      and p.created_at > now() - interval '10 seconds'
  ) then
    raise exception 'Please wait before posting again'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger member_feed_rate_guard
before insert on public.member_feed_posts
for each row execute function public.guard_member_feed_rate();

grant select on public.member_feed_posts, public.member_feed_likes
  to anon, authenticated;
grant insert, update, delete on public.member_feed_posts to authenticated;
grant insert, delete on public.member_feed_likes to authenticated;
