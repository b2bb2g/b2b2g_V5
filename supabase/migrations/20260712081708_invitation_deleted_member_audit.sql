-- A used invitation keeps its audit timestamp even when the joined profile is
-- later physically removed (for example, an isolated E2E test account).
alter table public.referral_invitations
  drop constraint if exists referral_invitation_used_fields;
alter table public.referral_invitations
  add constraint referral_invitation_used_fields check (
    status <> 'used' or used_at is not null
  );
