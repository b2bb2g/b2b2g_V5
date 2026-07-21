-- Fix: invite links created after the short-link change (16-byte token = 22
-- chars) were rejected as 'invalid' because validate_referral_invitation still
-- required length >= 32 (sized for the old 32-byte token). The floor is only a
-- sanity guard — security is the 128-bit token-hash match — so lower it to 16.
-- Older 43-char tokens still pass. Only the length check changes.
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
  if p_token is null or length(p_token) < 16 or length(p_token) > 256 then
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
