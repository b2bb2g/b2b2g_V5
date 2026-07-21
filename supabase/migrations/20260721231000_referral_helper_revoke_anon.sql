-- 20260721230000 revoked EXECUTE from PUBLIC, but Supabase's default privileges
-- grant EXECUTE on new public functions to `anon` EXPLICITLY (pg_proc.proacl
-- shows `anon=X`), so the PUBLIC revoke was a no-op for anon and a logged-out
-- caller could still reach the referral helpers. Revoke from anon directly.
-- (authenticated keeps EXECUTE -- the real callers; service_role is server-side.)
revoke execute on function public.get_profile_full(uuid) from anon;
revoke execute on function public.get_my_referred_members() from anon;
revoke execute on function public.admin_referral_graph() from anon;
revoke execute on function public.is_coordinator_pair(uuid, uuid) from anon;
