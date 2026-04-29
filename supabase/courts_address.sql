-- Add address field to courts table.
alter table public.courts
  add column if not exists address text;
