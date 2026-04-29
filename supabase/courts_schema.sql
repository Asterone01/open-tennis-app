-- OPEN courts (canchas) — managed by club manager.
-- Run after clubs_schema.sql.

create table if not exists public.courts (
  id         uuid        primary key default gen_random_uuid(),
  club_id    uuid        not null references public.clubs(id) on delete cascade,
  name       text        not null,
  surface    text        not null default 'clay',   -- clay, hard, grass, artificial
  is_indoor  boolean     not null default false,
  status     text        not null default 'active', -- active, maintenance, inactive
  notes      text,
  created_at timestamptz not null default now()
);

alter table public.courts enable row level security;

create index if not exists courts_club_idx on public.courts(club_id);

drop policy if exists "Club members can read courts"  on public.courts;
drop policy if exists "Manager can manage courts"     on public.courts;

create policy "Club members can read courts"
  on public.courts for select to authenticated
  using (
    club_id in (
      select club_id from public.players where user_id = auth.uid()
      union
      select id from public.clubs where manager_id = auth.uid()
    )
  );

create policy "Manager can manage courts"
  on public.courts for all to authenticated
  using  (club_id in (select id from public.clubs where manager_id = auth.uid()))
  with check (club_id in (select id from public.clubs where manager_id = auth.uid()));
