-- OPEN players user link fix.
-- Run this before `players_access_policies.sql` if Supabase says:
-- "column players.user_id does not exist".

alter table if exists public.players
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists email text,
  add column if not exists full_name text;

-- Backfill user_id for rows that already have an email value.
update public.players as players
set user_id = users.id
from auth.users as users
where players.user_id is null
  and players.email is not null
  and lower(players.email) = lower(users.email);

create unique index if not exists players_user_id_unique
  on public.players(user_id)
  where user_id is not null;
