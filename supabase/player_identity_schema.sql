-- OPEN player identity, category, and club membership fields.
-- Run after `clubs_schema.sql` and before testing onboarding.

alter table if exists public.players
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists player_card_color text,
  add column if not exists age_group text,
  add column if not exists suggested_category text,
  add column if not exists current_category text,
  add column if not exists club_membership_status text not null default 'unassigned',
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz;

do $$
begin
  if to_regclass('public.players') is not null then
    if not exists (
      select 1 from pg_constraint
      where conname = 'players_age_group_allowed'
    ) then
      alter table public.players
        add constraint players_age_group_allowed
        check (
          age_group is null
          or age_group in ('junior', 'juvenil', 'adulto', 'senior')
        ) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = 'players_suggested_category_allowed'
    ) then
      alter table public.players
        add constraint players_suggested_category_allowed
        check (
          suggested_category is null
          or suggested_category in ('D', 'C', 'B', 'A', 'Pro')
        ) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = 'players_current_category_allowed'
    ) then
      alter table public.players
        add constraint players_current_category_allowed
        check (
          current_category is null
          or current_category in ('D', 'C', 'B', 'A', 'Pro')
        ) not valid;
    end if;

    if not exists (
      select 1 from pg_constraint
      where conname = 'players_club_membership_status_allowed'
    ) then
      alter table public.players
        add constraint players_club_membership_status_allowed
        check (
          club_membership_status in (
            'unassigned',
            'pending',
            'approved',
            'rejected'
          )
        ) not valid;
    end if;
  end if;
end $$;

create index if not exists players_age_group_idx
  on public.players(age_group);

create index if not exists players_current_category_idx
  on public.players(current_category);

create index if not exists players_club_membership_status_idx
  on public.players(club_membership_status);
