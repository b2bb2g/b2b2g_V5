-- Admin inline post management: let console staff (review/content permission)
-- edit any member post through the shared writer. The RLS update policy and
-- the /write page already admit staff; save_post_bundle was the missing link,
-- because it pinned the update to author_id = auth.uid() and silently dropped
-- media rows whose storage path lives under the *author's* folder.
--
-- Changes, scoped to the update branch only (creation is unchanged):
-- 1. Ownership: the editor must be the author OR hold review/content.
-- 2. Status: a privileged edit of someone else's post preserves the current
--    status (fixing a live post must not unpublish it); the author's own
--    edits keep the existing draft/pending re-review behavior.
-- 3. Asset paths: accept storage paths under the post author's folder as well
--    as the editor's own upload folder (new files an admin uploads land in
--    the admin's folder per the storage insert policy).
create or replace function public.save_post_bundle(
  p_post_id uuid,
  p_menu_slug text,
  p_title_en text,
  p_title_ko text,
  p_body_en text,
  p_body_ko text,
  p_category_id uuid,
  p_deadline date,
  p_rep_video_url text,
  p_rep_is_video boolean,
  p_rep_image_path text,
  p_as_draft boolean,
  p_specs jsonb,
  p_image_paths jsonb,
  p_attachments jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid := p_post_id;
  target_menu public.menus%rowtype;
  target_status text := case when p_as_draft then 'draft' else 'pending' end;
  current_user_id uuid := auth.uid();
  is_privileged boolean;
  post_author uuid;
  current_status text;
  editor_prefix text;
  author_prefix text;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  is_privileged := public.has_admin_permission('review')
    or public.has_admin_permission('content');
  editor_prefix := current_user_id::text || '/%';
  author_prefix := editor_prefix;

  select * into target_menu
  from public.menus
  where slug = p_menu_slug;
  if not found then
    raise exception 'Menu not found' using errcode = '22023';
  end if;

  if target_id is null then
    insert into public.posts (
      menu_id, author_id, type, status, title_en, title_ko, body_en, body_ko,
      category_id, deadline, rep_video_url, rep_is_video, rep_image_path
    ) values (
      target_menu.id, current_user_id, target_menu.board_type, target_status,
      p_title_en, nullif(p_title_ko, ''), p_body_en, nullif(p_body_ko, ''),
      p_category_id, p_deadline, nullif(p_rep_video_url, ''),
      p_rep_is_video and nullif(p_rep_video_url, '') is not null,
      case
        when p_rep_image_path like editor_prefix then p_rep_image_path
        else null
      end
    ) returning id into target_id;
  else
    select author_id, status into post_author, current_status
    from public.posts
    where id = target_id;
    if not found
      or (post_author <> current_user_id and not is_privileged) then
      raise exception 'Post not found' using errcode = 'P0002';
    end if;
    author_prefix := post_author::text || '/%';
    if post_author <> current_user_id then
      -- Privileged edit on behalf of the author: keep the publication state.
      target_status := current_status;
    end if;

    update public.posts
    set menu_id = target_menu.id,
        type = target_menu.board_type,
        status = target_status,
        title_en = p_title_en,
        title_ko = nullif(p_title_ko, ''),
        body_en = p_body_en,
        body_ko = nullif(p_body_ko, ''),
        category_id = p_category_id,
        deadline = p_deadline,
        rep_video_url = nullif(p_rep_video_url, ''),
        rep_is_video = p_rep_is_video and nullif(p_rep_video_url, '') is not null,
        rep_image_path = case
          when p_rep_image_path like author_prefix
            or p_rep_image_path like editor_prefix then p_rep_image_path
          else null
        end
    where id = target_id
    returning id into target_id;
    if not found then
      raise exception 'Post not found' using errcode = 'P0002';
    end if;

    delete from public.post_specs where post_id = target_id;
    delete from public.post_media where post_id = target_id;
    delete from public.post_attachments where post_id = target_id;
  end if;

  insert into public.post_specs (
    post_id, field_def_id, name_en, name_ko, value, sort_order
  )
  select target_id,
    nullif(item ->> 'fieldDefId', '')::uuid,
    item ->> 'nameEn',
    nullif(item ->> 'nameKo', ''),
    item ->> 'value',
    ordinality - 1
  from jsonb_array_elements(coalesce(p_specs, '[]'::jsonb))
    with ordinality as rows(item, ordinality)
  where nullif(item ->> 'nameEn', '') is not null
    and nullif(item ->> 'value', '') is not null;

  insert into public.post_media (post_id, path, sort_order)
  select target_id, trim(both '"' from item::text), ordinality - 1
  from jsonb_array_elements(coalesce(p_image_paths, '[]'::jsonb))
    with ordinality as rows(item, ordinality)
  where trim(both '"' from item::text) like author_prefix
     or trim(both '"' from item::text) like editor_prefix;

  insert into public.post_attachments (post_id, path, filename, size_bytes)
  select target_id,
    item ->> 'path',
    item ->> 'name',
    greatest(0, coalesce((item ->> 'size')::bigint, 0))
  from jsonb_array_elements(coalesce(p_attachments, '[]'::jsonb)) item
  where (item ->> 'path' like author_prefix or item ->> 'path' like editor_prefix)
    and nullif(item ->> 'name', '') is not null;

  return target_id;
end;
$$;

revoke all on function public.save_post_bundle(
  uuid, text, text, text, text, text, uuid, date, text, boolean, text,
  boolean, jsonb, jsonb, jsonb
) from public, anon;
grant execute on function public.save_post_bundle(
  uuid, text, text, text, text, text, uuid, date, text, boolean, text,
  boolean, jsonb, jsonb, jsonb
) to authenticated;
