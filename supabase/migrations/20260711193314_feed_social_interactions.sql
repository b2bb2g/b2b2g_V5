-- LinkedIn-style feed interactions. Reads are public so shared feed URLs can
-- render their social proof. Every write remains authenticated and scoped to
-- the current profile; admin access is limited to moderation deletes.

create table public.member_feed_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.member_feed_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 800),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.member_feed_comments enable row level security;
create index member_feed_comments_post_created_idx
  on public.member_feed_comments (post_id, created_at);
create index member_feed_comments_author_idx
  on public.member_feed_comments (author_id, created_at desc);
create trigger member_feed_comments_updated_at
before update on public.member_feed_comments
for each row execute function public.set_updated_at();

create table public.member_feed_reposts (
  post_id uuid not null references public.member_feed_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
alter table public.member_feed_reposts enable row level security;
create index member_feed_reposts_profile_created_idx
  on public.member_feed_reposts (profile_id, created_at desc);

create table public.member_feed_shares (
  post_id uuid not null references public.member_feed_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);
alter table public.member_feed_shares enable row level security;
create index member_feed_shares_profile_idx
  on public.member_feed_shares (profile_id, created_at desc);

create table public.member_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
alter table public.member_follows enable row level security;
create index member_follows_following_idx
  on public.member_follows (following_id, created_at desc);

create policy "feed comments public read" on public.member_feed_comments
  for select to anon, authenticated using (true);
create policy "feed comments own insert" on public.member_feed_comments
  for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "feed comments own update" on public.member_feed_comments
  for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
create policy "feed comments own delete" on public.member_feed_comments
  for delete to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin()));

create policy "feed reposts public read" on public.member_feed_reposts
  for select to anon, authenticated using (true);
create policy "feed reposts own insert" on public.member_feed_reposts
  for insert to authenticated
  with check (profile_id = (select auth.uid()));
create policy "feed reposts own delete" on public.member_feed_reposts
  for delete to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

create policy "feed shares public read" on public.member_feed_shares
  for select to anon, authenticated using (true);
create policy "feed shares own insert" on public.member_feed_shares
  for insert to authenticated
  with check (profile_id = (select auth.uid()));
create policy "feed shares own delete" on public.member_feed_shares
  for delete to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

create policy "member follows public read" on public.member_follows
  for select to anon, authenticated using (true);
create policy "member follows own insert" on public.member_follows
  for insert to authenticated
  with check (follower_id = (select auth.uid()));
create policy "member follows own delete" on public.member_follows
  for delete to authenticated
  using (follower_id = (select auth.uid()) or (select public.is_admin()));

grant select on public.member_feed_comments, public.member_feed_reposts,
  public.member_feed_shares, public.member_follows to anon, authenticated;
grant insert, update, delete on public.member_feed_comments to authenticated;
grant insert, delete on public.member_feed_reposts, public.member_feed_shares,
  public.member_follows to authenticated;
