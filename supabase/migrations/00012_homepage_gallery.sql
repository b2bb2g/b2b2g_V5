-- Mini homepage completion (PRD 5.2 / A9): photo gallery and a dedicated
-- certificates section alongside the existing intro/cover/docs.
alter table public.mini_homepages
  add column if not exists gallery_paths jsonb not null default '[]'::jsonb,
  add column if not exists cert_paths jsonb not null default '[]'::jsonb;
