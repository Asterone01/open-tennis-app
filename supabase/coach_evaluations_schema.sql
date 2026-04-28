-- OPEN coach evaluations radar stats.
-- Run this in the Supabase SQL editor for the players table.
-- Canonical roadmap skills:
-- derecha, reves, saque, volea, movilidad, slice.

alter table if exists public.players
  add column if not exists stat_derecha integer not null default 50,
  add column if not exists stat_reves integer not null default 50,
  add column if not exists stat_saque integer not null default 50,
  add column if not exists stat_volea integer not null default 50,
  add column if not exists stat_movilidad integer not null default 50,
  add column if not exists stat_slice integer not null default 50;

-- Backfill from the previous 5-axis prototype when those columns exist.
do $$
begin
  if to_regclass('public.players') is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'players'
        and column_name = 'stat_ataque'
    ) then
      update public.players
      set stat_derecha = coalesce(stat_ataque, stat_derecha);
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'players'
        and column_name = 'stat_defensa'
    ) then
      update public.players
      set stat_reves = coalesce(stat_defensa, stat_reves);
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'players'
        and column_name = 'stat_fisico'
    ) then
      update public.players
      set stat_movilidad = coalesce(stat_fisico, stat_movilidad);
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'players'
        and column_name = 'stat_mentalidad'
    ) then
      update public.players
      set stat_volea = coalesce(stat_mentalidad, stat_volea);
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = 'players_stat_derecha_range'
    ) then
      alter table public.players
        add constraint players_stat_derecha_range
        check (stat_derecha between 0 and 100) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = 'players_stat_reves_range'
    ) then
      alter table public.players
        add constraint players_stat_reves_range
        check (stat_reves between 0 and 100) not valid;
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
      where conname = 'players_stat_volea_range'
    ) then
      alter table public.players
        add constraint players_stat_volea_range
        check (stat_volea between 0 and 100) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = 'players_stat_movilidad_range'
    ) then
      alter table public.players
        add constraint players_stat_movilidad_range
        check (stat_movilidad between 0 and 100) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = 'players_stat_slice_range'
    ) then
      alter table public.players
        add constraint players_stat_slice_range
        check (stat_slice between 0 and 100) not valid;
    end if;
  end if;
end $$;
