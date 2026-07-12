-- Invite-gated signup, email availability, and member session security.
-- New accounts require a one-use invitation by default. Existing members and
-- the bootstrap administrator are unaffected.

insert into public.site_settings (key, value, is_public) values
  ('signup_mode', '"invite_only"', true),
  ('referral_invite_expiry_days', '7', false),
  ('referral_invite_max_active', '3', false),
  ('referral_invite_email_binding', 'true', false),
  ('login_session_policy', '"multi"', true),
  ('new_device_email_alert', 'true', true),
  ('suspicious_login_email_alert', 'true', true),
  ('failed_login_threshold', '5', false),
  ('security_log_retention_days', '90', false)
on conflict (key) do nothing;

create table public.referral_invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  bound_email_hash text,
  status text not null default 'active'
    check (status in ('active', 'reserved', 'used', 'expired', 'revoked')),
  expires_at timestamptz not null,
  reserved_at timestamptz,
  reserved_by_user_id uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  used_by_profile_id uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint referral_invitation_expiry_after_create check (expires_at > created_at),
  constraint referral_invitation_used_fields check (
    status <> 'used' or (used_at is not null and used_by_profile_id is not null)
  )
);
alter table public.referral_invitations enable row level security;
create index referral_invitations_inviter_idx
  on public.referral_invitations (inviter_id, created_at desc);
create index referral_invitations_status_expiry_idx
  on public.referral_invitations (status, expires_at);
create unique index referral_invitations_used_profile_idx
  on public.referral_invitations (used_by_profile_id)
  where used_by_profile_id is not null;

create policy "referral invitations owner read" on public.referral_invitations
  for select to authenticated
  using (inviter_id = (select auth.uid()) or (select public.is_admin()));

grant select on public.referral_invitations to authenticated;

create table public.signup_email_checks (
  id bigint generated always as identity primary key,
  email_hash text not null,
  invite_hash text,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.signup_email_checks enable row level security;
create index signup_email_checks_ip_time_idx
  on public.signup_email_checks (ip_hash, created_at desc);

create table public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  device_hash text not null,
  label text not null,
  last_ip_hash text,
  last_ip_masked text,
  last_country text,
  current_session_id uuid,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (profile_id, device_hash)
);
alter table public.trusted_devices enable row level security;
create index trusted_devices_profile_seen_idx
  on public.trusted_devices (profile_id, last_seen_at desc);

create policy "trusted devices own read" on public.trusted_devices
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy "trusted devices own insert" on public.trusted_devices
  for insert to authenticated
  with check (profile_id = (select auth.uid()));
create policy "trusted devices own update" on public.trusted_devices
  for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
create policy "trusted devices own delete" on public.trusted_devices
  for delete to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

grant select, insert, update, delete on public.trusted_devices to authenticated;

alter table public.login_events
  add column if not exists session_id uuid,
  add column if not exists device_hash text,
  add column if not exists device_label text,
  add column if not exists ip_hash text,
  add column if not exists ip_masked text,
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists risk_level text not null default 'normal'
    check (risk_level in ('normal', 'notice', 'high')),
  add column if not exists is_new_device boolean not null default false;

drop policy if exists "login events self read" on public.login_events;
create policy "login events self read" on public.login_events
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));
grant select, insert on public.login_events to authenticated;

create table public.login_failure_events (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles(id) on delete cascade,
  email_hash text not null,
  ip_hash text not null,
  ip_masked text,
  user_agent text,
  country text,
  created_at timestamptz not null default now()
);
alter table public.login_failure_events enable row level security;
create index login_failure_events_profile_time_idx
  on public.login_failure_events (profile_id, created_at desc)
  where profile_id is not null;
create index login_failure_events_ip_time_idx
  on public.login_failure_events (ip_hash, created_at desc);
create policy "login failures admin read" on public.login_failure_events
  for select to authenticated using ((select public.is_admin()));
grant select on public.login_failure_events to authenticated;

create or replace function public.create_referral_invitation(
  p_token_hash text,
  p_bound_email_hash text default null
)
returns table (invitation_id uuid, expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  active_count integer;
  active_limit integer;
  expiry_days integer;
  effective_expires_at timestamptz;
  caller_profile public.profiles%rowtype;
begin
  if caller is null then raise exception 'authentication required'; end if;
  select * into caller_profile from public.profiles where id = caller for update;
  if caller_profile.id is null or caller_profile.status <> 'active' then
    raise exception 'active membership required';
  end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid token hash'; end if;
  select least(30, greatest(1, coalesce((value #>> '{}')::integer, 7)))
  into expiry_days from public.site_settings where key = 'referral_invite_expiry_days';
  effective_expires_at := now() + make_interval(days => expiry_days);

  select coalesce((value #>> '{}')::integer, 3) into active_limit
  from public.site_settings where key = 'referral_invite_max_active';
  if caller_profile.is_coordinator then
    active_limit := greatest(active_limit, 10);
  elsif exists (
    select 1 from public.member_badges mb
    join public.badge_types bt on bt.id = mb.badge_type_id
    where mb.profile_id = caller and bt.code = 'certified'
  ) then
    active_limit := greatest(active_limit, 5);
  end if;

  update public.referral_invitations
  set status = 'expired'
  where inviter_id = caller and status = 'active' and expires_at <= now();

  select count(*) into active_count
  from public.referral_invitations
  where inviter_id = caller
    and status in ('active', 'reserved')
    and expires_at > now();
  if active_count >= active_limit then raise exception 'active invitation limit reached'; end if;

  return query
  insert into public.referral_invitations as created (
    inviter_id, token_hash, bound_email_hash, expires_at
  ) values (caller, p_token_hash, nullif(p_bound_email_hash, ''), effective_expires_at)
  returning created.id, created.expires_at;
end;
$$;
revoke execute on function public.create_referral_invitation(text, text)
  from public, anon;
grant execute on function public.create_referral_invitation(text, text)
  to authenticated;

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
    and (inviter_id = auth.uid() or public.is_admin());
  if not found then raise exception 'invitation cannot be revoked'; end if;
end;
$$;
revoke execute on function public.revoke_referral_invitation(uuid) from public, anon;
grant execute on function public.revoke_referral_invitation(uuid) to authenticated;

create or replace function public.validate_referral_invitation(
  p_token text,
  p_email text default null
)
returns table (
  state text,
  inviter_uid bigint,
  invitation_expires_at timestamptz,
  email_bound boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  token_digest text;
  email_digest text;
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 256 then
    return query select 'invalid'::text, null::bigint, null::timestamptz, false;
    return;
  end if;
  token_digest := encode(extensions.digest(p_token, 'sha256'), 'hex');
  email_digest := case when nullif(trim(p_email), '') is null then null
    else encode(extensions.digest(lower(trim(p_email)), 'sha256'), 'hex') end;

  return query
  select
    case
      when i.status = 'active' and i.expires_at <= now() then 'expired'
      when i.status = 'active' and i.bound_email_hash is not null
        and email_digest is not null and i.bound_email_hash <> email_digest then 'email_mismatch'
      else i.status
    end,
    p.uid,
    i.expires_at,
    i.bound_email_hash is not null
  from public.referral_invitations i
  join public.profiles p on p.id = i.inviter_id and p.status = 'active'
  where i.token_hash = token_digest;

  if not found then
    return query select 'invalid'::text, null::bigint, null::timestamptz, false;
  end if;
end;
$$;
revoke execute on function public.validate_referral_invitation(text, text) from public;
grant execute on function public.validate_referral_invitation(text, text) to anon, authenticated;

create or replace function public.check_signup_email(
  p_email text,
  p_invite_token text default null,
  p_ip_hash text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := lower(trim(p_email));
  mode text;
  headers_json jsonb;
  source_ip text;
  source_hash text;
  token_digest text;
  recent_count integer;
  invite_state text;
begin
  if normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    return 'invalid';
  end if;
  select coalesce(value #>> '{}', 'open') into mode
  from public.site_settings where key = 'signup_mode';
  if mode = 'paused' then return 'paused'; end if;

  if mode = 'invite_only' then
    select v.state into invite_state
    from public.validate_referral_invitation(p_invite_token, normalized) v limit 1;
    if invite_state is distinct from 'active' then return 'invite_required'; end if;
  end if;

  begin
    headers_json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  exception when others then headers_json := '{}'::jsonb;
  end;
  source_ip := coalesce(split_part(headers_json ->> 'x-forwarded-for', ',', 1), 'unknown');
  source_hash := coalesce(nullif(p_ip_hash, ''), encode(extensions.digest(source_ip, 'sha256'), 'hex'));
  token_digest := case when nullif(p_invite_token, '') is null then null
    else encode(extensions.digest(p_invite_token, 'sha256'), 'hex') end;

  select count(*) into recent_count from public.signup_email_checks
  where ip_hash = source_hash and created_at > now() - interval '1 minute';
  if recent_count >= 8 then return 'rate_limited'; end if;

  insert into public.signup_email_checks (email_hash, invite_hash, ip_hash)
  values (
    encode(extensions.digest(normalized, 'sha256'), 'hex'),
    token_digest,
    source_hash
  );

  if exists (select 1 from auth.users where lower(email) = normalized) then
    return 'duplicate';
  end if;
  return 'available';
end;
$$;
revoke execute on function public.check_signup_email(text, text, text) from public;
grant execute on function public.check_signup_email(text, text, text) to anon, authenticated;

create or replace function public.hook_validate_signup(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  mode text;
  token text := event -> 'user' -> 'user_metadata' ->> 'invite_token';
  email text := lower(event -> 'user' ->> 'email');
  bootstrap text;
  invite_state text;
begin
  select coalesce(value #>> '{}', 'open') into mode
  from public.site_settings where key = 'signup_mode';
  select lower(value #>> '{}') into bootstrap
  from public.site_settings where key = 'bootstrap_admin_email';
  if email = bootstrap then return '{}'::jsonb; end if;

  if mode = 'paused' then
    return jsonb_build_object('error', jsonb_build_object(
      'http_code', 403, 'message', 'New account registration is temporarily paused.'
    ));
  end if;
  if mode = 'invite_only' then
    select v.state into invite_state
    from public.validate_referral_invitation(token, email) v limit 1;
    if invite_state is distinct from 'active' then
      return jsonb_build_object('error', jsonb_build_object(
        'http_code', 403, 'message', 'A valid invitation is required.'
      ));
    end if;
  end if;
  return '{}'::jsonb;
end;
$$;
grant execute on function public.hook_validate_signup(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_validate_signup(jsonb)
  from public, anon, authenticated;

-- Consume the invite in the auth.users trigger. This is the final boundary,
-- even when the optional Auth Hook has not yet been enabled in the dashboard.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bootstrap_email text;
  default_tier uuid;
  mode text;
  token text;
  token_digest text;
  email_digest text;
  invitation public.referral_invitations%rowtype;
  referrer_id uuid;
begin
  select value #>> '{}' into bootstrap_email
  from public.site_settings where key = 'bootstrap_admin_email';
  select coalesce(value #>> '{}', 'open') into mode
  from public.site_settings where key = 'signup_mode';
  select id into default_tier from public.member_tiers where code = 'general';

  if lower(new.email) <> lower(coalesce(bootstrap_email, '')) then
    if mode = 'paused' then raise exception 'registration paused'; end if;
    token := new.raw_user_meta_data ->> 'invite_token';
    if nullif(token, '') is not null then
      token_digest := encode(extensions.digest(token, 'sha256'), 'hex');
      email_digest := encode(extensions.digest(lower(new.email), 'sha256'), 'hex');
      select * into invitation
      from public.referral_invitations
      where token_hash = token_digest
      for update;
      if invitation.id is not null
        and invitation.status = 'active'
        and invitation.expires_at > now()
        and (invitation.bound_email_hash is null or invitation.bound_email_hash = email_digest)
      then
        referrer_id := invitation.inviter_id;
      elsif mode = 'invite_only' then
        raise exception 'valid invitation required';
      end if;
    elsif mode = 'invite_only' then
      raise exception 'valid invitation required';
    end if;
  end if;

  insert into public.profiles (id, display_name, tier_id, referred_by, is_admin)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
    default_tier,
    referrer_id,
    lower(new.email) = lower(coalesce(bootstrap_email, ''))
  );
  insert into public.profile_contacts (profile_id, email) values (new.id, new.email);

  if invitation.id is not null and referrer_id is not null then
    if new.email_confirmed_at is not null then
      update public.referral_invitations set
        status = 'used', used_at = now(), used_by_profile_id = new.id
      where id = invitation.id;
    else
      update public.referral_invitations set
        status = 'reserved', reserved_at = now(), reserved_by_user_id = new.id
      where id = invitation.id;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.finalize_referral_invitation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.referral_invitations
    set status = 'used', used_at = now(), used_by_profile_id = new.id
    where reserved_by_user_id = new.id and status = 'reserved';
  end if;
  return new;
end;
$$;
drop trigger if exists finalize_referral_invitation_on_confirmation on auth.users;
create trigger finalize_referral_invitation_on_confirmation
after update of email_confirmed_at on auth.users
for each row execute function public.finalize_referral_invitation();

create or replace function public.cleanup_signup_security()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  stale record;
  retention_days integer;
begin
  for stale in
    select i.id, i.reserved_by_user_id
    from public.referral_invitations i
    join auth.users u on u.id = i.reserved_by_user_id
    where i.status = 'reserved'
      and i.reserved_at < now() - interval '24 hours'
      and u.email_confirmed_at is null
  loop
    delete from auth.users where id = stale.reserved_by_user_id;
    update public.referral_invitations set
      status = case when expires_at > now() then 'active' else 'expired' end,
      reserved_at = null,
      reserved_by_user_id = null
    where id = stale.id;
  end loop;

  update public.referral_invitations
  set status = 'expired'
  where status = 'active' and expires_at <= now();

  select coalesce((value #>> '{}')::integer, 90) into retention_days
  from public.site_settings where key = 'security_log_retention_days';
  delete from public.signup_email_checks
  where created_at < now() - make_interval(days => retention_days);
  delete from public.login_failure_events
  where created_at < now() - make_interval(days => retention_days);
  delete from public.login_events
  where created_at < now() - make_interval(days => retention_days);
end;
$$;
revoke execute on function public.cleanup_signup_security() from public, anon, authenticated;

do $$
declare existing bigint;
begin
  select jobid into existing from cron.job
  where jobname = 'cleanup-signup-security' limit 1;
  if existing is not null then perform cron.unschedule(existing); end if;
  perform cron.schedule(
    'cleanup-signup-security',
    '17 * * * *',
    'select public.cleanup_signup_security()'
  );
end $$;

create or replace function public.record_login_failure(
  p_email text,
  p_ip_hash text,
  p_ip_masked text,
  p_user_agent text,
  p_country text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  member_id uuid;
  threshold integer;
  failures integer;
begin
  select u.id into member_id from auth.users u where lower(u.email) = lower(trim(p_email));
  insert into public.login_failure_events (
    profile_id, email_hash, ip_hash, ip_masked, user_agent, country
  ) values (
    member_id,
    encode(extensions.digest(lower(trim(p_email)), 'sha256'), 'hex'),
    p_ip_hash,
    p_ip_masked,
    left(p_user_agent, 200),
    left(p_country, 8)
  );
  if member_id is null then return false; end if;
  select coalesce((value #>> '{}')::integer, 5) into threshold
  from public.site_settings where key = 'failed_login_threshold';
  select count(*) into failures from public.login_failure_events
  where profile_id = member_id and created_at > now() - interval '15 minutes';
  return failures = threshold;
end;
$$;
revoke execute on function public.record_login_failure(text, text, text, text, text) from public;
grant execute on function public.record_login_failure(text, text, text, text, text) to anon, authenticated;

create or replace function public.revoke_member_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  delete from auth.sessions where id = p_session_id and user_id = auth.uid();
  delete from public.trusted_devices
  where profile_id = auth.uid() and current_session_id = p_session_id;
end;
$$;
revoke execute on function public.revoke_member_session(uuid) from public, anon;
grant execute on function public.revoke_member_session(uuid) to authenticated;
