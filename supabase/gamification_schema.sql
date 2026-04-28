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

create extension if not exists pgcrypto;

create or replace function public.open_is_coach()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'coach'
    or exists (
      select 1
      from public.players
      where players.user_id = auth.uid()
        and players.is_coach = true
    );
$$;

grant execute on function public.open_is_coach() to authenticated;

create or replace function public.open_user_club_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select players.club_id
  from public.players
  where players.user_id = auth.uid()
  limit 1;
$$;

grant execute on function public.open_user_club_id() to authenticated;

create table if not exists public.xp_history (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  amount integer not null,
  source text not null,
  source_id text,
  label text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint xp_history_amount_positive check (amount > 0)
);

alter table public.xp_history enable row level security;

create index if not exists xp_history_player_id_idx
  on public.xp_history(player_id, created_at desc);

create index if not exists xp_history_user_id_idx
  on public.xp_history(user_id, created_at desc);

create index if not exists xp_history_club_id_idx
  on public.xp_history(club_id, created_at desc);

drop policy if exists "Users can read own XP history" on public.xp_history;
drop policy if exists "Coaches and managers can insert XP history" on public.xp_history;

create policy "Users can read own XP history"
  on public.xp_history
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.players
      where players.user_id = auth.uid()
        and players.id::text = xp_history.player_id
    )
    or (
      club_id is not null
      and public.open_is_coach()
      and club_id = public.open_user_club_id()
    )
    or exists (
      select 1
      from public.clubs
      where clubs.manager_id = auth.uid()
        and clubs.id = xp_history.club_id
    )
  );

create policy "Coaches and managers can insert XP history"
  on public.xp_history
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and (
      user_id = auth.uid()
      or (
        club_id is not null
        and public.open_is_coach()
        and club_id = public.open_user_club_id()
      )
      or exists (
        select 1
        from public.clubs
        where clubs.manager_id = auth.uid()
          and clubs.id = xp_history.club_id
      )
    )
  );

create table if not exists public.streaks (
  id uuid primary key default gen_random_uuid(),
  player_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  club_id uuid references public.clubs(id) on delete set null,
  streak_type text not null,
  current_count integer not null default 0,
  max_record integer not null default 0,
  last_activity_date date,
  status text not null default 'active',
  reset_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint streaks_current_count_non_negative check (current_count >= 0),
  constraint streaks_max_record_non_negative check (max_record >= 0),
  constraint streaks_unique_player_type unique (player_id, streak_type)
);

alter table public.streaks enable row level security;

create index if not exists streaks_player_id_idx
  on public.streaks(player_id);

create index if not exists streaks_club_id_idx
  on public.streaks(club_id);

drop policy if exists "Users can read own streaks" on public.streaks;
drop policy if exists "Coaches and managers can manage streaks" on public.streaks;

create policy "Users can read own streaks"
  on public.streaks
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.players
      where players.user_id = auth.uid()
        and players.id::text = streaks.player_id
    )
    or (
      club_id is not null
      and public.open_is_coach()
      and club_id = public.open_user_club_id()
    )
    or exists (
      select 1
      from public.clubs
      where clubs.manager_id = auth.uid()
        and clubs.id = streaks.club_id
    )
  );

create policy "Coaches and managers can manage streaks"
  on public.streaks
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
        and clubs.id = streaks.club_id
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
        and clubs.id = streaks.club_id
    )
  );
