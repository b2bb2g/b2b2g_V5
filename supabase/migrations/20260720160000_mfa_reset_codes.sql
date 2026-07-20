-- Self-service authenticator recovery: a short-lived email code lets a
-- password-authenticated member remove their lost TOTP factor and enroll a
-- new device. Codes are stored hashed; RLS is enabled with no member
-- policies, so only the service role ever touches this table.
create table if not exists public.mfa_reset_codes (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.mfa_reset_codes enable row level security;
