alter table public.member_feed_posts
  drop constraint if exists member_feed_posts_media_paths_check;

alter table public.member_feed_posts
  add constraint member_feed_posts_media_paths_check
  check (cardinality(media_paths) <= 10);
