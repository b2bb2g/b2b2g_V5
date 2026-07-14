-- Finish wiring admin-controlled operational settings to their runtime effects.

alter policy "settings public read" on public.site_settings
  using (
    is_public
    or (select public.is_platform_owner())
    or ((select public.has_admin_permission('overview')) and key = 'admin_queue_sla_hours')
    or ((select public.has_admin_permission('notifications')) and (key like 'email_notify_%' or key = 'subscription_expiry_notice_days'))
    or ((select public.has_admin_permission('security')) and key in ('login_session_policy', 'new_device_email_alert', 'suspicious_login_email_alert', 'failed_login_threshold', 'security_log_retention_days'))
    or (select public.has_admin_permission('settings'))
  );

-- These switches were drafted during the operations-console work but do not
-- have a durable server-side mail scheduler. Do not expose no-op controls.
delete from public.site_settings
where key in (
  'email_notify_subscription_expiring',
  'email_notify_security_alert',
  'email_notify_admin_digest',
  'admin_digest_hour'
);

create or replace function public.process_expirations()
returns void language plpgsql security definer set search_path = public as $$
declare
  cert_badge uuid;
  notice_days int;
  retention_days int;
begin
  select id into cert_badge from public.badge_types where code = 'certified';
  select coalesce((value)::int, 7) into notice_days
    from public.site_settings where key = 'subscription_expiry_notice_days';
  select greatest(30, least(coalesce((value)::int, 90), 3650)) into retention_days
    from public.site_settings where key = 'security_log_retention_days';
  retention_days := coalesce(retention_days, 90);

  update public.posts
  set status = 'closed', closed_at = now()
  where type = 'request' and status = 'approved'
    and deadline is not null and deadline < current_date;

  with expired as (
    update public.subscriptions
    set status = 'expired'
    where status = 'active' and expires_at < now()
    returning profile_id
  )
  delete from public.member_badges mb
  using expired e
  where mb.profile_id = e.profile_id and mb.badge_type_id = cert_badge
    and not exists (
      select 1 from public.subscriptions s
      where s.profile_id = e.profile_id and s.status = 'active' and s.expires_at >= now()
    );

  insert into public.notifications (profile_id, type, payload)
  select s.profile_id, 'subscription_expiring',
    jsonb_build_object('subscription_id', s.id, 'expires_at', s.expires_at)
  from public.subscriptions s
  where s.status = 'active'
    and s.expires_at between now() and now() + make_interval(days => notice_days)
    and not exists (
      select 1 from public.notifications n
      where n.profile_id = s.profile_id
        and n.type = 'subscription_expiring'
        and (n.payload ->> 'subscription_id') = s.id::text
    );

  delete from public.login_events
  where created_at < now() - make_interval(days => retention_days);
  delete from public.login_failure_events
  where created_at < now() - make_interval(days => retention_days);
end;
$$;

revoke execute on function public.process_expirations() from public, anon, authenticated;
