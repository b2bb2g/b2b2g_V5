-- Member withdrawal with anonymization (PRD 17.2), trigram search indexes,
-- and realtime notifications for the header badge.

-- ---------------------------------------------------------------
-- Withdrawal: posts/inquiries are preserved, identity is scrubbed.
-- Callable by the member (self) or an admin.
-- ---------------------------------------------------------------
create or replace function public.withdraw_member(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is distinct from target and not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  update public.profiles
  set display_name = 'Withdrawn member',
      company_name = null,
      bio = null,
      avatar_url = null,
      status = 'withdrawn',
      suspend_reason = null,
      is_coordinator = false
  where id = target;

  update public.profile_contacts
  set email = null, phone = null, contact_person = null
  where profile_id = target;

  delete from public.mini_homepages where profile_id = target;

  insert into public.audit_logs (actor_id, action, target_type, target_id, detail)
  values (auth.uid(), 'member_withdraw', 'profile', target::text, '{}'::jsonb);
end;
$$;
revoke execute on function public.withdraw_member(uuid) from public, anon;

-- ---------------------------------------------------------------
-- Search acceleration: trigram GIN indexes behind the ilike search.
-- ---------------------------------------------------------------
create extension if not exists pg_trgm;
create index if not exists posts_title_en_trgm on public.posts using gin (title_en gin_trgm_ops);
create index if not exists posts_title_ko_trgm on public.posts using gin (title_ko gin_trgm_ops);
create index if not exists posts_body_en_trgm on public.posts using gin (body_en gin_trgm_ops);

-- ---------------------------------------------------------------
-- Realtime: live unread badge (RLS applies to the subscriber).
-- ---------------------------------------------------------------
alter publication supabase_realtime add table public.notifications;
