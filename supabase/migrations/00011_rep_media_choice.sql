-- Representative media explicit choice (PRD 6.8): when a post carries both
-- images and a video link, the author decides which one represents the post
-- everywhere (list thumbnail, detail hero, OG image).
alter table public.posts
  add column if not exists rep_is_video boolean not null default false;

-- Preserve prior behavior for existing rows: video-only posts were fronted
-- by the video before this column existed.
update public.posts
  set rep_is_video = true
  where rep_video_url is not null and rep_image_path is null;

-- Recreate the anon-safe teaser view with the new column appended.
create or replace view public.public_posts as
select
  p.id,
  p.menu_id,
  p.type,
  p.status,
  p.title_en,
  p.title_ko,
  left(p.body_en, 600) as body_teaser_en,
  left(coalesce(p.body_ko, ''), 600) as body_teaser_ko,
  length(p.body_en) > 600 as body_truncated,
  p.category_id,
  p.rep_image_path,
  p.rep_video_url,
  p.deadline,
  p.closed_at,
  p.published_at,
  p.created_at,
  pr.uid as author_uid,
  pr.display_name as author_name,
  pr.company_name as author_company,
  p.rep_is_video
from public.posts p
join public.profiles pr on pr.id = p.author_id
where p.status in ('approved','closed');
