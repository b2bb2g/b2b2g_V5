-- Member activity history (PRD 17.2): last-seen timestamp and login records.

alter table public.profiles add column if not exists last_seen_at timestamptz;

create table public.login_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.login_events enable row level security;
create index login_events_profile_idx on public.login_events (profile_id, created_at desc);

create policy "login events self insert" on public.login_events
  for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy "login events admin read" on public.login_events
  for select using ((select public.is_admin()));
