-- Server-side pagination for the invitation "History" tab (joined / expired /
-- revoked), lifting the 40-row cap of get_my_referral_invitations. Owner-scoped
-- via auth.uid(); no token is returned (history links are dead). A window
-- count() gives the total so the client can render page controls in one call.
create or replace function public.get_my_referral_invitation_history(
  p_limit integer default 6,
  p_offset integer default 0
)
returns table (
  id uuid,
  label text,
  status text,
  expires_at timestamptz,
  created_at timestamptz,
  used_at timestamptz,
  used_uid integer,
  total_count bigint
)
language sql
security definer
set search_path = ''
as $$
  select
    ri.id,
    ri.label,
    ri.status,
    ri.expires_at,
    ri.created_at,
    ri.used_at,
    up.uid as used_uid,
    count(*) over() as total_count
  from public.referral_invitations ri
  left join public.profiles up on up.id = ri.used_by_profile_id
  where ri.inviter_id = auth.uid()
    and ri.status in ('used', 'expired', 'revoked')
  order by coalesce(ri.used_at, ri.revoked_at, ri.created_at) desc
  limit greatest(1, least(p_limit, 50))
  offset greatest(0, p_offset);
$$;

revoke execute on function public.get_my_referral_invitation_history(integer, integer)
  from public, anon;
grant execute on function public.get_my_referral_invitation_history(integer, integer)
  to authenticated;
