-- OPEN dual-role and club membership fields.
-- Run this in the Supabase SQL editor for the players table.

alter table if exists public.players
  add column if not exists club_id uuid references public.clubs(id) on delete set null,
  add column if not exists is_coach boolean not null default false;

create index if not exists players_club_id_idx on public.players(club_id);
create index if not exists players_is_coach_idx on public.players(is_coach);
