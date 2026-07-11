-- Public marketplace identity is UID-first. Approved/closed teaser rows expose
-- only the stable UID plus active public trust-badge labels; profile names and
-- contact fields are not needed by the UI.
--
-- This intentionally preserves the existing owner-executed public_posts view:
-- it is constrained to approved/closed posts and exposes an explicit safe
-- column list. The correlated lookup uses member_badges_profile_idx.
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
  p.rep_is_video,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'code', bt.code,
        'name_en', bt.name_en,
        'name_ko', bt.name_ko
      ) order by bt.code
    )
    from public.member_badges mb
    join public.badge_types bt on bt.id = mb.badge_type_id
    where mb.profile_id = p.author_id
      and bt.is_active = true
  ), '[]'::jsonb) as author_badges
from public.posts p
join public.profiles pr on pr.id = p.author_id
where p.status in ('approved', 'closed');

revoke all on public.public_posts from anon, authenticated;
grant select on public.public_posts to anon, authenticated;
