-- Popularity ordering for product boards. Aggregate bookmark counts become
-- public information through this view; individual bookmark rows stay
-- private behind their self-only RLS policy.
create or replace view public.public_post_popularity as
select
  pp.id,
  pp.menu_id,
  pp.category_id,
  pp.author_uid,
  pp.published_at,
  coalesce(b.bookmark_count, 0) as bookmark_count
from public.public_posts pp
left join (
  select post_id, count(*)::int as bookmark_count
  from public.post_bookmarks
  group by post_id
) b on b.post_id = pp.id;

grant select on public.public_post_popularity to anon, authenticated;

-- Web push text is localized per device: the locale is captured when the
-- device subscribes and the dispatcher picks the matching copy.
alter table public.push_subscriptions
  add column if not exists locale text not null default 'en';
