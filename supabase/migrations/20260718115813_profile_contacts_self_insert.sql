-- Profile saves call update_member_profile() (security invoker), which
-- upserts profile_contacts via INSERT ... ON CONFLICT DO UPDATE. Postgres
-- checks INSERT policies for upserts even when the row already exists, and
-- profile_contacts only ever had SELECT/UPDATE policies -- so every member
-- profile save has failed RLS since the RPC was introduced. Add the missing
-- self-insert policy, mirroring the update policy's admin parity.
drop policy if exists "contacts self insert" on public.profile_contacts;
create policy "contacts self insert" on public.profile_contacts
  for insert
  with check (
    (profile_id = (select auth.uid()))
    or (select public.has_admin_permission('members'))
  );
