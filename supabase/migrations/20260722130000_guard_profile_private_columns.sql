-- profile_private's "owner or admin update" policy let a MEMBER write columns
-- that are admin/coordinator-controlled, not member preferences:
--   * suspend_reason           -- an admin moderation note
--   * coordinator_msg_override -- whether the member's coordinator may read their
--                                 messages (an admin/platform policy switch)
-- A member should only edit their own preferences (marketing_consent,
-- marketing_consent_at, push_muted_types). RLS is row-level and cannot restrict
-- columns, so add a BEFORE UPDATE guard (mirroring guard_profile_columns on
-- profiles) that reverts the controlled columns for any non-members-admin writer.
-- Admins (members permission) / platform owner and the SECURITY DEFINER signup
-- INSERT are unaffected; set_marketing_consent / push-preference updates by a
-- member still persist (they don't touch the guarded columns).

create or replace function public.guard_profile_private_columns()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not (public.has_admin_permission('members') or public.is_platform_owner()) then
    new.suspend_reason := old.suspend_reason;
    new.coordinator_msg_override := old.coordinator_msg_override;
  end if;
  return new;
end;
$function$;

drop trigger if exists profile_private_guard on public.profile_private;
create trigger profile_private_guard
  before update on public.profile_private
  for each row execute function public.guard_profile_private_columns();
