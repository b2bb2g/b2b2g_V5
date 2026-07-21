-- Promote the signup marketing opt-in from auth user metadata onto profiles so
-- it is directly usable for campaigns / targeting and can be toggled later.
alter table public.profiles
  add column if not exists marketing_consent boolean not null default false;
alter table public.profiles
  add column if not exists marketing_consent_at timestamptz;

-- Recreate handle_new_user exactly as-is, adding only: read
-- raw_user_meta_data.marketing_consent and write it (with a timestamp) onto the
-- new profile row.
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
      is_admin,
      marketing_consent,
      marketing_consent_at
    )
    values (
      new.id,
      candidate_uid,
      coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
      default_tier,
      referrer_id,
      lower(new.email) = lower(coalesce(bootstrap_email, '')),
      mkt_consent,
      case when mkt_consent then now() else null end
    )
    on conflict (uid) do nothing
    returning created.uid into inserted_uid;

    exit when inserted_uid is not null;
    if uid_attempts >= 32 then
      raise exception 'could not allocate a unique six-digit member UID';
    end if;
  end loop;

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

-- Backfill members who already opted in (recorded in auth metadata before this
-- column existed).
update public.profiles p
set marketing_consent = true,
    marketing_consent_at = coalesce(p.marketing_consent_at, u.created_at)
from auth.users u
where u.id = p.id
  and coalesce((u.raw_user_meta_data ->> 'marketing_consent')::boolean, false) = true
  and p.marketing_consent = false;
