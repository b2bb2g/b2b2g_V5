-- Mini homepages (PRD 5.2): the flagship paid benefit. Fully public when
-- published (promotion is free, contact goes through the platform gate).
-- No contact details are ever stored here (PRD 9).

create table public.mini_homepages (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  slug text unique not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  intro_en text not null default '',
  intro_ko text,
  cover_image_path text,
  doc_paths jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  custom_domain text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.mini_homepages enable row level security;
create trigger mini_homepages_updated_at before update on public.mini_homepages
  for each row execute function public.set_updated_at();

create policy "minihome public read" on public.mini_homepages
  for select using (
    is_published
    or profile_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy "minihome owner write" on public.mini_homepages
  for all to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()))
  with check (profile_id = (select auth.uid()) or (select public.is_admin()));
