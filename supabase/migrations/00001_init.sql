-- b2bb2g-v5 initial schema. Apply to a fresh Supabase project:
--   psql "$DATABASE_URL" -f supabase/migrations/00001_init.sql
-- Consolidates: core_members, badges_subscriptions, boards_posts,
-- inquiries_messaging, notifications_audit_automation, storage_buckets,
-- security_hardening (applied 2026-07-10/11).

-- ================================================================
-- 1. core_members
-- ================================================================

create extension if not exists pgcrypto;

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default true,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

create table public.member_tiers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_en text not null,
  name_ko text not null,
  is_paid boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.member_tiers enable row level security;

create table public.tier_permissions (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.member_tiers(id) on delete cascade,
  action text not null,
  allowed boolean not null default true,
  unique (tier_id, action)
);
alter table public.tier_permissions enable row level security;

create sequence public.member_uid_seq start 100001;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  uid bigint unique not null default nextval('public.member_uid_seq'),
  display_name text,
  company_name text,
  bio text,
  avatar_url text,
  status text not null default 'active' check (status in ('active','suspended','withdrawn')),
  suspend_reason text,
  tier_id uuid references public.member_tiers(id),
  is_admin boolean not null default false,
  is_coordinator boolean not null default false,
  coordinator_msg_override text check (coordinator_msg_override in ('allow','deny')),
  referred_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create index profiles_referred_by_idx on public.profiles (referred_by);

create table public.profile_contacts (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  email text,
  phone text,
  contact_person text,
  updated_at timestamptz not null default now()
);
alter table public.profile_contacts enable row level security;

create table public.member_admin_memos (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  memo text not null default '',
  updated_by uuid,
  updated_at timestamptz not null default now()
);
alter table public.member_admin_memos enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.is_direct_referrer_coordinator(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.profiles t
    join public.profiles c on c.id = auth.uid()
    where t.id = target
      and t.referred_by = c.id
      and c.is_coordinator
  );
$$;

create or replace function public.coordinator_can_view_messages(member_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_direct_referrer_coordinator(member_id)
    and coalesce(
      (select c.coordinator_msg_override = 'allow' from public.profiles c where c.id = auth.uid()
        and c.coordinator_msg_override is not null),
      coalesce((select (s.value)::boolean from public.site_settings s
        where s.key = 'coordinator_message_access_global'), false)
    );
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  referrer_uid bigint;
  referrer_id uuid;
  bootstrap_email text;
  default_tier uuid;
begin
  select (value #>> '{}') into bootstrap_email
    from public.site_settings where key = 'bootstrap_admin_email';

  select id into default_tier from public.member_tiers where code = 'general';

  begin
    referrer_uid := nullif(new.raw_user_meta_data ->> 'referred_by_uid', '')::bigint;
  exception when others then
    referrer_uid := null;
  end;

  if referrer_uid is not null then
    select id into referrer_id from public.profiles where uid = referrer_uid;
  end if;

  insert into public.profiles (id, display_name, tier_id, referred_by, is_admin)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)),
    default_tier,
    referrer_id,
    lower(new.email) = lower(coalesce(bootstrap_email, ''))
  );

  insert into public.profile_contacts (profile_id, email)
  values (new.id, new.email);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "settings public read" on public.site_settings
  for select using (is_public or public.is_admin());
create policy "settings admin write" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

create policy "tiers read all" on public.member_tiers
  for select using (true);
create policy "tiers admin write" on public.member_tiers
  for all using (public.is_admin()) with check (public.is_admin());

create policy "tier perms read all" on public.tier_permissions
  for select using (true);
create policy "tier perms admin write" on public.tier_permissions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "profiles read all" on public.profiles
  for select using (true);
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);
create policy "profiles admin update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

create or replace function public.guard_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.is_admin := old.is_admin;
    new.is_coordinator := old.is_coordinator;
    new.coordinator_msg_override := old.coordinator_msg_override;
    new.tier_id := old.tier_id;
    new.status := old.status;
    new.suspend_reason := old.suspend_reason;
    new.uid := old.uid;
    new.referred_by := old.referred_by;
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_columns();

create policy "contacts self read" on public.profile_contacts
  for select using (
    auth.uid() = profile_id
    or public.is_admin()
    or public.is_direct_referrer_coordinator(profile_id)
  );
create policy "contacts self update" on public.profile_contacts
  for update using (auth.uid() = profile_id or public.is_admin())
  with check (auth.uid() = profile_id or public.is_admin());

create policy "memos admin only" on public.member_admin_memos
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.member_tiers (code, name_en, name_ko, is_paid, sort_order) values
  ('general', 'General member', '일반 회원', false, 0),
  ('certified', 'Certified member', '인증 회원', true, 1);

insert into public.tier_permissions (tier_id, action, allowed)
select t.id, a.action, true
from public.member_tiers t
cross join (values ('create_post'), ('send_inquiry')) as a(action);

insert into public.site_settings (key, value, is_public) values
  ('site_title', '"B2B2G Trade"', true),
  ('site_description', '"A trusted B2B and B2G trade community connecting Korean manufacturers and suppliers with global buyers."', true),
  ('site_og_image', '""', true),
  ('free_post_limit', '3', true),
  ('featured_slots', '6', true),
  ('category_nav_visible', 'false', true),
  ('translation_assist_visible', 'false', true),
  ('video_autoplay', 'false', true),
  ('referral_stats_visible', 'false', true),
  ('coordinator_message_access_global', 'true', false),
  ('pwa_banner_enabled', 'true', true),
  ('pwa_banner_redisplay_days', '14', true),
  ('inapp_redirect_enabled', 'true', true),
  ('upload_max_file_mb', '10', true),
  ('upload_max_files_per_post', '10', true),
  ('subscription_expiry_notice_days', '7', false),
  ('bootstrap_admin_email', '"badaon.com@gmail.com"', false);

-- ================================================================
-- 2. badges_subscriptions
-- ================================================================

create table public.badge_types (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name_en text not null,
  name_ko text not null,
  description_en text,
  description_ko text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.badge_types enable row level security;

create table public.member_badges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  badge_type_id uuid not null references public.badge_types(id) on delete cascade,
  granted_by uuid references public.profiles(id),
  granted_at timestamptz not null default now(),
  unique (profile_id, badge_type_id)
);
alter table public.member_badges enable row level security;
create index member_badges_profile_idx on public.member_badges (profile_id);

create table public.badge_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  badge_type_id uuid not null references public.badge_types(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  company_info jsonb not null default '{}'::jsonb,
  document_paths text[] not null default '{}',
  reject_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.badge_applications enable row level security;
create index badge_applications_status_idx on public.badge_applications (status);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','expired','revoked')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  deposit_note text,
  granted_by uuid references public.profiles(id),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
create index subscriptions_profile_idx on public.subscriptions (profile_id);
create index subscriptions_expiry_idx on public.subscriptions (status, expires_at);

create policy "badge types read all" on public.badge_types
  for select using (true);
create policy "badge types admin write" on public.badge_types
  for all using (public.is_admin()) with check (public.is_admin());

create policy "member badges read all" on public.member_badges
  for select using (true);
create policy "member badges admin write" on public.member_badges
  for all using (public.is_admin()) with check (public.is_admin());

create policy "badge apps own read" on public.badge_applications
  for select using (auth.uid() = profile_id or public.is_admin());
create policy "badge apps own insert" on public.badge_applications
  for insert with check (auth.uid() = profile_id);
create policy "badge apps admin update" on public.badge_applications
  for update using (public.is_admin()) with check (public.is_admin());

create policy "subs own read" on public.subscriptions
  for select using (auth.uid() = profile_id or public.is_admin());
create policy "subs admin write" on public.subscriptions
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.badge_types (code, name_en, name_ko, description_en, description_ko, sort_order) values
  ('manufacturer', 'Manufacturer', '제조사',
   'Verified manufacturer or supplier. Granted after document review.',
   '서류 검토 후 부여되는 제조사/공급사 역할 신호예요.', 0),
  ('certified', 'Certified', '인증',
   'Identity-verified paid member. A global trust signal.',
   '신원 확인을 거친 유료 회원에게 부여되는 전역 신뢰 신호예요.', 1);

-- ================================================================
-- 3. boards_posts
-- ================================================================

create table public.menus (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_en text not null,
  title_ko text not null,
  board_type text not null check (board_type in ('product','request','flexible','notice')),
  sort_order int not null default 0,
  is_visible boolean not null default true,
  member_write boolean not null default false,
  review_required boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.menus enable row level security;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid references public.menus(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete cascade,
  name_en text not null,
  name_ko text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;

create table public.spec_field_defs (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_ko text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.spec_field_defs enable row level security;

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('product','request','flexible','notice')),
  status text not null default 'draft' check (status in ('draft','pending','approved','rejected','closed')),
  title_en text not null default '',
  title_ko text,
  body_en text not null default '',
  body_ko text,
  category_id uuid references public.categories(id) on delete set null,
  rep_image_path text,
  rep_video_url text,
  deadline date,
  closed_at timestamptz,
  reject_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.posts enable row level security;
create index posts_menu_status_idx on public.posts (menu_id, status, published_at desc);
create index posts_author_idx on public.posts (author_id);
create trigger posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();

create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.post_media enable row level security;
create index post_media_post_idx on public.post_media (post_id);

create table public.post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  path text not null,
  filename text not null,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
alter table public.post_attachments enable row level security;
create index post_attachments_post_idx on public.post_attachments (post_id);

create table public.post_specs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  field_def_id uuid references public.spec_field_defs(id) on delete set null,
  name_en text not null,
  name_ko text,
  value text not null,
  sort_order int not null default 0
);
alter table public.post_specs enable row level security;
create index post_specs_post_idx on public.post_specs (post_id);

create or replace function public.can_read_post(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_id
      and (
        p.status in ('approved','closed')
        or p.author_id = auth.uid()
        or public.is_admin()
      )
  );
$$;

create policy "menus read all" on public.menus for select using (true);
create policy "menus admin write" on public.menus
  for all using (public.is_admin()) with check (public.is_admin());

create policy "categories read all" on public.categories for select using (true);
create policy "categories admin write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "spec defs read all" on public.spec_field_defs for select using (true);
create policy "spec defs admin write" on public.spec_field_defs
  for all using (public.is_admin()) with check (public.is_admin());

create policy "posts member read" on public.posts
  for select to authenticated
  using (status in ('approved','closed') or author_id = auth.uid() or public.is_admin());

create policy "posts author insert" on public.posts
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and status in ('draft','pending')
    and (
      public.is_admin()
      or exists (select 1 from public.menus m where m.id = menu_id and m.member_write)
    )
  );

create policy "posts author update" on public.posts
  for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (author_id = auth.uid() or public.is_admin());

create policy "posts author delete" on public.posts
  for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

create or replace function public.guard_post_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if new.status in ('approved','rejected') and old.status is distinct from new.status then
      raise exception 'Only admins can approve or reject posts';
    end if;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
    new.reject_reason := old.reject_reason;
  end if;
  if new.status = 'approved' and old.status is distinct from new.status then
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;
create trigger posts_guard_status before update on public.posts
  for each row execute function public.guard_post_status();

create policy "post media member read" on public.post_media
  for select to authenticated using (public.can_read_post(post_id));
create policy "post media author write" on public.post_media
  for all to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and (p.author_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.posts p where p.id = post_id and (p.author_id = auth.uid() or public.is_admin())));

create policy "post attachments member read" on public.post_attachments
  for select to authenticated using (public.can_read_post(post_id));
create policy "post attachments author write" on public.post_attachments
  for all to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and (p.author_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.posts p where p.id = post_id and (p.author_id = auth.uid() or public.is_admin())));

create policy "post specs member read" on public.post_specs
  for select to authenticated using (public.can_read_post(post_id));
create policy "post specs author write" on public.post_specs
  for all to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and (p.author_id = auth.uid() or public.is_admin())))
  with check (exists (select 1 from public.posts p where p.id = post_id and (p.author_id = auth.uid() or public.is_admin())));

-- Anon-safe teaser view. Intentionally SECURITY DEFINER (owner bypasses RLS):
-- exposes only approved/closed posts and teaser columns (PRD 9, 12).
-- Teaser length 600: keep in sync with TEASER_LENGTH in lib/constants.ts.
create view public.public_posts as
select
  p.id,
  p.menu_id,
  p.type,
  p.status,
  p.title_en,
  p.title_ko,
  left(p.body_en, 600) as body_teaser_en,
  left(coalesce(p.body_ko, ''), 600) as body_teaser_ko,
  length(p.body_en) > 600 as body_truncated,
  p.category_id,
  p.rep_image_path,
  p.rep_video_url,
  p.deadline,
  p.closed_at,
  p.published_at,
  p.created_at,
  pr.uid as author_uid,
  pr.display_name as author_name,
  pr.company_name as author_company
from public.posts p
join public.profiles pr on pr.id = p.author_id
where p.status in ('approved','closed');

revoke all on public.public_posts from anon, authenticated;
grant select on public.public_posts to anon, authenticated;

insert into public.menus (slug, title_en, title_ko, board_type, sort_order, is_visible, member_write, review_required) values
  ('commercial', 'Commercial', '커머셜', 'product', 0, true, true, true),
  ('industrial', 'Industrial', '인더스트리얼', 'product', 1, true, true, true),
  ('epc', 'EPC+IPP', 'EPC+IPP', 'product', 2, true, false, true),
  ('requests', 'RFQ & ITB', 'RFQ & ITB', 'request', 3, true, true, true),
  ('events', 'Events', '이벤트', 'flexible', 4, true, false, true),
  ('services', 'Services', '서비스', 'notice', 5, true, false, true),
  ('notices', 'Notices', '공지', 'notice', 6, true, false, true);

insert into public.spec_field_defs (name_en, name_ko, sort_order) values
  ('Origin', '원산지', 0),
  ('Minimum order quantity', '최소주문수량', 1),
  ('Material', '재질', 2),
  ('Lead time', '납기', 3),
  ('Packaging', '포장', 4),
  ('Certifications', '인증', 5);

-- ================================================================
-- 4. inquiries_messaging
-- ================================================================

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete set null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null default '',
  status text not null default 'sent' check (status in
    ('sent','admin_review','forwarded','answered','answer_review','answer_delivered','rejected')),
  is_service_inquiry boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.inquiries enable row level security;
create index inquiries_sender_idx on public.inquiries (sender_id);
create index inquiries_recipient_idx on public.inquiries (recipient_id);
create index inquiries_status_idx on public.inquiries (status);
create trigger inquiries_updated_at before update on public.inquiries
  for each row execute function public.set_updated_at();

create table public.inquiry_messages (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  review_status text not null default 'pending' check (review_status in ('pending','forwarded','rejected')),
  reject_reason text,
  admin_feedback text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.inquiry_messages enable row level security;
create index inquiry_messages_inquiry_idx on public.inquiry_messages (inquiry_id);
create index inquiry_messages_review_idx on public.inquiry_messages (review_status);

create or replace function public.is_inquiry_participant(iq uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.inquiries i
    where i.id = iq and (i.sender_id = auth.uid() or i.recipient_id = auth.uid())
  );
$$;

create or replace function public.coordinator_can_view_inquiry(iq uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.inquiries i
    where i.id = iq
      and (public.coordinator_can_view_messages(i.sender_id)
        or public.coordinator_can_view_messages(i.recipient_id))
  );
$$;

create policy "inquiries participant read" on public.inquiries
  for select to authenticated
  using (
    sender_id = auth.uid()
    or recipient_id = auth.uid()
    or public.is_admin()
    or public.coordinator_can_view_inquiry(id)
  );

create policy "inquiries sender insert" on public.inquiries
  for insert to authenticated
  with check (sender_id = auth.uid());

create policy "inquiries admin update" on public.inquiries
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "inquiry messages read" on public.inquiry_messages
  for select to authenticated
  using (
    public.is_admin()
    or sender_id = auth.uid()
    or (public.is_inquiry_participant(inquiry_id) and review_status = 'forwarded')
    or public.coordinator_can_view_inquiry(inquiry_id)
  );

create policy "inquiry messages participant insert" on public.inquiry_messages
  for insert to authenticated
  with check (sender_id = auth.uid() and public.is_inquiry_participant(inquiry_id));

create policy "inquiry messages admin update" on public.inquiry_messages
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.after_inquiry_message_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  iq public.inquiries%rowtype;
begin
  select * into iq from public.inquiries where id = new.inquiry_id;
  if new.sender_id = iq.sender_id then
    update public.inquiries set status = 'admin_review' where id = iq.id;
  else
    update public.inquiries set status = 'answer_review' where id = iq.id;
  end if;
  return new;
end;
$$;
create trigger inquiry_message_inserted after insert on public.inquiry_messages
  for each row execute function public.after_inquiry_message_insert();

create table public.coordinator_messages (
  id uuid primary key default gen_random_uuid(),
  coordinator_id uuid not null references public.profiles(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.coordinator_messages enable row level security;
create index coordinator_messages_pair_idx on public.coordinator_messages (coordinator_id, member_id);

create policy "coord messages read" on public.coordinator_messages
  for select to authenticated
  using (
    public.is_admin()
    or (auth.uid() in (coordinator_id, member_id))
  );

create policy "coord messages insert" on public.coordinator_messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and auth.uid() in (coordinator_id, member_id)
    and exists (
      select 1 from public.profiles m
      where m.id = member_id
        and m.referred_by = coordinator_id
        and exists (select 1 from public.profiles c where c.id = coordinator_id and c.is_coordinator)
    )
  );

-- ================================================================
-- 5. notifications_audit_automation
-- ================================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  state text not null default 'unread' check (state in ('unread','read','archived','trashed')),
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create index notifications_profile_state_idx on public.notifications (profile_id, state, created_at desc);

create policy "notifications self all" on public.notifications
  for all to authenticated
  using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());

create or replace function public.notify(target uuid, ntype text, npayload jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications (profile_id, type, payload)
  values (target, ntype, coalesce(npayload, '{}'::jsonb));
$$;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create policy "audit admin read" on public.audit_logs
  for select using (public.is_admin());

create or replace function public.log_audit(a_action text, a_target_type text, a_target_id text, a_detail jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs (actor_id, action, target_type, target_id, detail)
  select auth.uid(), a_action, a_target_type, a_target_id, coalesce(a_detail, '{}'::jsonb)
  where public.is_admin();
$$;

create or replace function public.after_post_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and old.status is distinct from new.status then
    perform public.notify(new.author_id, 'post_approved',
      jsonb_build_object('post_id', new.id, 'title', new.title_en));
  elsif new.status = 'rejected' and old.status is distinct from new.status then
    perform public.notify(new.author_id, 'post_rejected',
      jsonb_build_object('post_id', new.id, 'title', new.title_en, 'reason', new.reject_reason));
  end if;
  return new;
end;
$$;
create trigger post_review_notify after update on public.posts
  for each row execute function public.after_post_review();

create or replace function public.after_message_review()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  iq public.inquiries%rowtype;
  other uuid;
begin
  select * into iq from public.inquiries where id = new.inquiry_id;
  if new.review_status = 'forwarded' and old.review_status is distinct from new.review_status then
    other := case when new.sender_id = iq.sender_id then iq.recipient_id else iq.sender_id end;
    perform public.notify(other, 'message_delivered',
      jsonb_build_object('inquiry_id', iq.id, 'subject', iq.subject));
    if new.sender_id = iq.sender_id then
      update public.inquiries set status = 'forwarded' where id = iq.id;
    else
      update public.inquiries set status = 'answer_delivered' where id = iq.id;
    end if;
  elsif new.review_status = 'rejected' and old.review_status is distinct from new.review_status then
    perform public.notify(new.sender_id, 'message_rejected',
      jsonb_build_object('inquiry_id', iq.id, 'subject', iq.subject, 'reason', new.reject_reason));
    update public.inquiries set status = 'rejected' where id = iq.id;
  end if;
  return new;
end;
$$;
create trigger message_review_notify after update on public.inquiry_messages
  for each row execute function public.after_message_review();

create or replace function public.after_badge_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and old.status is distinct from new.status then
    insert into public.member_badges (profile_id, badge_type_id, granted_by)
    values (new.profile_id, new.badge_type_id, new.reviewed_by)
    on conflict (profile_id, badge_type_id) do nothing;
    perform public.notify(new.profile_id, 'badge_approved',
      jsonb_build_object('application_id', new.id));
  elsif new.status = 'rejected' and old.status is distinct from new.status then
    perform public.notify(new.profile_id, 'badge_rejected',
      jsonb_build_object('application_id', new.id, 'reason', new.reject_reason));
  end if;
  return new;
end;
$$;
create trigger badge_review_notify after update on public.badge_applications
  for each row execute function public.after_badge_review();

create or replace function public.process_expirations()
returns void language plpgsql security definer set search_path = public as $$
declare
  cert_badge uuid;
  notice_days int;
begin
  select id into cert_badge from public.badge_types where code = 'certified';
  select coalesce((value)::int, 7) into notice_days
    from public.site_settings where key = 'subscription_expiry_notice_days';

  update public.posts
  set status = 'closed', closed_at = now()
  where type = 'request' and status = 'approved'
    and deadline is not null and deadline < current_date;

  with expired as (
    update public.subscriptions
    set status = 'expired'
    where status = 'active' and expires_at < now()
    returning profile_id
  )
  delete from public.member_badges mb
  using expired e
  where mb.profile_id = e.profile_id and mb.badge_type_id = cert_badge
    and not exists (
      select 1 from public.subscriptions s
      where s.profile_id = e.profile_id and s.status = 'active' and s.expires_at >= now()
    );

  insert into public.notifications (profile_id, type, payload)
  select s.profile_id, 'subscription_expiring',
    jsonb_build_object('subscription_id', s.id, 'expires_at', s.expires_at)
  from public.subscriptions s
  where s.status = 'active'
    and s.expires_at between now() and now() + make_interval(days => notice_days)
    and not exists (
      select 1 from public.notifications n
      where n.profile_id = s.profile_id
        and n.type = 'subscription_expiring'
        and (n.payload ->> 'subscription_id') = s.id::text
    );
end;
$$;

create extension if not exists pg_cron;
select cron.schedule('process-expirations', '0 1 * * *', $$select public.process_expirations()$$);

-- ================================================================
-- 6. storage_buckets
-- ================================================================

insert into storage.buckets (id, name, public) values
  ('post-media', 'post-media', true),
  ('attachments', 'attachments', false),
  ('badge-docs', 'badge-docs', false);

create policy "post media upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "post media delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy "attachments member read" on storage.objects
  for select to authenticated using (bucket_id = 'attachments');
create policy "attachments upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "attachments delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'attachments' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy "badge docs owner read" on storage.objects
  for select to authenticated
  using (bucket_id = 'badge-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy "badge docs upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'badge-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "badge docs delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'badge-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ================================================================
-- 7. security_hardening
-- ================================================================

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_profile_columns() from public, anon, authenticated;
revoke execute on function public.guard_post_status() from public, anon, authenticated;
revoke execute on function public.after_inquiry_message_insert() from public, anon, authenticated;
revoke execute on function public.after_post_review() from public, anon, authenticated;
revoke execute on function public.after_message_review() from public, anon, authenticated;
revoke execute on function public.after_badge_review() from public, anon, authenticated;
revoke execute on function public.notify(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.process_expirations() from public, anon, authenticated;
revoke execute on function public.log_audit(text, text, text, jsonb) from public, anon;

revoke execute on function public.is_inquiry_participant(uuid) from anon;
revoke execute on function public.coordinator_can_view_inquiry(uuid) from anon;
revoke execute on function public.coordinator_can_view_messages(uuid) from anon;
revoke execute on function public.can_read_post(uuid) from anon;
