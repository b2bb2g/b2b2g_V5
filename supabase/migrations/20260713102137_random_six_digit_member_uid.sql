-- Public member UIDs are identifiers, not membership counters. New profiles
-- receive a uniformly sampled six-digit value while the existing unique
-- constraint remains the final concurrency boundary.
create or replace function public.generate_member_uid()
returns bigint
language plpgsql
volatile
set search_path = ''
as $$
declare
  entropy bytea;
  sample bigint;
begin
  -- Rejection sampling avoids modulo bias when mapping an unsigned 32-bit
  -- sample into the 900,000 available six-digit values.
  loop
    entropy := extensions.gen_random_bytes(4);
    sample :=
      pg_catalog.get_byte(entropy, 0)::bigint * 16777216
      + pg_catalog.get_byte(entropy, 1)::bigint * 65536
      + pg_catalog.get_byte(entropy, 2)::bigint * 256
      + pg_catalog.get_byte(entropy, 3)::bigint;
    exit when sample < 4294800000;
  end loop;

  return 100000 + (sample % 900000);
end;
$$;

revoke execute on function public.generate_member_uid()
  from public, anon, authenticated;

alter table public.profiles
  alter column uid set default public.generate_member_uid();

alter table public.profiles
  add constraint profiles_uid_six_digits
  check (uid between 100000 and 999999)
  not valid;

alter table public.profiles
  validate constraint profiles_uid_six_digits;

-- The auth trigger retries the profile insert if two concurrent signups draw
-- the same UID. Other unique violations still fail instead of being hidden.
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
begin
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
