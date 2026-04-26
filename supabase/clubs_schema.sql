-- OPEN clubs table for manager-owned brand kits.

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  primary_color text not null default '#0D0D0F',
  logo_url text,
  created_at timestamptz not null default now()
);

alter table public.clubs enable row level security;

drop policy if exists "Everyone can read clubs" on public.clubs;
drop policy if exists "Managers can insert their club" on public.clubs;
drop policy if exists "Managers can update their club" on public.clubs;
drop policy if exists "Managers can delete their club" on public.clubs;

create policy "Everyone can read clubs"
  on public.clubs
  for select
  using (true);

create policy "Managers can insert their club"
  on public.clubs
  for insert
  with check (auth.uid() = manager_id);

create policy "Managers can update their club"
  on public.clubs
  for update
  using (auth.uid() = manager_id)
  with check (auth.uid() = manager_id);

create policy "Managers can delete their club"
  on public.clubs
  for delete
  using (auth.uid() = manager_id);
