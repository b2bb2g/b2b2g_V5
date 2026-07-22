-- Bugfix: two more functions still referenced columns that
-- 20260721200000_profile_private_sensitive_split moved off public.profiles
-- (suspend_reason, coordinator_msg_override). Unlike the OR-short-circuited
-- coordinator function, these fire on the common path:
--
--  * guard_profile_columns is a BEFORE UPDATE trigger on profiles; for any
--    non-members-admin caller it ran `new.coordinator_msg_override := ...` /
--    `new.suspend_reason := ...` and errored "record new has no field ...", so
--    EVERY member profile edit failed since 2026-07-21.
--  * withdraw_member's UPDATE set `suspend_reason = null`, a dropped column, so
--    the statement failed to compile for every caller (member self-withdrawal
--    and admin-processed withdrawal alike).
--
-- Drop the stale references. The moved columns now live in profile_private and
-- are governed there (marketing/consent + coordinator preference); withdrawal
-- already anonymizes the profile and clears profile_contacts.

create or replace function public.guard_profile_columns()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.is_platform_owner() then
    new.is_admin := old.is_admin;
    new.uid := old.uid;
    if not public.has_admin_permission('members') then
      new.is_coordinator := old.is_coordinator;
      -- A member may withdraw their OWN account (status -> withdrawn); every
      -- other status change is locked. RLS already limits the update to own row.
      if not (new.status = 'withdrawn' and old.id = (select auth.uid())) then
        new.status := old.status;
      end if;
      new.referred_by := old.referred_by;
    end if;
    if not public.has_admin_permission('subscriptions') then
      new.tier_id := old.tier_id;
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.withdraw_member(target uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is distinct from target and not public.has_admin_permission('members') then
    raise exception 'Member permission is required';
  end if;

  update public.profiles
  set display_name = 'Withdrawn member', company_name = null, bio = null,
      avatar_url = null, status = 'withdrawn', is_coordinator = false
  where id = target;
  update public.profile_contacts
  set email = null, phone = null, contact_person = null
  where profile_id = target;
  update public.profile_private
  set suspend_reason = null, coordinator_msg_override = null
  where profile_id = target;
  delete from public.mini_homepages where profile_id = target;
  insert into public.audit_logs (actor_id, action, target_type, target_id, detail)
  values (auth.uid(), 'member_withdraw', 'profile', target::text, '{}'::jsonb);
end;
$function$;
