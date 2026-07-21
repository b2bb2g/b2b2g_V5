-- referred_by is a referral-graph edge. Until now any authenticated member could
-- read every other member's referrer straight off public.profiles (verified: a
-- non-admin member could select another member's referred_by). Close that leak.
--
-- referred_by is an AUTHORIZATION column, not just data — coordinator-access RLS
-- and SECURITY DEFINER functions read it — so moving it to another table would
-- mean rewriting those checks (high risk). The lower-risk path taken here: keep
-- the column in place and gate its exposure with column-level GRANTs (the same
-- shape the 2026-07-20 anon lockdown used), then route the few legitimate direct
-- reads (owner session, coordinator, admin) through SECURITY DEFINER RPCs.
--
-- Deploy note: this is a breaking grant change for the live app — the code that
-- switches session.ts / coordinator / admin pages onto the new RPCs ships in the
-- same release and must be deployed together.

-- 1. Restrict column exposure: drop authenticated's table-wide SELECT and grant
--    every column EXCEPT referred_by. (anon was already narrowed in
--    20260720233000 and never had referred_by, so only authenticated changes.)
revoke select on public.profiles from authenticated;
grant select (
  id, uid, display_name, company_name, bio, avatar_url, status, tier_id,
  is_admin, is_coordinator, created_at, updated_at, bio_en, bio_ko
) on public.profiles to authenticated;

-- 2. member_dashboard_summary() counts the caller's referrals via
--    profiles.referred_by and runs security invoker, so it would now fail with
--    "permission denied". Every subquery in it is scoped to auth.uid() (it only
--    ever counts the caller's own rows), so running it as definer is safe and
--    restores the referred_by read without leaking anything.
alter function public.member_dashboard_summary() security definer;

-- 3. The "coord messages insert" policy's WITH CHECK inlines a subquery on
--    profiles.referred_by, which also needs column access at evaluation time.
--    Move that read into a SECURITY DEFINER helper so the policy no longer
--    touches the column directly. Semantics are unchanged: the member must be
--    referred by the coordinator, and the coordinator must hold the role.
create or replace function public.is_coordinator_pair(p_coordinator uuid, p_member uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles m
    where m.id = p_member and m.referred_by = p_coordinator
  ) and exists (
    select 1 from public.profiles c
    where c.id = p_coordinator and c.is_coordinator
  );
$$;
grant execute on function public.is_coordinator_pair(uuid, uuid) to authenticated;

alter policy "coord messages insert" on public.coordinator_messages
  with check (
    sender_id = (select auth.uid())
    and (select auth.uid()) in (coordinator_id, member_id)
    and public.is_coordinator_pair(coordinator_id, member_id)
  );

-- 4. Owner/coordinator/admin still need to read a full profile row (incl.
--    referred_by). One definer RPC, scoped to: the row's owner, a members-admin,
--    or the caller who referred the target. Used by the session loader (self),
--    the admin member detail (admin), and the coordinator member detail (referrer).
create or replace function public.get_profile_full(p_id uuid)
returns setof public.profiles
language sql
stable
security definer
set search_path = ''
as $$
  select p.*
  from public.profiles p
  where p.id = p_id
    and (
      p_id = (select auth.uid())
      or public.is_admin()
      or (select public.has_admin_permission('members'))
      or p.referred_by = (select auth.uid())
    );
$$;
grant execute on function public.get_profile_full(uuid) to authenticated;

-- 5. Coordinator home lists direct referrals (name + sanctioned email). The
--    client used .eq("referred_by", uid), which now lacks column access. Serve it
--    from a definer RPC scoped to the caller's own referrals.
create or replace function public.get_my_referred_members()
returns table (
  id uuid,
  uid bigint,
  display_name text,
  company_name text,
  created_at timestamptz,
  email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.uid, p.display_name, p.company_name, p.created_at, pc.email
  from public.profiles p
  left join public.profile_contacts pc on pc.profile_id = p.id
  where p.referred_by = (select auth.uid())
  order by p.created_at desc;
$$;
grant execute on function public.get_my_referred_members() to authenticated;

-- 6. Admin referral tree needs every member's referral edge. Admin-only definer
--    RPC (members permission or full admin); returns nothing to everyone else.
create or replace function public.admin_referral_graph()
returns table (
  id uuid,
  uid bigint,
  display_name text,
  company_name text,
  is_coordinator boolean,
  referred_by uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.uid, p.display_name, p.company_name, p.is_coordinator, p.referred_by
  from public.profiles p
  where public.is_admin() or (select public.has_admin_permission('members'))
  order by p.created_at;
$$;
grant execute on function public.admin_referral_graph() to authenticated;
