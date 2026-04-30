-- Add photo URL to courts table.
-- Run after courts_schema.sql.

ALTER TABLE public.courts
  ADD COLUMN IF NOT EXISTS photo_url text;
