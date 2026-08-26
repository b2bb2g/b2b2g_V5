-- Wire the existing event schedule columns into the shared atomic post writer.
-- The previous function signature is replaced so PostgREST exposes one
-- unambiguous save_post_bundle RPC. New schedule arguments are trailing
-- defaults so the currently deployed app remains compatible while the new
-- build rolls out.
drop function if exists public.save_post_bundle(
  uuid, text, text, text, text, text, uuid, date, text, boolean, text,
  boolean, jsonb, jsonb, jsonb
);

create function public.save_post_bundle(
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
  p_attachments jsonb,
  p_event_start date default null,
  p_event_end date default null,
  p_event_venue text default null
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

  if target_menu.board_type = 'flexible' then
    if not p_as_draft and p_event_start is null then
      raise exception 'Event start date is required' using errcode = '22023';
    end if;
    if p_event_start is not null and p_event_end is not null
      and p_event_end < p_event_start then
      raise exception 'Event end date cannot precede start date' using errcode = '22023';
    end if;
    if length(p_event_venue) > 200 then
      raise exception 'Event venue is too long' using errcode = '22023';
    end if;
  end if;

  if target_id is null then
    insert into public.posts (
      menu_id, author_id, type, status, title_en, title_ko, body_en, body_ko,
      category_id, deadline, event_start, event_end, event_venue,
      rep_video_url, rep_is_video, rep_image_path
    ) values (
      target_menu.id, current_user_id, target_menu.board_type, target_status,
      p_title_en, nullif(p_title_ko, ''), p_body_en, nullif(p_body_ko, ''),
      p_category_id, p_deadline,
      case when target_menu.board_type = 'flexible' then p_event_start else null end,
      case when target_menu.board_type = 'flexible' then p_event_end else null end,
      case when target_menu.board_type = 'flexible' then nullif(trim(p_event_venue), '') else null end,
      nullif(p_rep_video_url, ''),
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
        event_start = case
          when target_menu.board_type = 'flexible' then p_event_start else null
        end,
        event_end = case
          when target_menu.board_type = 'flexible' then p_event_end else null
        end,
        event_venue = case
          when target_menu.board_type = 'flexible' then nullif(trim(p_event_venue), '')
          else null
        end,
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
  boolean, jsonb, jsonb, jsonb, date, date, text
) from public, anon;
grant execute on function public.save_post_bundle(
  uuid, text, text, text, text, text, uuid, date, text, boolean, text,
  boolean, jsonb, jsonb, jsonb, date, date, text
) to authenticated;
