-- OPEN tournaments base.
-- Run after players_access_policies.sql and clubs_schema.sql.

create extension if not exists pgcrypto;

-- Legacy rows created before club approval existed may have club_id but
-- club_membership_status = 'unassigned'. Treat those linked rows as approved.
update public.players
set club_membership_status = 'approved'
where club_id is not null
  and club_membership_status = 'unassigned';

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_by_player_id text,
  title text not null,
  description text,
  category text,
  age_group text,
  format text not null default 'singles',
  modality text not null default 'single_elimination',
  preset_key text,
  scoring_format text not null default 'best_of_3_sets',
  points_config jsonb not null default '{}'::jsonb,
  xp_config jsonb not null default '{}'::jsonb,
  tournament_type text not null default 'internal',
  status text not null default 'open',
  start_date date not null,
  registration_deadline date,
  court text,
  max_players integer not null default 16,
  ranking_multiplier numeric not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournaments_format_check
    check (format in ('singles', 'doubles')),
  constraint tournaments_modality_check
    check (modality in ('single_elimination', 'round_robin', 'league', 'ladder', 'americano')),
  constraint tournaments_type_check
    check (tournament_type in ('internal', 'open', 'special')),
  constraint tournaments_status_check
    check (status in ('planning', 'open', 'in_progress', 'finished', 'cancelled', 'archived')),
  constraint tournaments_max_players_check
    check (max_players > 0 and max_players <= 128)
);

alter table if exists public.tournaments
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists age_group text,
  add column if not exists format text not null default 'singles',
  add column if not exists modality text not null default 'single_elimination',
  add column if not exists preset_key text,
  add column if not exists scoring_format text not null default 'best_of_3_sets',
  add column if not exists points_config jsonb not null default '{}'::jsonb,
  add column if not exists xp_config jsonb not null default '{}'::jsonb,
  add column if not exists tournament_type text not null default 'internal',
  add column if not exists status text not null default 'open',
  add column if not exists registration_deadline date,
  add column if not exists court text,
  add column if not exists max_players integer not null default 16,
  add column if not exists ranking_multiplier numeric not null default 1,
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.tournament_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  seed integer,
  status text not null default 'registered',
  final_position integer,
  xp_awarded integer not null default 0,
  registered_at timestamptz not null default now(),
  constraint tournament_entries_status_check
    check (status in ('registered', 'waitlisted', 'withdrawn', 'eliminated', 'runner_up', 'champion')),
  constraint tournament_entries_unique_player unique (tournament_id, player_id)
);

create table if not exists public.tournament_matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  round_number integer not null default 1,
  match_order integer not null default 1,
  player1_id text,
  player2_id text,
  winner_player_id text,
  score text,
  status text not null default 'scheduled',
  scheduled_at timestamptz,
  court text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournament_matches_status_check
    check (status in ('scheduled', 'in_progress', 'finished', 'walkover', 'cancelled'))
);

alter table public.tournaments enable row level security;
alter table public.tournament_entries enable row level security;
alter table public.tournament_matches enable row level security;

create index if not exists tournaments_club_status_idx
  on public.tournaments(club_id, status);

create index if not exists tournaments_club_start_idx
  on public.tournaments(club_id, start_date desc);

create index if not exists tournament_entries_tournament_idx
  on public.tournament_entries(tournament_id, seed);

create index if not exists tournament_entries_player_idx
  on public.tournament_entries(player_id);

create index if not exists tournament_matches_tournament_round_idx
  on public.tournament_matches(tournament_id, round_number, match_order);

create index if not exists tournament_matches_player_idx
  on public.tournament_matches(player1_id, player2_id);

drop policy if exists "Club members can read tournaments" on public.tournaments;
drop policy if exists "Club coaches and managers can manage tournaments" on public.tournaments;
drop policy if exists "Club coaches can manage tournaments" on public.tournaments;
drop policy if exists "Club members can read tournament entries" on public.tournament_entries;
drop policy if exists "Club coaches and managers can manage tournament entries" on public.tournament_entries;
drop policy if exists "Club coaches can manage tournament entries" on public.tournament_entries;
drop policy if exists "Players can register themselves in tournaments" on public.tournament_entries;
drop policy if exists "Players can update own tournament registration" on public.tournament_entries;
drop policy if exists "Club members can read tournament matches" on public.tournament_matches;
drop policy if exists "Club coaches can manage tournament matches" on public.tournament_matches;

create policy "Club members can read tournaments"
  on public.tournaments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.players
      where players.user_id = auth.uid()
        and players.club_id = tournaments.club_id
    )
    or exists (
      select 1
      from public.clubs
      where clubs.manager_id = auth.uid()
        and clubs.id = tournaments.club_id
    )
  );

create policy "Club coaches can manage tournaments"
  on public.tournaments
  for all
  to authenticated
  using (
    club_id is not null
    and public.open_is_coach()
    and club_id = public.open_user_club_id()
  )
  with check (
    club_id is not null
    and public.open_is_coach()
    and club_id = public.open_user_club_id()
  );

create policy "Club members can read tournament entries"
  on public.tournament_entries
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.players
      where players.user_id = auth.uid()
        and players.club_id = tournament_entries.club_id
    )
    or exists (
      select 1
      from public.clubs
      where clubs.manager_id = auth.uid()
        and clubs.id = tournament_entries.club_id
    )
  );

create policy "Club coaches can manage tournament entries"
  on public.tournament_entries
  for all
  to authenticated
  using (
    club_id is not null
    and public.open_is_coach()
    and club_id = public.open_user_club_id()
  )
  with check (
    club_id is not null
    and public.open_is_coach()
    and club_id = public.open_user_club_id()
  );

create policy "Players can register themselves in tournaments"
  on public.tournament_entries
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.players
      where players.user_id = auth.uid()
        and players.id::text = tournament_entries.player_id
        and players.club_id = tournament_entries.club_id
        and players.club_membership_status in ('approved', 'unassigned')
    )
    and exists (
      select 1
      from public.tournaments
      where tournaments.id = tournament_entries.tournament_id
        and tournaments.club_id = tournament_entries.club_id
        and tournaments.status = 'open'
    )
  );

create policy "Players can update own tournament registration"
  on public.tournament_entries
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and status in ('registered', 'withdrawn')
  );

create policy "Club members can read tournament matches"
  on public.tournament_matches
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.players
      where players.user_id = auth.uid()
        and players.club_id = tournament_matches.club_id
    )
    or exists (
      select 1
      from public.clubs
      where clubs.manager_id = auth.uid()
        and clubs.id = tournament_matches.club_id
    )
  );

create policy "Club coaches can manage tournament matches"
  on public.tournament_matches
  for all
  to authenticated
  using (
    club_id is not null
    and public.open_is_coach()
    and club_id = public.open_user_club_id()
  )
  with check (
    club_id is not null
    and public.open_is_coach()
    and club_id = public.open_user_club_id()
  );
