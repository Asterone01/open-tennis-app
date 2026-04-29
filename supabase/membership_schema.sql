-- OPEN club membership identity and payment metadata.
-- Run after players_access_policies.sql.

create extension if not exists pgcrypto;

alter table if exists public.players
  add column if not exists membership_id text,
  add column if not exists membership_since date,
  add column if not exists membership_plan text not null default 'standard',
  add column if not exists membership_payment_status text not null default 'unknown',
  add column if not exists membership_next_payment_date date,
  add column if not exists membership_last_payment_date date,
  add column if not exists membership_notes text;

update public.players
set membership_id = 'OPEN-' || upper(substr(md5(id::text), 1, 8))
where membership_id is null;

update public.players
set membership_since = current_date
where membership_since is null
  and club_id is not null;

update public.players
set membership_payment_status = 'pending'
where membership_payment_status = 'unknown'
  and club_id is not null;

create unique index if not exists players_membership_id_unique
  on public.players(membership_id);

create index if not exists players_membership_next_payment_idx
  on public.players(membership_next_payment_date);

create index if not exists players_membership_payment_status_idx
  on public.players(membership_payment_status);
