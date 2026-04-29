-- OPEN live match columns — add real-time judging support to friendly_matches.
-- Run after friendly_matches_schema.sql.

alter table public.friendly_matches
  add column if not exists live_state    jsonb,
  add column if not exists judge_user_id uuid references auth.users(id) on delete set null,
  add column if not exists judge_player_id text;

-- Allow the assigned judge to update live_state on a live match
drop policy if exists "Judge can update live state" on public.friendly_matches;

create policy "Judge can update live state"
  on public.friendly_matches
  for update
  to authenticated
  using (judge_user_id = auth.uid())
  with check (judge_user_id = auth.uid());
