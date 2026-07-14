-- Complete the staff permission boundary for legacy RLS policies, storage
-- objects, and SECURITY DEFINER helpers that previously treated every active
-- staff assignment as a full platform owner.

create or replace function public.has_any_admin_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_owner() or exists (
    select 1
    from public.admin_staff_assignments assignment
    where assignment.profile_id = (select auth.uid())
      and assignment.is_active
      and cardinality(assignment.permissions) > 0
  );
$$;

-- Keep is_admin as the legacy platform-owner predicate. Staff access must use
-- a named permission so old policies cannot silently grant full access.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_owner();
$$;

revoke execute on function public.has_any_admin_access() from public, anon;
grant execute on function public.has_any_admin_access() to authenticated;

create or replace function public.can_read_post(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_id
      and (
        p.status in ('approved','closed')
        or p.author_id = auth.uid()
        or public.has_admin_permission('review')
        or public.has_admin_permission('content')
      )
  );
$$;

create or replace function public.enforce_notice_admin_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.menus m
    where m.id = new.menu_id
      and m.slug = 'notices'
  ) and not public.has_admin_permission('content') then
    raise exception 'Content permission is required to write notices'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.guard_post_status()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if not public.has_admin_permission('review') then
    if new.status in ('approved','rejected') and old.status is distinct from new.status then
      raise exception 'Review permission is required to approve or reject posts';
    end if;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.reject_reason := old.reject_reason;
  end if;
  if new.status = 'approved' and old.status is distinct from new.status then
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create or replace function public.log_audit(
  a_action text,
  a_target_type text,
  a_target_id text,
  a_detail jsonb
)
returns void
language sql
security definer
set search_path = 'public'
as $$
  insert into public.audit_logs (actor_id, action, target_type, target_id, detail)
  select auth.uid(), a_action, a_target_type, a_target_id, coalesce(a_detail, '{}'::jsonb)
  where public.has_any_admin_access();
$$;

create or replace function public.revoke_referral_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.referral_invitations
  set status = 'revoked', revoked_at = now(), revoked_by = auth.uid()
  where id = p_invitation_id
    and status in ('active', 'reserved')
    and (inviter_id = auth.uid() or public.has_admin_permission('members'));
  if not found then raise exception 'invitation cannot be revoked'; end if;
end;
$$;

create or replace function public.withdraw_member(target uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if auth.uid() is distinct from target and not public.has_admin_permission('members') then
    raise exception 'Member permission is required';
  end if;

  update public.profiles
  set display_name = 'Withdrawn member', company_name = null, bio = null,
      avatar_url = null, status = 'withdrawn', suspend_reason = null,
      is_coordinator = false
  where id = target;
  update public.profile_contacts
  set email = null, phone = null, contact_person = null
  where profile_id = target;
  delete from public.mini_homepages where profile_id = target;
  insert into public.audit_logs (actor_id, action, target_type, target_id, detail)
  values (auth.uid(), 'member_withdraw', 'profile', target::text, '{}'::jsonb);
end;
$$;

alter policy "admin delivery events insert" on public.admin_delivery_events
  with check (
    (select public.has_admin_permission('review'))
    or (select public.has_admin_permission('notifications'))
    or (select public.has_admin_permission('security'))
  );
alter policy "admin staff self or admin read" on public.admin_staff_assignments
  using (
    profile_id = (select auth.uid())
    or (select public.is_platform_owner())
    or (select public.has_admin_permission('team'))
  );
alter policy "benefits admin write" on public.benefits
  using ((select public.has_admin_permission('subscriptions')))
  with check ((select public.has_admin_permission('subscriptions')));
alter policy "login events admin read" on public.login_events
  using ((select public.has_admin_permission('security')));
alter policy "member blocks own delete" on public.member_blocks
  using (blocker_id = (select auth.uid()) or (select public.has_admin_permission('review')));
alter policy "feed comments own delete" on public.member_feed_comments
  using (author_id = (select auth.uid()) or (select public.has_admin_permission('review')));
alter policy "feed likes own delete" on public.member_feed_likes
  using (profile_id = (select auth.uid()) or (select public.has_admin_permission('review')));
alter policy "feed posts authenticated visible read" on public.member_feed_posts
  using (
    author_id = (select auth.uid())
    or (select public.has_admin_permission('review'))
    or (
      moderation_status = 'visible'
      and not exists (
        select 1 from public.member_blocks b
        where (b.blocker_id = (select auth.uid()) and b.blocked_id = member_feed_posts.author_id)
           or (b.blocked_id = (select auth.uid()) and b.blocker_id = member_feed_posts.author_id)
      )
    )
  );
alter policy "feed posts own delete" on public.member_feed_posts
  using (author_id = (select auth.uid()) or (select public.has_admin_permission('review')));
alter policy "feed posts own update" on public.member_feed_posts
  using (author_id = (select auth.uid()) or (select public.has_admin_permission('review')))
  with check (author_id = (select auth.uid()) or (select public.has_admin_permission('review')));
alter policy "feed reports admin update" on public.member_feed_reports
  using ((select public.has_admin_permission('review')))
  with check ((select public.has_admin_permission('review')));
alter policy "feed reports own or admin read" on public.member_feed_reports
  using (reporter_id = (select auth.uid()) or (select public.has_admin_permission('review')));
alter policy "feed reposts own delete" on public.member_feed_reposts
  using (profile_id = (select auth.uid()) or (select public.has_admin_permission('review')));
alter policy "feed shares own delete" on public.member_feed_shares
  using (profile_id = (select auth.uid()) or (select public.has_admin_permission('review')));
alter policy "member follows own delete" on public.member_follows
  using (follower_id = (select auth.uid()) or (select public.has_admin_permission('review')));
alter policy "minihome owner write" on public.mini_homepages
  using (profile_id = (select auth.uid()) or (select public.has_admin_permission('members')))
  with check (profile_id = (select auth.uid()) or (select public.has_admin_permission('members')));
alter policy "minihome public read" on public.mini_homepages
  using (is_published or profile_id = (select auth.uid()) or (select public.has_admin_permission('members')));
alter policy "post attachments author write" on public.post_attachments
  using (exists (
    select 1 from public.posts p where p.id = post_id
      and (p.author_id = (select auth.uid()) or (select public.has_admin_permission('content')))
  ))
  with check (exists (
    select 1 from public.posts p where p.id = post_id
      and (p.author_id = (select auth.uid()) or (select public.has_admin_permission('content')))
  ));
alter policy "post media author write" on public.post_media
  using (exists (
    select 1 from public.posts p where p.id = post_id
      and (p.author_id = (select auth.uid()) or (select public.has_admin_permission('content')))
  ))
  with check (exists (
    select 1 from public.posts p where p.id = post_id
      and (p.author_id = (select auth.uid()) or (select public.has_admin_permission('content')))
  ));
alter policy "post specs author write" on public.post_specs
  using (exists (
    select 1 from public.posts p where p.id = post_id
      and (p.author_id = (select auth.uid()) or (select public.has_admin_permission('content')))
  ))
  with check (exists (
    select 1 from public.posts p where p.id = post_id
      and (p.author_id = (select auth.uid()) or (select public.has_admin_permission('content')))
  ));
alter policy "referral invitations owner read" on public.referral_invitations
  using (
    inviter_id = (select auth.uid())
    or (select public.has_admin_permission('members'))
    or (select public.has_admin_permission('security'))
  );

alter policy "attachments delete own" on storage.objects
  using (
    bucket_id = 'attachments'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select public.has_admin_permission('content'))
    )
  );
alter policy "badge docs delete own" on storage.objects
  using (
    bucket_id = 'badge-docs'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select public.has_admin_permission('review'))
    )
  );
alter policy "badge docs owner read" on storage.objects
  using (
    bucket_id = 'badge-docs'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select public.has_admin_permission('review'))
    )
  );
alter policy "post media delete own" on storage.objects
  using (
    bucket_id = 'post-media'
    and (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      or (select public.has_admin_permission('content'))
    )
  );

