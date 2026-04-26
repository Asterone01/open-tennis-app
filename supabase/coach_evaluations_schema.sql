-- OPEN coach evaluations radar stats.
-- Run this in the Supabase SQL editor for the players table.

alter table if exists public.players
  add column if not exists stat_ataque integer not null default 50,
  add column if not exists stat_defensa integer not null default 50,
  add column if not exists stat_saque integer not null default 50,
  add column if not exists stat_fisico integer not null default 50,
  add column if not exists stat_mentalidad integer not null default 50;

do $$
begin
  if to_regclass('public.players') is not null then
    if not exists (
      select 1 from pg_constraint
      where conname = 'players_stat_ataque_range'
    ) then
      alter table public.players
        add constraint players_stat_ataque_range
        check (stat_ataque between 0 and 100) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = 'players_stat_defensa_range'
    ) then
      alter table public.players
        add constraint players_stat_defensa_range
        check (stat_defensa between 0 and 100) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = 'players_stat_saque_range'
    ) then
      alter table public.players
        add constraint players_stat_saque_range
        check (stat_saque between 0 and 100) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = 'players_stat_fisico_range'
    ) then
      alter table public.players
        add constraint players_stat_fisico_range
        check (stat_fisico between 0 and 100) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = 'players_stat_mentalidad_range'
    ) then
      alter table public.players
        add constraint players_stat_mentalidad_range
        check (stat_mentalidad between 0 and 100) not valid;
    end if;
  end if;
end $$;
