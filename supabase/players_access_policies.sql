-- OPEN players access policies for cross-role flows.
-- Run after the players table exists.

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
  using (
    exists (
      select 1
      from public.players coach_profile
      where coach_profile.user_id = auth.uid()
        and coach_profile.is_coach = true
    )
    or auth.jwt() -> 'user_metadata' ->> 'role' = 'coach'
  )
  with check (true);
