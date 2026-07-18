-- Self-hosted error monitoring + product bookmarks.

-- Application errors, written only by the server (service role bypasses
-- RLS); readable by staff with security permission.
create table public.app_error_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('server', 'client')),
  message text not null,
  stack text,
  url text,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.app_error_logs enable row level security;
create index app_error_logs_created_idx
  on public.app_error_logs (created_at desc);

create policy "error logs security read" on public.app_error_logs
  for select to authenticated
  using ((select public.has_admin_permission('security')));

-- Saved products (wishlist).
create table public.post_bookmarks (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, post_id)
);
alter table public.post_bookmarks enable row level security;
create index post_bookmarks_profile_idx
  on public.post_bookmarks (profile_id, created_at desc);

create policy "bookmarks self all" on public.post_bookmarks
  for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
