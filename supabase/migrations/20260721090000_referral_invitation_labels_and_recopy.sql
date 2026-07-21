-- Referral invitations: recipient memo + re-copyable link, with owner-only
-- token access.
--
-- The dashboard needs to (a) label who each link is for, (b) let the inviter
-- re-open/re-copy an active link, and (c) show whether it was accepted. The raw
-- token is a bearer secret, and referral_invitations is readable by admins
-- (owner OR is_admin), so the token is kept in a SPLIT table with no direct
-- grant and surfaced only through a SECURITY DEFINER reader scoped to auth.uid().
-- Admins therefore cannot read other members' tokens.
--
-- Additive and backward-compatible: the old 2-arg create RPC and the direct
-- table read keep working during the deploy window; the new 4-arg overload and
-- reader are used by the updated app.

-- 1) Recipient memo on the main row (the inviter's private note; low sensitivity).
alter table public.referral_invitations
  add column if not exists label text;

-- 2) Split secret: the raw token, reachable only via SECURITY DEFINER functions.
create table if not exists public.referral_invitation_secrets (
  invitation_id uuid primary key
    references public.referral_invitations(id) on delete cascade,
  token text not null
);
alter table public.referral_invitation_secrets enable row level security;
-- No policies and no grant: neither anon nor authenticated can read it directly.
-- Only the definer functions below (running as the table owner) touch it.
revoke all on public.referral_invitation_secrets from public, anon, authenticated;

-- 3) New create overload: also stores the raw token + label. The old
-- create_referral_invitation(text, text) is intentionally left in place so a
-- not-yet-redeployed client keeps working; it can be dropped in a later cleanup.
create or replace function public.create_referral_invitation(
  p_token text,
  p_token_hash text,
  p_bound_email_hash text default null,
  p_label text default null
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
  new_id uuid;
  new_expires timestamptz;
begin
  if caller is null then raise exception 'authentication required'; end if;
  select * into caller_profile from public.profiles where id = caller for update;
  if caller_profile.id is null or caller_profile.status <> 'active' then
    raise exception 'active membership required';
  end if;
  if p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid token hash'; end if;
  if p_token is null or length(p_token) < 16 or p_token !~ '^[A-Za-z0-9_-]+$' then
    raise exception 'invalid token';
  end if;

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

  insert into public.referral_invitations as created (
    inviter_id, token_hash, bound_email_hash, label, expires_at
  ) values (
    caller, p_token_hash, nullif(p_bound_email_hash, ''),
    nullif(left(coalesce(p_label, ''), 80), ''), effective_expires_at
  )
  returning created.id, created.expires_at into new_id, new_expires;

  insert into public.referral_invitation_secrets (invitation_id, token)
  values (new_id, p_token);

  invitation_id := new_id;
  expires_at := new_expires;
  return next;
end;
$$;

revoke execute on function public.create_referral_invitation(text, text, text, text)
  from public, anon;
grant execute on function public.create_referral_invitation(text, text, text, text)
  to authenticated;

-- 4) Owner-scoped reader: the caller's own invitations with the raw token
-- (active/reserved only) and the accepted member's UID. Filtered strictly by
-- auth.uid(), so even an admin gets only their own rows and the token never
-- leaks across members.
create or replace function public.get_my_referral_invitations()
returns table (
  id uuid,
  label text,
  status text,
  token text,
  expires_at timestamptz,
  created_at timestamptz,
  used_at timestamptz,
  used_uid integer
)
language sql
security definer
set search_path = ''
as $$
  select
    ri.id,
    ri.label,
    ri.status,
    case when ri.status in ('active', 'reserved') then s.token else null end as token,
    ri.expires_at,
    ri.created_at,
    ri.used_at,
    up.uid as used_uid
  from public.referral_invitations ri
  left join public.referral_invitation_secrets s on s.invitation_id = ri.id
  left join public.profiles up on up.id = ri.used_by_profile_id
  where ri.inviter_id = auth.uid()
  order by
    case ri.status
      when 'active' then 0 when 'reserved' then 1 when 'used' then 2 else 3
    end,
    ri.created_at desc
  limit 40;
$$;

revoke execute on function public.get_my_referral_invitations() from public, anon;
grant execute on function public.get_my_referral_invitations() to authenticated;
