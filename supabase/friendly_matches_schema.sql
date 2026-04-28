-- OPEN friendly matches.
-- Run after players, clubs, and gamification_schema.sql.

create extension if not exists pgcrypto;

alter table if exists public.players
  add column if not exists match_aces integer not null default 0,
  add column if not exists match_double_faults integer not null default 0,
  add column if not exists match_winners integer not null default 0,
  add column if not exists match_unforced_errors integer not null default 0,
  add column if not exists match_forced_errors integer not null default 0,
  add column if not exists match_points integer not null default 0,
  add column if not exists match_points_against integer not null default 0;

create table if not exists public.friendly_matches (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references public.clubs(id) on delete set null,
  created_by_player_id text not null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  opponent_player_id text not null,
  opponent_user_id uuid references auth.users(id) on delete set null,
  winner_player_id text not null,
  match_type text not null default 'singles',
  match_date date not null default current_date,
  court text,
  score text not null,
  score_sets jsonb not null default '[]'::jsonb,
  has_live_judge boolean not null default false,
  is_live_match boolean not null default false,
  creator_stats jsonb not null default '{}'::jsonb,
  opponent_stats jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  confirmed_at timestamptz,
  rejected_at timestamptz,
  xp_awarded boolean not null default false,
  created_at timestamptz not null default now(),
  constraint friendly_matches_type_check
    check (match_type in ('singles')),
  constraint friendly_matches_status_check
    check (status in ('pending', 'confirmed', 'rejected', 'expired')),
  constraint friendly_matches_distinct_players
    check (created_by_player_id <> opponent_player_id)
);

alter table if exists public.friendly_matches
  add column if not exists club_id uuid references public.clubs(id) on delete set null,
  add column if not exists created_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists opponent_user_id uuid references auth.users(id) on delete set null,
  add column if not exists score_sets jsonb not null default '[]'::jsonb,
  add column if not exists has_live_judge boolean not null default false,
  add column if not exists is_live_match boolean not null default false,
  add column if not exists creator_stats jsonb not null default '{}'::jsonb,
  add column if not exists opponent_stats jsonb not null default '{}'::jsonb,
  add column if not exists confirmed_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists xp_awarded boolean not null default false;

alter table public.friendly_matches enable row level security;

create index if not exists friendly_matches_club_date_idx
  on public.friendly_matches(club_id, match_date desc);

create index if not exists friendly_matches_created_by_idx
  on public.friendly_matches(created_by_player_id, match_date desc);

create index if not exists friendly_matches_opponent_idx
  on public.friendly_matches(opponent_player_id, match_date desc);

create index if not exists friendly_matches_status_idx
  on public.friendly_matches(status);

drop policy if exists "Players can read their friendly matches" on public.friendly_matches;
drop policy if exists "Players can create friendly matches" on public.friendly_matches;
drop policy if exists "Players can update their pending friendly matches" on public.friendly_matches;
drop policy if exists "Club staff can read friendly matches" on public.friendly_matches;

create policy "Players can read their friendly matches"
  on public.friendly_matches
  for select
  to authenticated
  using (
    created_by_user_id = auth.uid()
    or opponent_user_id = auth.uid()
    or exists (
      select 1
      from public.players
      where players.user_id = auth.uid()
        and (
          players.id::text = friendly_matches.created_by_player_id
          or players.id::text = friendly_matches.opponent_player_id
        )
    )
  );

create policy "Club staff can read friendly matches"
  on public.friendly_matches
  for select
  to authenticated
  using (
    club_id is not null
    and (
      (
        public.open_is_coach()
        and club_id = public.open_user_club_id()
      )
      or exists (
        select 1
        from public.clubs
        where clubs.manager_id = auth.uid()
          and clubs.id = friendly_matches.club_id
      )
    )
  );

create policy "Players can create friendly matches"
  on public.friendly_matches
  for insert
  to authenticated
  with check (
    created_by_user_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1
      from public.players
      where players.user_id = auth.uid()
        and players.id::text = friendly_matches.created_by_player_id
    )
  );

create policy "Players can update their pending friendly matches"
  on public.friendly_matches
  for update
  to authenticated
  using (
    status = 'pending'
    and (
      created_by_user_id = auth.uid()
      or opponent_user_id = auth.uid()
    )
  )
  with check (
    created_by_user_id = auth.uid()
    or opponent_user_id = auth.uid()
  );

create or replace function public.open_touch_player_streak(
  target_player_id text,
  target_user_id uuid,
  target_club_id uuid,
  target_streak_type text,
  activity_date date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.streaks (
    player_id,
    user_id,
    club_id,
    streak_type,
    current_count,
    max_record,
    last_activity_date,
    status,
    reset_date,
    updated_at
  )
  values (
    target_player_id,
    target_user_id,
    target_club_id,
    target_streak_type,
    1,
    1,
    activity_date,
    'active',
    null,
    now()
  )
  on conflict (player_id, streak_type) do update
  set
    current_count = case
      when public.streaks.last_activity_date = activity_date then public.streaks.current_count
      when public.streaks.last_activity_date = activity_date - 1 then public.streaks.current_count + 1
      else 1
    end,
    max_record = greatest(
      public.streaks.max_record,
      case
        when public.streaks.last_activity_date = activity_date then public.streaks.current_count
        when public.streaks.last_activity_date = activity_date - 1 then public.streaks.current_count + 1
        else 1
      end
    ),
    last_activity_date = activity_date,
    status = 'active',
    reset_date = null,
    updated_at = now();
end;
$$;

grant execute on function public.open_touch_player_streak(text, uuid, uuid, text, date) to authenticated;

create or replace function public.open_reset_player_streak(
  target_player_id text,
  target_user_id uuid,
  target_club_id uuid,
  target_streak_type text,
  activity_date date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.streaks (
    player_id,
    user_id,
    club_id,
    streak_type,
    current_count,
    max_record,
    last_activity_date,
    status,
    reset_date,
    updated_at
  )
  values (
    target_player_id,
    target_user_id,
    target_club_id,
    target_streak_type,
    0,
    0,
    activity_date,
    'broken',
    activity_date,
    now()
  )
  on conflict (player_id, streak_type) do update
  set
    current_count = 0,
    last_activity_date = activity_date,
    status = 'broken',
    reset_date = activity_date,
    updated_at = now();
end;
$$;

grant execute on function public.open_reset_player_streak(text, uuid, uuid, text, date) to authenticated;

create or replace function public.open_confirm_friendly_match(match_id uuid)
returns public.friendly_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  match_record public.friendly_matches;
  creator_player public.players;
  opponent_player public.players;
  winner_player public.players;
  loser_player public.players;
  winner_xp integer;
  loser_xp integer;
  judge_bonus integer;
  winner_stats jsonb;
  loser_stats jsonb;
begin
  select *
  into match_record
  from public.friendly_matches
  where id = match_id
  for update;

  if not found then
    raise exception 'Match not found';
  end if;

  if match_record.status <> 'pending' then
    raise exception 'Match is not pending';
  end if;

  if match_record.opponent_user_id <> auth.uid() then
    raise exception 'Only the opponent can confirm this match';
  end if;

  select *
  into creator_player
  from public.players
  where id::text = match_record.created_by_player_id;

  select *
  into opponent_player
  from public.players
  where id::text = match_record.opponent_player_id;

  if creator_player.id is null or opponent_player.id is null then
    raise exception 'Match players not found';
  end if;

  if match_record.winner_player_id = creator_player.id::text then
    winner_player := creator_player;
    loser_player := opponent_player;
  elsif match_record.winner_player_id = opponent_player.id::text then
    winner_player := opponent_player;
    loser_player := creator_player;
  else
    raise exception 'Winner does not belong to this match';
  end if;

  judge_bonus := case when match_record.has_live_judge or match_record.is_live_match then 15 else 0 end;
  winner_xp := 30 + 20 + judge_bonus;
  loser_xp := 30 + 10 + judge_bonus;

  if winner_player.id::text = match_record.created_by_player_id then
    winner_stats := match_record.creator_stats;
    loser_stats := match_record.opponent_stats;
  else
    winner_stats := match_record.opponent_stats;
    loser_stats := match_record.creator_stats;
  end if;

  update public.players
  set
    xp = coalesce(xp, 0) + winner_xp,
    level = floor(0.2 * sqrt(coalesce(xp, 0) + winner_xp)) + 1,
    last_activity_date = current_date,
    match_aces = coalesce(match_aces, 0) + coalesce((winner_stats ->> 'aces')::integer, 0),
    match_double_faults = coalesce(match_double_faults, 0) + coalesce((winner_stats ->> 'double_faults')::integer, 0),
    match_winners = coalesce(match_winners, 0) + coalesce((winner_stats ->> 'winners')::integer, 0),
    match_unforced_errors = coalesce(match_unforced_errors, 0) + coalesce((winner_stats ->> 'unforced_errors')::integer, 0),
    match_forced_errors = coalesce(match_forced_errors, 0) + coalesce((winner_stats ->> 'forced_errors')::integer, 0),
    match_points = coalesce(match_points, 0) + coalesce((winner_stats ->> 'match_points')::integer, 0),
    match_points_against = coalesce(match_points_against, 0) + coalesce((winner_stats ->> 'points_against')::integer, 0)
  where id::text = winner_player.id::text;

  update public.players
  set
    xp = coalesce(xp, 0) + loser_xp,
    level = floor(0.2 * sqrt(coalesce(xp, 0) + loser_xp)) + 1,
    last_activity_date = current_date,
    match_aces = coalesce(match_aces, 0) + coalesce((loser_stats ->> 'aces')::integer, 0),
    match_double_faults = coalesce(match_double_faults, 0) + coalesce((loser_stats ->> 'double_faults')::integer, 0),
    match_winners = coalesce(match_winners, 0) + coalesce((loser_stats ->> 'winners')::integer, 0),
    match_unforced_errors = coalesce(match_unforced_errors, 0) + coalesce((loser_stats ->> 'unforced_errors')::integer, 0),
    match_forced_errors = coalesce(match_forced_errors, 0) + coalesce((loser_stats ->> 'forced_errors')::integer, 0),
    match_points = coalesce(match_points, 0) + coalesce((loser_stats ->> 'match_points')::integer, 0),
    match_points_against = coalesce(match_points_against, 0) + coalesce((loser_stats ->> 'points_against')::integer, 0)
  where id::text = loser_player.id::text;

  insert into public.xp_history (
    player_id,
    user_id,
    club_id,
    amount,
    source,
    source_id,
    label,
    description,
    metadata,
    created_by
  )
  values
    (
      winner_player.id::text,
      winner_player.user_id,
      match_record.club_id,
      winner_xp,
      'match_win',
      match_record.id::text,
      'Victoria amistosa',
      match_record.score,
      jsonb_build_object(
        'friendly_match_id', match_record.id,
        'score', match_record.score,
        'score_sets', match_record.score_sets,
        'stats', winner_stats
      ),
      auth.uid()
    ),
    (
      loser_player.id::text,
      loser_player.user_id,
      match_record.club_id,
      loser_xp,
      'match_loss',
      match_record.id::text,
      'Partido amistoso',
      match_record.score,
      jsonb_build_object(
        'friendly_match_id', match_record.id,
        'score', match_record.score,
        'score_sets', match_record.score_sets,
        'stats', loser_stats
      ),
      auth.uid()
    );

  perform public.open_touch_player_streak(
    winner_player.id::text,
    winner_player.user_id,
    match_record.club_id,
    'matches',
    match_record.match_date
  );

  perform public.open_touch_player_streak(
    loser_player.id::text,
    loser_player.user_id,
    match_record.club_id,
    'matches',
    match_record.match_date
  );

  perform public.open_touch_player_streak(
    winner_player.id::text,
    winner_player.user_id,
    match_record.club_id,
    'wins',
    match_record.match_date
  );

  perform public.open_reset_player_streak(
    winner_player.id::text,
    winner_player.user_id,
    match_record.club_id,
    'losses',
    match_record.match_date
  );

  perform public.open_touch_player_streak(
    loser_player.id::text,
    loser_player.user_id,
    match_record.club_id,
    'losses',
    match_record.match_date
  );

  perform public.open_reset_player_streak(
    loser_player.id::text,
    loser_player.user_id,
    match_record.club_id,
    'wins',
    match_record.match_date
  );

  update public.friendly_matches
  set
    status = 'confirmed',
    confirmed_at = now(),
    xp_awarded = true
  where id = match_record.id
  returning * into match_record;

  return match_record;
end;
$$;

grant execute on function public.open_confirm_friendly_match(uuid) to authenticated;
