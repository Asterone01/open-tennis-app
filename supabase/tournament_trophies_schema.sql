-- OPEN tournament trophies — digital assets for tournament winners.
-- Run after tournaments_schema.sql.

create extension if not exists pgcrypto;

create table if not exists public.tournament_trophies (
  id            uuid        primary key default gen_random_uuid(),
  tournament_id uuid        not null references public.tournaments(id) on delete cascade,
  club_id       uuid        not null references public.clubs(id)       on delete cascade,
  player_id     text        not null,
  user_id       uuid        references auth.users(id) on delete set null,
  tournament_title text     not null,
  club_name     text,
  season        text,       -- 'spring', 'summer', 'autumn', 'winter'
  won_at        date        not null default current_date,
  category      text,
  age_group     text,
  custom_message text,      -- max 50 chars, set by winner
  background_color text      not null default '#0D0D0F',
  include_photo boolean      not null default true,
  created_at    timestamptz not null default now(),
  unique(tournament_id, player_id)
);

alter table public.tournament_trophies
  add column if not exists background_color text not null default '#0D0D0F',
  add column if not exists include_photo boolean not null default true;

alter table public.tournament_trophies enable row level security;

create index if not exists tournament_trophies_player_idx
  on public.tournament_trophies(player_id);

create index if not exists tournament_trophies_club_idx
  on public.tournament_trophies(club_id, won_at desc);

drop policy if exists "Authenticated can read trophies"     on public.tournament_trophies;
drop policy if exists "Coaches can create trophies"         on public.tournament_trophies;
drop policy if exists "Winners can update own trophy"       on public.tournament_trophies;

create policy "Authenticated can read trophies"
  on public.tournament_trophies
  for select
  to authenticated
  using (true);

create policy "Coaches can create trophies"
  on public.tournament_trophies
  for insert
  to authenticated
  with check (
    public.open_is_coach()
    and club_id = public.open_user_club_id()
  );

-- Winner can personalize their trophy (custom_message only)
create policy "Winners can update own trophy"
  on public.tournament_trophies
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
