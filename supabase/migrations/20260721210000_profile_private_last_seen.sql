-- Move last_seen_at (presence) into the owner/admin-only profile_private table,
-- closing the member-to-member presence leak (any member could see when another
-- member was last online). No RLS policy or function references
-- profiles.last_seen_at, so this is a clean move.
alter table public.profile_private add column last_seen_at timestamptz;

update public.profile_private pp
set last_seen_at = p.last_seen_at
from public.profiles p
where p.id = pp.profile_id;

alter table public.profiles drop column last_seen_at;
