-- Bugfix: coordinator_can_view_messages referenced a dropped column.
--
-- 20260721200000_profile_private_sensitive_split moved coordinator_msg_override
-- from public.profiles into public.profile_private, but this function still read
-- it from profiles. Postgres only errors when a function actually executes, and
-- OR short-circuits past the coordinator branch for participants/admins, so the
-- break stayed latent -- but any RLS evaluation that REACHED the coordinator
-- branch (a coordinator opening a referred member's inquiry, or any
-- non-participant/non-admin inquiry read) failed with
-- "column c.coordinator_msg_override does not exist".
--
-- Point the lookup at profile_private (keyed by profile_id). SECURITY DEFINER,
-- so it still reads the private row regardless of the caller's RLS.

create or replace function public.coordinator_can_view_messages(member_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select public.is_direct_referrer_coordinator(member_id)
    and coalesce(
      (select pp.coordinator_msg_override = 'allow'
         from public.profile_private pp
        where pp.profile_id = auth.uid()
          and pp.coordinator_msg_override is not null),
      coalesce((select (s.value)::boolean from public.site_settings s
        where s.key = 'coordinator_message_access_global'), false)
    );
$function$;
