-- Fix referral invitation columns that collide with RETURNS TABLE output
-- names. Without the aliases, Postgres treats `expires_at` as ambiguous and
-- every invitation creation fails before the insert is reached.
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

  update public.referral_invitations as invitation
  set status = 'expired'
  where invitation.inviter_id = caller
    and invitation.status = 'active'
    and invitation.expires_at <= now();

  select count(*) into active_count
  from public.referral_invitations as invitation
  where invitation.inviter_id = caller
    and invitation.status in ('active', 'reserved')
    and invitation.expires_at > now();
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
