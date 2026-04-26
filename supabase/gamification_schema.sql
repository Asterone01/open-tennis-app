-- OPEN gamification fields
-- Run this in the Supabase SQL editor for the players table.

alter table if exists public.players
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1,
  add column if not exists current_streak integer not null default 0,
  add column if not exists last_activity_date date;

do $$
begin
  if to_regclass('public.players') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conname = 'players_xp_non_negative'
    ) then
      alter table public.players
        add constraint players_xp_non_negative check (xp >= 0) not valid;
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conname = 'players_level_positive'
    ) then
      alter table public.players
        add constraint players_level_positive check (level >= 1) not valid;
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conname = 'players_current_streak_non_negative'
    ) then
      alter table public.players
        add constraint players_current_streak_non_negative check (current_streak >= 0) not valid;
    end if;
  end if;
end $$;
