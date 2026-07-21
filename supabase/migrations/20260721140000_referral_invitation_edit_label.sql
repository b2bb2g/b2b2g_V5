-- Let the inviter rename an active/reserved invitation's recipient memo from
-- the dashboard. Owner-scoped via auth.uid(); used/expired/revoked invites are
-- immutable. The label stays on referral_invitations (a private note, not a
-- secret), and this definer function is the only write path for members.
create or replace function public.set_referral_invitation_label(
  p_invitation_id uuid,
  p_label text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.referral_invitations
  set label = nullif(left(coalesce(p_label, ''), 80), '')
  where id = p_invitation_id
    and inviter_id = auth.uid()
    and status in ('active', 'reserved');
end;
$$;

revoke execute on function public.set_referral_invitation_label(uuid, text)
  from public, anon;
grant execute on function public.set_referral_invitation_label(uuid, text)
  to authenticated;
