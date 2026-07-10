-- Production hardening pass (2026-07-11).
-- 1) RLS initplan optimization: wrap auth.uid()/is_admin() in scalar
--    subqueries so Postgres evaluates them once per statement instead of
--    once per row (Supabase perf lint 0003_auth_rls_initplan).
-- 2) Indexes on remaining foreign keys used by app queries.
-- 3) Storage bucket size/MIME limits matching the upload settings.
-- 4) Missing updated_at trigger on profile_contacts.

-- ================================================================
-- 1. RLS initplan rewrites
-- ================================================================

alter policy "settings public read" on public.site_settings
  using (is_public or (select public.is_admin()));
alter policy "settings admin write" on public.site_settings
  using ((select public.is_admin())) with check ((select public.is_admin()));

alter policy "tiers admin write" on public.member_tiers
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "tier perms admin write" on public.tier_permissions
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- profiles: merge self+admin update into one policy (removes duplicate
-- permissive policies); the guard trigger still protects privileged columns.
alter policy "profiles self update" on public.profiles
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));
drop policy "profiles admin update" on public.profiles;

alter policy "contacts self read" on public.profile_contacts
  using (
    profile_id = (select auth.uid())
    or (select public.is_admin())
    or public.is_direct_referrer_coordinator(profile_id)
  );
alter policy "contacts self update" on public.profile_contacts
  using (profile_id = (select auth.uid()) or (select public.is_admin()))
  with check (profile_id = (select auth.uid()) or (select public.is_admin()));

alter policy "memos admin only" on public.member_admin_memos
  using ((select public.is_admin())) with check ((select public.is_admin()));

alter policy "badge types admin write" on public.badge_types
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "member badges admin write" on public.member_badges
  using ((select public.is_admin())) with check ((select public.is_admin()));

alter policy "badge apps own read" on public.badge_applications
  using (profile_id = (select auth.uid()) or (select public.is_admin()));
alter policy "badge apps own insert" on public.badge_applications
  with check (profile_id = (select auth.uid()));
alter policy "badge apps admin update" on public.badge_applications
  using ((select public.is_admin())) with check ((select public.is_admin()));

alter policy "subs own read" on public.subscriptions
  using (profile_id = (select auth.uid()) or (select public.is_admin()));
alter policy "subs admin write" on public.subscriptions
  using ((select public.is_admin())) with check ((select public.is_admin()));

alter policy "menus admin write" on public.menus
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "categories admin write" on public.categories
  using ((select public.is_admin())) with check ((select public.is_admin()));
alter policy "spec defs admin write" on public.spec_field_defs
  using ((select public.is_admin())) with check ((select public.is_admin()));

alter policy "posts member read" on public.posts
  using (
    status in ('approved','closed')
    or author_id = (select auth.uid())
    or (select public.is_admin())
  );
alter policy "posts author insert" on public.posts
  with check (
    author_id = (select auth.uid())
    and status in ('draft','pending')
    and (
      (select public.is_admin())
      or exists (select 1 from public.menus m where m.id = menu_id and m.member_write)
    )
  );
alter policy "posts author update" on public.posts
  using (author_id = (select auth.uid()) or (select public.is_admin()))
  with check (author_id = (select auth.uid()) or (select public.is_admin()));
alter policy "posts author delete" on public.posts
  using (author_id = (select auth.uid()) or (select public.is_admin()));

alter policy "post media author write" on public.post_media
  using (exists (select 1 from public.posts p where p.id = post_id
    and (p.author_id = (select auth.uid()) or (select public.is_admin()))))
  with check (exists (select 1 from public.posts p where p.id = post_id
    and (p.author_id = (select auth.uid()) or (select public.is_admin()))));

alter policy "post attachments author write" on public.post_attachments
  using (exists (select 1 from public.posts p where p.id = post_id
    and (p.author_id = (select auth.uid()) or (select public.is_admin()))))
  with check (exists (select 1 from public.posts p where p.id = post_id
    and (p.author_id = (select auth.uid()) or (select public.is_admin()))));

alter policy "post specs author write" on public.post_specs
  using (exists (select 1 from public.posts p where p.id = post_id
    and (p.author_id = (select auth.uid()) or (select public.is_admin()))))
  with check (exists (select 1 from public.posts p where p.id = post_id
    and (p.author_id = (select auth.uid()) or (select public.is_admin()))));

alter policy "inquiries participant read" on public.inquiries
  using (
    sender_id = (select auth.uid())
    or recipient_id = (select auth.uid())
    or (select public.is_admin())
    or public.coordinator_can_view_inquiry(id)
  );
alter policy "inquiries sender insert" on public.inquiries
  with check (sender_id = (select auth.uid()));
alter policy "inquiries admin update" on public.inquiries
  using ((select public.is_admin())) with check ((select public.is_admin()));

alter policy "inquiry messages read" on public.inquiry_messages
  using (
    (select public.is_admin())
    or sender_id = (select auth.uid())
    or (public.is_inquiry_participant(inquiry_id) and review_status = 'forwarded')
    or public.coordinator_can_view_inquiry(inquiry_id)
  );
alter policy "inquiry messages participant insert" on public.inquiry_messages
  with check (sender_id = (select auth.uid()) and public.is_inquiry_participant(inquiry_id));
alter policy "inquiry messages admin update" on public.inquiry_messages
  using ((select public.is_admin())) with check ((select public.is_admin()));

alter policy "coord messages read" on public.coordinator_messages
  using (
    (select public.is_admin())
    or ((select auth.uid()) in (coordinator_id, member_id))
  );
alter policy "coord messages insert" on public.coordinator_messages
  with check (
    sender_id = (select auth.uid())
    and (select auth.uid()) in (coordinator_id, member_id)
    and exists (
      select 1 from public.profiles m
      where m.id = member_id
        and m.referred_by = coordinator_id
        and exists (select 1 from public.profiles c where c.id = coordinator_id and c.is_coordinator)
    )
  );

alter policy "notifications self all" on public.notifications
  using (profile_id = (select auth.uid()) or (select public.is_admin()))
  with check (profile_id = (select auth.uid()) or (select public.is_admin()));

alter policy "audit admin read" on public.audit_logs
  using ((select public.is_admin()));

-- storage.objects policies
alter policy "post media upload own" on storage.objects
  with check (bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid()::text));
alter policy "post media delete own" on storage.objects
  using (bucket_id = 'post-media'
    and ((storage.foldername(name))[1] = (select auth.uid()::text) or (select public.is_admin())));
alter policy "attachments upload own" on storage.objects
  with check (bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid()::text));
alter policy "attachments delete own" on storage.objects
  using (bucket_id = 'attachments'
    and ((storage.foldername(name))[1] = (select auth.uid()::text) or (select public.is_admin())));
alter policy "badge docs owner read" on storage.objects
  using (bucket_id = 'badge-docs'
    and ((storage.foldername(name))[1] = (select auth.uid()::text) or (select public.is_admin())));
alter policy "badge docs upload own" on storage.objects
  with check (bucket_id = 'badge-docs'
    and (storage.foldername(name))[1] = (select auth.uid()::text));
alter policy "badge docs delete own" on storage.objects
  using (bucket_id = 'badge-docs'
    and ((storage.foldername(name))[1] = (select auth.uid()::text) or (select public.is_admin())));

-- ================================================================
-- 2. Foreign key indexes
-- ================================================================

create index if not exists profiles_tier_idx on public.profiles (tier_id);
create index if not exists posts_category_idx on public.posts (category_id);
create index if not exists posts_reviewed_by_idx on public.posts (reviewed_by);
create index if not exists post_specs_field_def_idx on public.post_specs (field_def_id);
create index if not exists badge_applications_profile_idx on public.badge_applications (profile_id);
create index if not exists badge_applications_type_idx on public.badge_applications (badge_type_id);
create index if not exists badge_applications_reviewed_by_idx on public.badge_applications (reviewed_by);
create index if not exists member_badges_type_idx on public.member_badges (badge_type_id);
create index if not exists member_badges_granted_by_idx on public.member_badges (granted_by);
create index if not exists subscriptions_granted_by_idx on public.subscriptions (granted_by);
create index if not exists inquiries_post_idx on public.inquiries (post_id);
create index if not exists inquiry_messages_sender_idx on public.inquiry_messages (sender_id);
create index if not exists inquiry_messages_reviewed_by_idx on public.inquiry_messages (reviewed_by);
create index if not exists coordinator_messages_member_idx on public.coordinator_messages (member_id);
create index if not exists coordinator_messages_sender_idx on public.coordinator_messages (sender_id);
create index if not exists categories_menu_idx on public.categories (menu_id);
create index if not exists categories_parent_idx on public.categories (parent_id);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id);

-- ================================================================
-- 3. Storage bucket limits (10 MB, matching upload_max_file_mb default)
-- ================================================================

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/avif']
where id = 'post-media';

update storage.buckets
set file_size_limit = 10485760
where id = 'attachments';

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','application/pdf']
where id = 'badge-docs';

-- ================================================================
-- 4. Missing updated_at trigger
-- ================================================================

create trigger profile_contacts_updated_at before update on public.profile_contacts
  for each row execute function public.set_updated_at();
