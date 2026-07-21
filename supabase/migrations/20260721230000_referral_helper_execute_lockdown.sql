-- QA follow-up to the referred_by lockdown (20260721220000). Postgres grants
-- EXECUTE on newly-created functions to PUBLIC by default, so `anon` (and every
-- role) could still call the referral helpers even though the migration only
-- granted them to `authenticated`.
--
-- get_profile_full / get_my_referred_members / admin_referral_graph return
-- nothing without a matching auth.uid(), so the practical leak there is nil, but
-- is_coordinator_pair answered a yes/no referral-edge probe for ANY two profile
-- ids -- and profiles.id is anon-readable through the public author joins -- which
-- lets a logged-out visitor reconstruct the referral graph pairwise, re-opening
-- exactly what the lockdown closed. Restrict all four helpers to authenticated,
-- and additionally scope is_coordinator_pair to the calling user.

-- Only answer the referral-pair question when the caller is one of the pair. The
-- "coord messages insert" policy already requires auth.uid() to be the
-- coordinator or the member before calling this, so policy behaviour is
-- unchanged; this only stops a member from probing pairs they are not part of.
create or replace function public.is_coordinator_pair(p_coordinator uuid, p_member uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) in (p_coordinator, p_member)
    and exists (
      select 1 from public.profiles m
      where m.id = p_member and m.referred_by = p_coordinator
    )
    and exists (
      select 1 from public.profiles c
      where c.id = p_coordinator and c.is_coordinator
    );
$$;

-- Drop the implicit PUBLIC (hence anon) EXECUTE and keep only the real callers.
revoke execute on function public.get_profile_full(uuid) from public;
revoke execute on function public.get_my_referred_members() from public;
revoke execute on function public.admin_referral_graph() from public;
revoke execute on function public.is_coordinator_pair(uuid, uuid) from public;

grant execute on function public.get_profile_full(uuid) to authenticated;
grant execute on function public.get_my_referred_members() to authenticated;
grant execute on function public.admin_referral_graph() to authenticated;
grant execute on function public.is_coordinator_pair(uuid, uuid) to authenticated;
