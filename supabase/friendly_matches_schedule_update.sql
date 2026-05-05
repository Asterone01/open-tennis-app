-- Friendly matches scheduling + doubles support.
-- Run after friendly_matches_schema.sql.

alter table public.friendly_matches
  alter column winner_player_id drop not null,
  alter column score drop not null,
  add column if not exists match_time time;

alter table public.friendly_matches
  drop constraint if exists friendly_matches_type_check,
  add constraint friendly_matches_type_check
    check (match_type in ('singles', 'doubles'));

alter table public.friendly_matches
  drop constraint if exists friendly_matches_status_check,
  add constraint friendly_matches_status_check
    check (status in ('scheduled', 'pending', 'confirmed', 'rejected', 'expired'));

create index if not exists friendly_matches_club_datetime_idx
  on public.friendly_matches(club_id, match_date desc, match_time desc);
