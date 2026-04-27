-- OPEN players access policies for cross-role flows.
-- Run after the players table exists.

alter table if exists public.players
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists club_id uuid references public.clubs(id) on delete set null,
  add column if not exists is_coach boolean not null default false;

update public.players as players
set user_id = users.id
from auth.users as users
where players.user_id is null
  and players.email is not null
  and lower(players.email) = lower(users.email);

create unique index if not exists players_user_id_unique
  on public.players(user_id)
  where user_id is not null;

create index if not exists players_club_id_idx
  on public.players(club_id);

create index if not exists players_is_coach_idx
  on public.players(is_coach);

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

alter table if exists public.players enable row level security;

drop policy if exists "Authenticated users can read players" on public.players;
drop policy if exists "Players can insert own player row" on public.players;
drop policy if exists "Players can update own player row" on public.players;
drop policy if exists "Managers can update players in their club" on public.players;
drop policy if exists "Coaches can update player evaluations" on public.players;

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

create policy "Coaches can update player evaluations"
  on public.players
  for update
  to authenticated
  using (public.open_is_coach())
  with check (public.open_is_coach());
