-- Add a server-computed "days until expiry" to the owner reader so the
-- dashboard can show a relative "expires in N days" without a client clock
-- (which would trip react purity rules / risk hydration drift).
-- Return type changes, so the old function must be dropped first.
drop function if exists public.get_my_referral_invitations();
create or replace function public.get_my_referral_invitations()
returns table (
  id uuid,
  label text,
  status text,
  token text,
  expires_at timestamptz,
  expires_in_days integer,
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
    ceil(extract(epoch from (ri.expires_at - now())) / 86400)::int as expires_in_days,
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
