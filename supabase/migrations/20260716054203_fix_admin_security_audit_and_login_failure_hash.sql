-- Correct the admin device-revocation audit payload and keep application-level
-- login IP hashes distinct from the request-source hash used for RPC throttling.

alter table public.login_failure_events
  add column request_source_hash text;

create index login_failure_events_request_source_time_idx
  on public.login_failure_events (request_source_hash, created_at desc);

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
  headers_json jsonb;
  source_ip text;
  request_hash text;
  event_hash text;
  source_recent integer;
begin
  begin
    headers_json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  exception when others then
    headers_json := '{}'::jsonb;
  end;

  source_ip := coalesce(
    nullif(trim(split_part(headers_json ->> 'x-forwarded-for', ',', 1)), ''),
    nullif(trim(headers_json ->> 'x-real-ip'), ''),
    'unknown'
  );
  request_hash := encode(extensions.digest(source_ip, 'sha256'), 'hex');
  event_hash := case
    when lower(coalesce(p_ip_hash, '')) ~ '^[0-9a-f]{64}$' then lower(p_ip_hash)
    else request_hash
  end;

  select count(*) into source_recent
  from public.login_failure_events
  where request_source_hash = request_hash
    and created_at > now() - interval '1 minute';
  if source_recent >= 100 then return false; end if;

  select u.id into member_id
  from auth.users u
  where lower(u.email) = lower(trim(p_email));

  insert into public.login_failure_events (
    profile_id,
    email_hash,
    ip_hash,
    request_source_hash,
    ip_masked,
    user_agent,
    country
  ) values (
    member_id,
    encode(extensions.digest(lower(trim(p_email)), 'sha256'), 'hex'),
    event_hash,
    request_hash,
    left(p_ip_masked, 80),
    left(p_user_agent, 200),
    left(p_country, 8)
  );

  if member_id is null then return false; end if;

  select coalesce((value #>> '{}')::integer, 5) into threshold
  from public.site_settings where key = 'failed_login_threshold';

  select count(*) into failures
  from public.login_failure_events
  where profile_id = member_id
    and created_at > now() - interval '15 minutes';

  return failures = threshold;
end;
$$;

revoke execute on function public.record_login_failure(text, text, text, text, text)
  from public, authenticated;
grant execute on function public.record_login_failure(text, text, text, text, text)
  to anon;

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

  select * into target
  from public.trusted_devices
  where id = p_device_id;
  if target.id is null then return; end if;

  if target.current_session_id is not null then
    delete from auth.sessions
    where id = target.current_session_id
      and user_id = target.profile_id;
  end if;

  delete from public.trusted_devices where id = p_device_id;

  insert into public.audit_logs (actor_id, action, target_type, target_id, detail)
  values (
    (select auth.uid()),
    'member_device_revoked',
    'trusted_device',
    p_device_id::text,
    jsonb_build_object('profile_id', target.profile_id, 'label', target.label)
  );
end;
$$;

revoke execute on function public.admin_revoke_member_device(uuid)
  from public, anon;
grant execute on function public.admin_revoke_member_device(uuid)
  to authenticated;
