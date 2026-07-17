-- Grant platform admin to seoulpmt@gmail.com (uid 376365).
--
-- The profiles_guard BEFORE UPDATE trigger keeps is_admin owner-only: any UPDATE
-- run outside an existing admin's auth context (which includes migrations, run as
-- the postgres role with no auth.uid()) has its is_admin reverted. This grant is a
-- one-time, owner-authorized promotion, so we disable the guard for the single
-- UPDATE and immediately restore it. Idempotent: re-running is harmless.
alter table public.profiles disable trigger profiles_guard;

update public.profiles
   set is_admin = true,
       updated_at = now()
 where id = (select id from auth.users where email = 'seoulpmt@gmail.com');

alter table public.profiles enable trigger profiles_guard;
