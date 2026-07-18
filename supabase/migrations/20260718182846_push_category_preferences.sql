-- Per-member push category preferences. Muting a category skips the web push
-- only; the in-app notification is still created.
alter table public.profiles
  add column push_muted_types text[] not null default '{}';
