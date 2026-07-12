-- Operational hardening: atomic post bundles and trust controls for the
-- public member network. All functions remain RLS-aware unless explicitly
-- limited to administrators.

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
security invoker
set search_path = ''
as $$
declare
  target_id uuid := p_post_id;
  target_menu public.menus%rowtype;
  target_status text := case when p_as_draft then 'draft' else 'pending' end;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

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
        when p_rep_image_path like current_user_id::text || '/%' then p_rep_image_path
        else null
      end
    ) returning id into target_id;
  else
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
          when p_rep_image_path like current_user_id::text || '/%' then p_rep_image_path
          else null
        end
    where id = target_id and author_id = current_user_id
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
  where trim(both '"' from item::text) like current_user_id::text || '/%';

  insert into public.post_attachments (post_id, path, filename, size_bytes)
  select target_id,
    item ->> 'path',
    item ->> 'name',
    greatest(0, coalesce((item ->> 'size')::bigint, 0))
  from jsonb_array_elements(coalesce(p_attachments, '[]'::jsonb)) item
  where item ->> 'path' like current_user_id::text || '/%'
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

alter table public.member_feed_posts
  add column if not exists moderation_status text not null default 'visible'
  check (moderation_status in ('visible', 'hidden'));
alter table public.member_feed_posts
  add column if not exists moderation_note text;
create index if not exists member_feed_posts_moderation_created_idx
  on public.member_feed_posts (moderation_status, created_at desc);

create table if not exists public.member_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.member_blocks enable row level security;
create index if not exists member_blocks_blocked_idx
  on public.member_blocks (blocked_id, created_at desc);

create table if not exists public.member_feed_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.member_feed_posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('spam', 'misleading', 'abuse', 'other')),
  details text check (char_length(details) <= 500),
  status text not null default 'pending'
    check (status in ('pending', 'resolved', 'dismissed')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);
alter table public.member_feed_reports enable row level security;
create index if not exists member_feed_reports_status_created_idx
  on public.member_feed_reports (status, created_at);

drop policy if exists "feed posts public read" on public.member_feed_posts;
create policy "feed posts anon visible read" on public.member_feed_posts
  for select to anon using (moderation_status = 'visible');
create policy "feed posts authenticated visible read" on public.member_feed_posts
  for select to authenticated using (
    author_id = (select auth.uid())
    or (select public.is_admin())
    or (
      moderation_status = 'visible'
      and not exists (
        select 1 from public.member_blocks b
        where (b.blocker_id = (select auth.uid()) and b.blocked_id = author_id)
           or (b.blocked_id = (select auth.uid()) and b.blocker_id = author_id)
      )
    )
  );

create policy "member blocks own read" on public.member_blocks
  for select to authenticated
  using (blocker_id = (select auth.uid()));
create policy "member blocks own insert" on public.member_blocks
  for insert to authenticated
  with check (blocker_id = (select auth.uid()));
create policy "member blocks own delete" on public.member_blocks
  for delete to authenticated
  using (blocker_id = (select auth.uid()) or (select public.is_admin()));

create policy "feed reports own insert" on public.member_feed_reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()));
create policy "feed reports own or admin read" on public.member_feed_reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));
create policy "feed reports admin update" on public.member_feed_reports
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select, insert, delete on public.member_blocks to authenticated;
grant select, insert, update on public.member_feed_reports to authenticated;

create or replace function public.guard_member_feed_comment_rate()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.member_feed_comments c
    where c.author_id = new.author_id
      and c.created_at > now() - interval '5 seconds'
  ) then
    raise exception 'Please wait before commenting again' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists member_feed_comment_rate_guard
  on public.member_feed_comments;
create trigger member_feed_comment_rate_guard
before insert on public.member_feed_comments
for each row execute function public.guard_member_feed_comment_rate();

revoke execute on function public.guard_member_feed_comment_rate()
  from public, anon, authenticated;

create or replace function public.member_dashboard_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'posts', (select count(*) from public.posts p
      where p.author_id = (select auth.uid()) and p.status <> 'draft'),
    'drafts', (select count(*) from public.posts p
      where p.author_id = (select auth.uid()) and p.status = 'draft'),
    'pending', (select count(*) from public.posts p
      where p.author_id = (select auth.uid()) and p.status = 'pending'),
    'inquiries', (select count(*) from public.inquiries i
      where (select auth.uid()) in (i.sender_id, i.recipient_id)),
    'unread_replies', (select count(*) from public.notifications n
      where n.profile_id = (select auth.uid()) and n.state = 'unread'
        and n.type = 'message_delivered'),
    'referrals', (select count(*) from public.profiles p
      where p.referred_by = (select auth.uid())),
    'feed_posts', (select count(*) from public.member_feed_posts f
      where f.author_id = (select auth.uid())),
    'followers', (select count(*) from public.member_follows f
      where f.following_id = (select auth.uid()))
  );
$$;

revoke all on function public.member_dashboard_summary() from public, anon;
grant execute on function public.member_dashboard_summary() to authenticated;

create or replace function public.update_member_profile(
  p_display_name text,
  p_company_name text,
  p_bio_en text,
  p_bio_ko text,
  p_phone text,
  p_contact_person text,
  p_avatar_path text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  update public.profiles
  set display_name = nullif(p_display_name, ''),
      company_name = nullif(p_company_name, ''),
      bio = nullif(p_bio_en, ''),
      bio_en = nullif(p_bio_en, ''),
      bio_ko = nullif(p_bio_ko, ''),
      avatar_url = case
        when p_avatar_path like current_user_id::text || '/%' then p_avatar_path
        else null
      end
  where id = current_user_id;

  insert into public.profile_contacts (
    profile_id, phone, contact_person
  ) values (
    current_user_id, nullif(p_phone, ''), nullif(p_contact_person, '')
  )
  on conflict (profile_id) do update
  set phone = excluded.phone,
      contact_person = excluded.contact_person;
end;
$$;

revoke all on function public.update_member_profile(
  text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.update_member_profile(
  text, text, text, text, text, text, text
) to authenticated;

create or replace function public.create_inquiry_with_message(
  p_post_id uuid,
  p_to_profile_id uuid,
  p_subject text,
  p_body text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  recipient_id uuid;
  default_subject text;
  inquiry_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if nullif(trim(p_body), '') is null then
    raise exception 'Message is required' using errcode = '22023';
  end if;

  if p_post_id is not null then
    select author_id, title_en into recipient_id, default_subject
    from public.posts where id = p_post_id;
  elsif p_to_profile_id is not null then
    select id, 'UID:' || uid::text into recipient_id, default_subject
    from public.profiles where id = p_to_profile_id and status = 'active';
  end if;
  if recipient_id is null or recipient_id = current_user_id then
    raise exception 'Recipient not available' using errcode = '22023';
  end if;

  insert into public.inquiries (
    post_id, sender_id, recipient_id, subject
  ) values (
    p_post_id, current_user_id, recipient_id,
    coalesce(nullif(trim(p_subject), ''), default_subject)
  ) returning id into inquiry_id;

  insert into public.inquiry_messages (inquiry_id, sender_id, body)
  values (inquiry_id, current_user_id, trim(p_body));
  return inquiry_id;
end;
$$;

revoke all on function public.create_inquiry_with_message(
  uuid, uuid, text, text
) from public, anon;
grant execute on function public.create_inquiry_with_message(
  uuid, uuid, text, text
) to authenticated;
