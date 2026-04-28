-- OPEN players user link fix.
-- Run this before `players_access_policies.sql` if Supabase says:
-- "column players.user_id does not exist".

create extension if not exists pgcrypto;

alter table if exists public.players
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists email text,
  add column if not exists full_name text;

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

-- Backfill user_id for rows that already have an email value.
update public.players as players
set user_id = users.id
from auth.users as users
where players.user_id is null
  and players.email is not null
  and lower(players.email) = lower(users.email);

drop index if exists public.players_user_id_unique;

create unique index players_user_id_unique
  on public.players(user_id);
