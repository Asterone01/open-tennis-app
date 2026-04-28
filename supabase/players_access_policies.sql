-- OPEN players access policies for cross-role flows.
-- Run after the players table exists.

create extension if not exists pgcrypto;

alter table if exists public.players
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists player_card_color text,
  add column if not exists role text default 'player',
  add column if not exists sex text,
  add column if not exists birth_date date,
  add column if not exists age_group text,
  add column if not exists suggested_category text,
  add column if not exists current_category text,
  add column if not exists years_playing integer not null default 0,
  add column if not exists xp integer not null default 0,
  add column if not exists level integer not null default 1,
  add column if not exists rating integer not null default 1000,
  add column if not exists current_streak integer not null default 0,
  add column if not exists last_activity_date date,
  add column if not exists stat_derecha integer not null default 50,
  add column if not exists stat_reves integer not null default 50,
  add column if not exists stat_saque integer not null default 50,
  add column if not exists stat_volea integer not null default 50,
  add column if not exists stat_movilidad integer not null default 50,
  add column if not exists stat_slice integer not null default 50,
  add column if not exists club_id uuid references public.clubs(id) on delete set null,
  add column if not exists is_coach boolean not null default false,
  add column if not exists club_membership_status text not null default 'unassigned',
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz;

do $$
declare
  id_data_type text;
begin
  select data_type
  into id_data_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'players'
    and column_name = 'id';

  if id_data_type = 'uuid' then
    alter table public.players alter column id set default gen_random_uuid();
  elsif id_data_type in ('text', 'character varying') then
    alter table public.players alter column id set default gen_random_uuid()::text;
  elsif id_data_type in ('integer', 'bigint', 'smallint') then
    create sequence if not exists public.players_id_seq;
    perform setval(
      'public.players_id_seq',
      coalesce((select max(id)::bigint from public.players), 0) + 1,
      false
    );
    alter table public.players alter column id set default nextval('public.players_id_seq');
  end if;
end $$;

update public.players as players
set user_id = users.id
from auth.users as users
where players.user_id is null
  and players.email is not null
  and lower(players.email) = lower(users.email);

drop index if exists public.players_user_id_unique;

create unique index players_user_id_unique
  on public.players(user_id);

create index if not exists players_club_id_idx
  on public.players(club_id);

create index if not exists players_is_coach_idx
  on public.players(is_coach);

create index if not exists players_age_group_idx
  on public.players(age_group);

create index if not exists players_current_category_idx
  on public.players(current_category);

create index if not exists players_club_membership_status_idx
  on public.players(club_membership_status);

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

alter table if exists public.players enable row level security;

drop policy if exists "Authenticated users can read players" on public.players;
drop policy if exists "Players can insert own player row" on public.players;
drop policy if exists "Players can update own player row" on public.players;
drop policy if exists "Managers can update players in their club" on public.players;
drop policy if exists "Coaches can update player evaluations" on public.players;
drop policy if exists "Coaches can update players in their club" on public.players;

create policy "Authenticated users can read players"
  on public.players
  for select
  to authenticated
  using (true);

create policy "Players can insert own player row"
  on public.players
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Players can update own player row"
  on public.players
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Managers can update players in their club"
  on public.players
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.clubs
      where clubs.manager_id = auth.uid()
        and (
          players.club_id is null
          or players.club_id = clubs.id
        )
    )
  )
  with check (
    exists (
      select 1
      from public.clubs
      where clubs.manager_id = auth.uid()
        and (
          players.club_id is null
          or players.club_id = clubs.id
        )
    )
  );

create policy "Coaches can update players in their club"
  on public.players
  for update
  to authenticated
  using (
    public.open_is_coach()
    and (
      players.user_id = auth.uid()
      or (
        public.open_user_club_id() is not null
        and (
          players.club_id is null
          or players.club_id = public.open_user_club_id()
        )
      )
    )
  )
  with check (
    public.open_is_coach()
    and (
      players.user_id = auth.uid()
      or (
        public.open_user_club_id() is not null
        and (
          players.club_id is null
          or players.club_id = public.open_user_club_id()
        )
      )
    )
  );
