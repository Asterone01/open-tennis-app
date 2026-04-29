-- OPEN player achievements / medals.
-- Run after players and notifications schemas.

create extension if not exists pgcrypto;

create table if not exists public.player_achievements (
  id            uuid        primary key default gen_random_uuid(),
  player_id     text        not null,
  user_id       uuid        references auth.users(id) on delete cascade,
  achievement_key text      not null,
  name          text        not null,
  description   text,
  rarity        text        not null default 'common', -- 'common', 'silver', 'gold'
  unlocked_at   timestamptz not null default now(),
  metadata      jsonb       not null default '{}'::jsonb,
  unique(player_id, achievement_key)
);

alter table public.player_achievements enable row level security;

create index if not exists player_achievements_player_idx
  on public.player_achievements(player_id);

create index if not exists player_achievements_user_idx
  on public.player_achievements(user_id);

drop policy if exists "Authenticated can read achievements"    on public.player_achievements;
drop policy if exists "Player can insert own achievements"     on public.player_achievements;
drop policy if exists "Player can delete own achievements"     on public.player_achievements;

-- Any authenticated user can read all achievements (public profile display)
create policy "Authenticated can read achievements"
  on public.player_achievements
  for select
  to authenticated
  using (true);

-- Players can insert their own achievements (client-side unlock)
create policy "Player can insert own achievements"
  on public.player_achievements
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Players can delete their own achievements (admin use only)
create policy "Player can delete own achievements"
  on public.player_achievements
  for delete
  to authenticated
  using (user_id = auth.uid());
