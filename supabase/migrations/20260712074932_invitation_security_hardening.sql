-- Tighten the externally callable signup helpers after advisor review.
-- The email check remains intentionally anonymous for pre-signup UX, but its
-- rate key now always comes from trusted request headers rather than input.

drop function if exists public.check_signup_email(text, text, text);

create or replace function public.check_signup_email(
  p_email text,
  p_invite_token text default null
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
  source_hash := encode(extensions.digest(source_ip, 'sha256'), 'hex');
  token_digest := case when nullif(p_invite_token, '') is null then null
    else encode(extensions.digest(p_invite_token, 'sha256'), 'hex') end;

  select count(*) into recent_count from public.signup_email_checks
  where ip_hash = source_hash and created_at > now() - interval '1 minute';
  if recent_count >= 60 then return 'rate_limited'; end if;

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
revoke execute on function public.check_signup_email(text, text) from public;
grant execute on function public.check_signup_email(text, text) to anon, authenticated;

-- Trigger-only functions must not be exposed as RPCs.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.finalize_referral_invitation() from public, anon, authenticated;

-- An explicit deny policy documents that this log is RPC-only and removes the
-- ambiguous "RLS without policy" advisor finding.
create policy "signup email checks no direct access" on public.signup_email_checks
  for all to public using (false) with check (false);

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
  source_hash text;
  source_recent integer;
begin
  begin
    headers_json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  exception when others then headers_json := '{}'::jsonb;
  end;
  source_ip := coalesce(split_part(headers_json ->> 'x-forwarded-for', ',', 1), 'unknown');
  source_hash := encode(extensions.digest(source_ip, 'sha256'), 'hex');
  select count(*) into source_recent from public.login_failure_events
  where ip_hash = source_hash and created_at > now() - interval '1 minute';
  if source_recent >= 100 then return false; end if;

  select u.id into member_id from auth.users u where lower(u.email) = lower(trim(p_email));
  insert into public.login_failure_events (
    profile_id, email_hash, ip_hash, ip_masked, user_agent, country
  ) values (
    member_id,
    encode(extensions.digest(lower(trim(p_email)), 'sha256'), 'hex'),
    source_hash,
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
