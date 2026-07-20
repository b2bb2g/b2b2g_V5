-- Close the unauthenticated leak of sensitive `profiles` columns.
--
-- The table's SELECT policy is `using (true)` -- rows are world-readable, which
-- the FK-embedded author joins on public pages (post authors, feed authors,
-- homepage owners) rely on. Postgres RLS is row-level, so it cannot hide
-- individual columns; column exposure is controlled with GRANTs instead.
--
-- Before this change the `anon` role (the public publishable key shipped in the
-- browser bundle, used by every unauthenticated visitor) could `select *` and
-- read is_coordinator, suspend_reason (internal moderation notes), referred_by
-- (the entire referral graph), status and coordinator_msg_override for every
-- member. We revoke anon's table-wide SELECT and grant back only the columns
-- public pages and author joins actually need.
--
-- `is_admin` stays granted: it is rendered as a public "official account"
-- author badge on post pages, so it is already public UX.
--
-- The `authenticated` role is intentionally left untouched -- admin pages, the
-- coordinator dashboard and member-to-member reads all run as `authenticated`
-- under RLS and continue to need the full column set. (Further restricting
-- those cross-member sensitive reads for non-admin members requires splitting
-- the sensitive columns into a separate table; tracked as a follow-up.)

revoke select on public.profiles from anon;

grant select (
  id,
  uid,
  display_name,
  company_name,
  bio,
  bio_en,
  bio_ko,
  avatar_url,
  is_admin,
  created_at,
  updated_at
) on public.profiles to anon;
