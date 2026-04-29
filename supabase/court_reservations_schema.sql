-- OPEN court reservations system.
-- Run after courts_schema.sql and courts_address.sql.

-- Pricing + schedule columns on courts
alter table public.courts
  add column if not exists price_per_hour    decimal(10,2) not null default 0,
  add column if not exists peak_price_per_hour decimal(10,2),
  add column if not exists peak_start        time,
  add column if not exists peak_end          time,
  add column if not exists requires_payment  boolean not null default false,
  add column if not exists auto_confirm      boolean not null default true,
  add column if not exists open_time         time not null default '07:00',
  add column if not exists close_time        time not null default '22:00',
  add column if not exists closed_days       int[] not null default '{}';

-- court_reservations: one row per 1-hour slot
create table if not exists public.court_reservations (
  id               uuid        primary key default gen_random_uuid(),
  court_id         uuid        not null references public.courts(id)  on delete cascade,
  club_id          uuid        not null references public.clubs(id)   on delete cascade,
  player_id        text        not null,
  user_id          uuid        references auth.users(id)              on delete set null,
  reservation_date date        not null,
  start_time       time        not null,
  end_time         time        not null,
  duration_hours   int         not null default 1,
  total_price      decimal(10,2) not null default 0,
  status           text        not null default 'pending',  -- pending | confirmed | cancelled
  payment_status   text        not null default 'free',     -- free | pending | paid
  notes            text,
  created_at       timestamptz not null default now(),
  unique(court_id, reservation_date, start_time)
);

alter table public.court_reservations enable row level security;

create index if not exists reservations_court_date_idx
  on public.court_reservations(court_id, reservation_date);

create index if not exists reservations_player_idx
  on public.court_reservations(player_id);

create index if not exists reservations_club_date_idx
  on public.court_reservations(club_id, reservation_date desc);

drop policy if exists "Club members can read reservations"   on public.court_reservations;
drop policy if exists "Players can create own reservations"  on public.court_reservations;
drop policy if exists "Players can cancel own reservations"  on public.court_reservations;
drop policy if exists "Manager can manage all reservations"  on public.court_reservations;

create policy "Club members can read reservations"
  on public.court_reservations for select to authenticated
  using (
    club_id in (
      select club_id from public.players where user_id = auth.uid() and club_id is not null
      union
      select id from public.clubs where manager_id = auth.uid()
    )
  );

create policy "Players can create own reservations"
  on public.court_reservations for insert to authenticated
  with check (user_id = auth.uid());

create policy "Players can cancel own reservations"
  on public.court_reservations for update to authenticated
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Manager can manage all reservations"
  on public.court_reservations for all to authenticated
  using  (club_id in (select id from public.clubs where manager_id = auth.uid()))
  with check (club_id in (select id from public.clubs where manager_id = auth.uid()));
