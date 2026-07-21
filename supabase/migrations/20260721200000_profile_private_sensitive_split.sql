-- Close the member-to-member sensitive-column leak on public.profiles.
--
-- The profiles SELECT policy is `using(true)` (rows world-readable for public
-- author joins) and the `authenticated` role held a full-column grant, so any
-- logged-in member could `select *` on any other member and read internal /
-- preference columns. Postgres RLS is row-level, and column grants are
-- role-level (admins are also `authenticated`), so the only way to make a column
-- "owner or admin only" is to move it to a table with an owner/admin RLS policy.
--
-- This split moves the internal-moderation and preference columns. last_seen_at
-- and referred_by are threaded through the login flow / session loader / signup
-- trigger and are deferred to a focused follow-up.

create table public.profile_private (
  profile_id uuid primary key
    references public.profiles(id) on delete cascade,
  suspend_reason text,
  coordinator_msg_override text
    check (coordinator_msg_override in ('allow', 'deny')),
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  push_muted_types text[] not null default '{}'
);
alter table public.profile_private enable row level security;

-- Owner or admin only. Members cannot read another member's row.
create policy "profile_private owner or admin read" on public.profile_private
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy "profile_private owner or admin update" on public.profile_private
  for update to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()))
  with check (profile_id = (select auth.uid()) or (select public.is_admin()));

-- No INSERT policy for authenticated: rows are created by the SECURITY DEFINER
-- signup trigger (and the backfill below).
grant select, update on public.profile_private to authenticated;

-- Backfill from the existing profiles rows.
insert into public.profile_private (
  profile_id, suspend_reason, coordinator_msg_override,
  marketing_consent, marketing_consent_at, push_muted_types
)
select
  id, suspend_reason, coordinator_msg_override,
  coalesce(marketing_consent, false), marketing_consent_at,
  coalesce(push_muted_types, '{}')
from public.profiles
on conflict (profile_id) do nothing;

-- Append-only marketing-consent audit log (for 정보통신망법 evidence).
create table public.marketing_consent_events (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('opt_in', 'opt_out')),
  source text not null check (source in ('signup', 'settings')),
  created_at timestamptz not null default now()
);
alter table public.marketing_consent_events enable row level security;
create index marketing_consent_events_profile_idx
  on public.marketing_consent_events (profile_id, created_at desc);
create policy "marketing consent events owner or admin read"
  on public.marketing_consent_events
  for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));
grant select on public.marketing_consent_events to authenticated;
-- Rows are written only by SECURITY DEFINER functions (signup trigger + the
-- consent RPC), so no insert grant/policy for authenticated.

-- Recreate handle_new_user: profile insert no longer carries marketing_consent;
-- instead it seeds the profile_private row and the initial consent event.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  bootstrap_email text;
  default_tier uuid;
  mode text;
  token text;
  token_digest text;
  email_digest text;
  invitation public.referral_invitations%rowtype;
  referrer_id uuid;
  candidate_uid bigint;
  inserted_uid bigint;
  uid_attempts integer := 0;
  mkt_consent boolean;
begin
  mkt_consent := coalesce(
    (new.raw_user_meta_data ->> 'marketing_consent')::boolean, false);

  select value #>> '{}' into bootstrap_email
  from public.site_settings where key = 'bootstrap_admin_email';
  select coalesce(value #>> '{}', 'open') into mode
  from public.site_settings where key = 'signup_mode';
  select id into default_tier from public.member_tiers where code = 'general';

  if lower(new.email) <> lower(coalesce(bootstrap_email, '')) then
    if mode = 'paused' then raise exception 'registration paused'; end if;
    token := new.raw_user_meta_data ->> 'invite_token';
    if nullif(token, '') is not null then
      token_digest := encode(extensions.digest(token, 'sha256'), 'hex');
      email_digest := encode(extensions.digest(lower(new.email), 'sha256'), 'hex');
      select * into invitation
      from public.referral_invitations
      where token_hash = token_digest
      for update;
      if invitation.id is not null
        and invitation.status = 'active'
        and invitation.expires_at > now()
        and (invitation.bound_email_hash is null or invitation.bound_email_hash = email_digest)
      then
        referrer_id := invitation.inviter_id;
      elsif mode = 'invite_only' then
        raise exception 'valid invitation required';
      end if;
    elsif mode = 'invite_only' then
      raise exception 'valid invitation required';
    end if;
  end if;

  loop
    uid_attempts := uid_attempts + 1;
    candidate_uid := public.generate_member_uid();
    inserted_uid := null;

    insert into public.profiles as created (
      id,
      uid,
      display_name,
      tier_id,
      referred_by,
      is_admin
    )
    values (
      new.id,
      candidate_uid,
      coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
      default_tier,
      referrer_id,
      lower(new.email) = lower(coalesce(bootstrap_email, ''))
    )
    on conflict (uid) do nothing
    returning created.uid into inserted_uid;

    exit when inserted_uid is not null;
    if uid_attempts >= 32 then
      raise exception 'could not allocate a unique six-digit member UID';
    end if;
  end loop;

  insert into public.profile_private (profile_id, marketing_consent, marketing_consent_at)
  values (new.id, mkt_consent, case when mkt_consent then now() else null end);
  if mkt_consent then
    insert into public.marketing_consent_events (profile_id, action, source)
    values (new.id, 'opt_in', 'signup');
  end if;

  insert into public.profile_contacts (profile_id, email)
  values (new.id, new.email);

  if invitation.id is not null and referrer_id is not null then
    if new.email_confirmed_at is not null then
      update public.referral_invitations set
        status = 'used', used_at = now(), used_by_profile_id = new.id
      where id = invitation.id;
    else
      update public.referral_invitations set
        status = 'reserved', reserved_at = now(), reserved_by_user_id = new.id
      where id = invitation.id;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.handle_new_user()
  from public, anon, authenticated;

-- Owner-scoped marketing-consent setter that also appends an audit event.
create or replace function public.set_marketing_consent(p_consent boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then raise exception 'authentication required'; end if;
  update public.profile_private
  set marketing_consent = coalesce(p_consent, false),
      marketing_consent_at = case when coalesce(p_consent, false) then now() else null end
  where profile_id = caller;
  insert into public.marketing_consent_events (profile_id, action, source)
  values (caller, case when coalesce(p_consent, false) then 'opt_in' else 'opt_out' end, 'settings');
end;
$$;
revoke execute on function public.set_marketing_consent(boolean) from public, anon;
grant execute on function public.set_marketing_consent(boolean) to authenticated;

-- Finally drop the moved columns from profiles.
alter table public.profiles
  drop column suspend_reason,
  drop column coordinator_msg_override,
  drop column marketing_consent,
  drop column marketing_consent_at,
  drop column push_muted_types;
