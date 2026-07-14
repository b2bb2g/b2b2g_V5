-- Admin operations control plane
-- Adds staff assignments, scoped console permissions, operational settings,
-- and durable delivery/job monitoring without exposing auth secrets.

create table public.admin_staff_assignments (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null default 'reviewer'
    check (role in ('manager', 'reviewer', 'support', 'content')),
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_staff_permissions_known check (
    permissions <@ array[
      'overview', 'review', 'members', 'subscriptions', 'catalog',
      'content', 'notifications', 'security', 'settings', 'audit', 'team'
    ]::text[]
  )
);
alter table public.admin_staff_assignments enable row level security;
create index admin_staff_active_role_idx
  on public.admin_staff_assignments (is_active, role);

create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select p.is_admin from public.profiles p where p.id = (select auth.uid())
  ), false);
$$;

create or replace function public.is_admin()
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
  );
$$;

create or replace function public.has_admin_permission(requested text)
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
      and requested = any(assignment.permissions)
  );
$$;

revoke execute on function public.is_platform_owner() from public, anon;
revoke execute on function public.has_admin_permission(text) from public, anon;
grant execute on function public.is_platform_owner() to authenticated;
grant execute on function public.has_admin_permission(text) to authenticated;

-- Replace the former all-or-nothing admin writes with scoped staff access.
alter policy "settings public read" on public.site_settings
  using (
    is_public
    or (select public.is_platform_owner())
    or ((select public.has_admin_permission('notifications')) and (key like 'email_notify_%' or key in ('subscription_expiry_notice_days', 'admin_digest_hour')))
    or ((select public.has_admin_permission('security')) and key in ('login_session_policy', 'new_device_email_alert', 'suspicious_login_email_alert', 'failed_login_threshold', 'security_log_retention_days'))
    or (select public.has_admin_permission('settings'))
  );
alter policy "settings admin write" on public.site_settings
  using (
    (select public.has_admin_permission('settings'))
    or (select public.has_admin_permission('notifications'))
    or (select public.has_admin_permission('security'))
    or (select public.has_admin_permission('content'))
  )
  with check (
    (select public.has_admin_permission('settings'))
    or (select public.has_admin_permission('notifications'))
    or (select public.has_admin_permission('security'))
    or (select public.has_admin_permission('content'))
  );
alter policy "tiers admin write" on public.member_tiers
  using ((select public.has_admin_permission('catalog')))
  with check ((select public.has_admin_permission('catalog')));
alter policy "tier perms admin write" on public.tier_permissions
  using ((select public.has_admin_permission('catalog')))
  with check ((select public.has_admin_permission('catalog')));
alter policy "profiles self update" on public.profiles
  using (id = (select auth.uid()) or (select public.has_admin_permission('members')))
  with check (id = (select auth.uid()) or (select public.has_admin_permission('members')));
alter policy "contacts self read" on public.profile_contacts
  using (
    profile_id = (select auth.uid())
    or (select public.has_admin_permission('members'))
    or public.is_direct_referrer_coordinator(profile_id)
  );
alter policy "contacts self update" on public.profile_contacts
  using (profile_id = (select auth.uid()) or (select public.has_admin_permission('members')))
  with check (profile_id = (select auth.uid()) or (select public.has_admin_permission('members')));
alter policy "memos admin only" on public.member_admin_memos
  using ((select public.has_admin_permission('members')))
  with check ((select public.has_admin_permission('members')));
alter policy "badge types admin write" on public.badge_types
  using ((select public.has_admin_permission('review')))
  with check ((select public.has_admin_permission('review')));
alter policy "member badges admin write" on public.member_badges
  using ((select public.has_admin_permission('review')))
  with check ((select public.has_admin_permission('review')));
alter policy "badge apps admin update" on public.badge_applications
  using ((select public.has_admin_permission('review')))
  with check ((select public.has_admin_permission('review')));
alter policy "badge apps own read" on public.badge_applications
  using (profile_id = (select auth.uid()) or (select public.has_admin_permission('review')));
alter policy "subs own read" on public.subscriptions
  using (profile_id = (select auth.uid()) or (select public.has_admin_permission('subscriptions')));
alter policy "subs admin write" on public.subscriptions
  using ((select public.has_admin_permission('subscriptions')))
  with check ((select public.has_admin_permission('subscriptions')));
alter policy "menus admin write" on public.menus
  using ((select public.has_admin_permission('catalog')))
  with check ((select public.has_admin_permission('catalog')));
alter policy "categories admin write" on public.categories
  using ((select public.has_admin_permission('catalog')))
  with check ((select public.has_admin_permission('catalog')));
alter policy "spec defs admin write" on public.spec_field_defs
  using ((select public.has_admin_permission('catalog')))
  with check ((select public.has_admin_permission('catalog')));
alter policy "inquiries admin update" on public.inquiries
  using ((select public.has_admin_permission('review')))
  with check ((select public.has_admin_permission('review')));
alter policy "inquiry messages admin update" on public.inquiry_messages
  using ((select public.has_admin_permission('review')))
  with check ((select public.has_admin_permission('review')));
alter policy "inquiries participant read" on public.inquiries
  using (
    sender_id = (select auth.uid())
    or recipient_id = (select auth.uid())
    or (select public.has_admin_permission('review'))
    or public.coordinator_can_view_inquiry(id)
  );
alter policy "inquiry messages read" on public.inquiry_messages
  using (
    (select public.has_admin_permission('review'))
    or sender_id = (select auth.uid())
    or (public.is_inquiry_participant(inquiry_id) and review_status = 'forwarded')
    or public.coordinator_can_view_inquiry(inquiry_id)
  );
alter policy "coord messages read" on public.coordinator_messages
  using ((select public.has_admin_permission('review')) or ((select auth.uid()) in (coordinator_id, member_id)));
alter policy "notifications self all" on public.notifications
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
alter policy "audit admin read" on public.audit_logs
  using ((select public.has_admin_permission('audit')));
alter policy "trusted devices own read" on public.trusted_devices
  using (profile_id = (select auth.uid()) or (select public.has_admin_permission('security')));
alter policy "trusted devices own delete" on public.trusted_devices
  using (profile_id = (select auth.uid()) or (select public.has_admin_permission('security')));
alter policy "login events self read" on public.login_events
  using (profile_id = (select auth.uid()) or (select public.has_admin_permission('security')));
alter policy "login failures admin read" on public.login_failure_events
  using ((select public.has_admin_permission('security')));

alter policy "posts member read" on public.posts
  using (
    status in ('approved','closed')
    or author_id = (select auth.uid())
    or (select public.has_admin_permission('review'))
    or (select public.has_admin_permission('content'))
  );
alter policy "posts author insert" on public.posts
  with check (
    author_id = (select auth.uid())
    and status in ('draft','pending')
    and (
      (select public.has_admin_permission('content'))
      or exists (select 1 from public.menus m where m.id = menu_id and m.member_write)
    )
  );
alter policy "posts author update" on public.posts
  using (author_id = (select auth.uid()) or (select public.has_admin_permission('review')) or (select public.has_admin_permission('content')))
  with check (author_id = (select auth.uid()) or (select public.has_admin_permission('review')) or (select public.has_admin_permission('content')));
alter policy "posts author delete" on public.posts
  using (author_id = (select auth.uid()) or (select public.has_admin_permission('content')));

create policy "admin staff self or admin read"
  on public.admin_staff_assignments for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy "admin staff owner insert"
  on public.admin_staff_assignments for insert to authenticated
  with check ((select public.is_platform_owner()));
create policy "admin staff owner update"
  on public.admin_staff_assignments for update to authenticated
  using ((select public.is_platform_owner()))
  with check ((select public.is_platform_owner()));
create policy "admin staff owner delete"
  on public.admin_staff_assignments for delete to authenticated
  using ((select public.is_platform_owner()));

grant select on public.admin_staff_assignments to authenticated;
grant insert, update, delete on public.admin_staff_assignments to authenticated;

-- Staff members may operate through existing admin RLS, but protected role
-- columns remain owner-only so a staff account cannot promote itself.
create or replace function public.guard_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_owner() then
    new.is_admin := old.is_admin;
    new.uid := old.uid;
    if not public.has_admin_permission('members') then
      new.is_coordinator := old.is_coordinator;
      new.coordinator_msg_override := old.coordinator_msg_override;
      new.status := old.status;
      new.suspend_reason := old.suspend_reason;
      new.referred_by := old.referred_by;
    end if;
    if not public.has_admin_permission('subscriptions') then
      new.tier_id := old.tier_id;
    end if;
  end if;
  return new;
end;
$$;

create table public.admin_delivery_events (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('email', 'notification', 'job')),
  event_type text not null,
  status text not null check (status in ('queued', 'sent', 'failed', 'skipped')),
  recipient_profile_id uuid references public.profiles(id) on delete set null,
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_delivery_events enable row level security;
create index admin_delivery_events_status_time_idx
  on public.admin_delivery_events (status, created_at desc);
create index admin_delivery_events_type_time_idx
  on public.admin_delivery_events (event_type, created_at desc);
create policy "admin delivery events read"
  on public.admin_delivery_events for select to authenticated
  using ((select public.has_admin_permission('notifications')) or (select public.has_admin_permission('security')));
create policy "admin delivery events insert"
  on public.admin_delivery_events for insert to authenticated
  with check ((select public.is_admin()));
grant select, insert on public.admin_delivery_events to authenticated;

create or replace function public.admin_revoke_member_device(p_device_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.trusted_devices%rowtype;
begin
  if not public.has_admin_permission('security') then
    raise exception 'security permission required';
  end if;

  select * into target from public.trusted_devices where id = p_device_id;
  if target.id is null then return; end if;

  if target.current_session_id is not null then
    delete from auth.sessions
    where id = target.current_session_id and user_id = target.profile_id;
  end if;
  delete from public.trusted_devices where id = p_device_id;

  insert into public.audit_logs (admin_id, action, target_type, target_id, details)
  values ((select auth.uid()), 'member_device_revoked', 'trusted_device', p_device_id::text,
    jsonb_build_object('profile_id', target.profile_id, 'label', target.label));
end;
$$;
revoke execute on function public.admin_revoke_member_device(uuid) from public, anon;
grant execute on function public.admin_revoke_member_device(uuid) to authenticated;

create or replace function public.admin_run_expirations()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_admin_permission('subscriptions') then
    raise exception 'Admin subscription permission required';
  end if;
  perform public.process_expirations();
end;
$$;
revoke execute on function public.admin_run_expirations() from public, anon;
grant execute on function public.admin_run_expirations() to authenticated;

insert into public.site_settings (key, value, is_public) values
  ('email_notify_subscription_expiring', 'true', false),
  ('email_notify_security_alert', 'true', false),
  ('email_notify_admin_digest', 'false', false),
  ('admin_digest_hour', '9', false),
  ('admin_queue_sla_hours', '24', false),
  ('cookie_banner_text_en', '"We use essential cookies to keep B2BB2G secure and reliable."', true),
  ('cookie_banner_text_ko', '"B2BB2G의 보안과 안정적인 운영을 위해 필수 쿠키를 사용합니다."', true)
on conflict (key) do nothing;

create trigger admin_staff_updated_at
  before update on public.admin_staff_assignments
  for each row execute function public.set_updated_at();
