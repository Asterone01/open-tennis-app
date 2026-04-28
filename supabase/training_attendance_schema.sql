-- OPEN training attendance.
-- Run after players, clubs, and gamification_schema.sql.

create extension if not exists pgcrypto;

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete cascade,
  coach_player_id text not null,
  coach_user_id uuid references auth.users(id) on delete set null,
  title text not null,
  session_date date not null,
  session_time time,
  duration_minutes integer not null default 60,
  court text,
  categories text[] not null default '{}'::text[],
  focus_area text,
  drill_preset text,
  session_plan text,
  status text not null default 'planned',
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint training_sessions_status_check
    check (status in ('planned', 'closed', 'cancelled'))
);

alter table if exists public.training_sessions
  add column if not exists duration_minutes integer not null default 60,
  add column if not exists focus_area text,
  add column if not exists drill_preset text,
  add column if not exists session_plan text;

create table if not exists public.training_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  player_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  club_id uuid references public.clubs(id) on delete cascade,
  status text not null default 'invited',
  xp_awarded integer not null default 0,
  marked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint training_attendance_status_check
    check (status in ('invited', 'present', 'absent')),
  constraint training_attendance_unique_player unique (session_id, player_id)
);

alter table public.training_sessions enable row level security;
alter table public.training_attendance enable row level security;

create index if not exists training_sessions_club_date_idx
  on public.training_sessions(club_id, session_date desc);

create index if not exists training_sessions_status_idx
  on public.training_sessions(status);

create index if not exists training_attendance_session_idx
  on public.training_attendance(session_id);

create index if not exists training_attendance_player_idx
  on public.training_attendance(player_id);

drop policy if exists "Club coaches and managers can manage training sessions" on public.training_sessions;
drop policy if exists "Players can read their training sessions" on public.training_sessions;
drop policy if exists "Club coaches and managers can manage training attendance" on public.training_attendance;
drop policy if exists "Players can read their training attendance" on public.training_attendance;

create policy "Club coaches and managers can manage training sessions"
  on public.training_sessions
  for all
  to authenticated
  using (
    (
      club_id is not null
      and public.open_is_coach()
      and club_id = public.open_user_club_id()
    )
    or exists (
      select 1
      from public.clubs
      where clubs.manager_id = auth.uid()
        and clubs.id = training_sessions.club_id
    )
  )
  with check (
    (
      club_id is not null
      and public.open_is_coach()
      and club_id = public.open_user_club_id()
    )
    or exists (
      select 1
      from public.clubs
      where clubs.manager_id = auth.uid()
        and clubs.id = training_sessions.club_id
    )
  );

create policy "Players can read their training sessions"
  on public.training_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.training_attendance
      where training_attendance.session_id = training_sessions.id
        and training_attendance.user_id = auth.uid()
    )
  );

create policy "Club coaches and managers can manage training attendance"
  on public.training_attendance
  for all
  to authenticated
  using (
    (
      club_id is not null
      and public.open_is_coach()
      and club_id = public.open_user_club_id()
    )
    or exists (
      select 1
      from public.clubs
      where clubs.manager_id = auth.uid()
        and clubs.id = training_attendance.club_id
    )
  )
  with check (
    (
      club_id is not null
      and public.open_is_coach()
      and club_id = public.open_user_club_id()
    )
    or exists (
      select 1
      from public.clubs
      where clubs.manager_id = auth.uid()
        and clubs.id = training_attendance.club_id
    )
  );

create policy "Players can read their training attendance"
  on public.training_attendance
  for select
  to authenticated
  using (user_id = auth.uid());
