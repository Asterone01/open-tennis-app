-- Feed reactions update: adds fire + love counts, reaction_type column,
-- and updates the sync trigger.
-- Run after feed_schema.sql.

-- Add new reaction count columns to feed_posts
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS fire_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS love_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_url  text;

-- Add reaction_type to feed_likes (one reaction per user per post)
ALTER TABLE public.feed_likes
  ADD COLUMN IF NOT EXISTS reaction_type text NOT NULL DEFAULT 'like';

-- Update sync trigger to handle all reaction types
CREATE OR REPLACE FUNCTION public.feed_likes_count_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_col text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_col := CASE NEW.reaction_type
      WHEN 'fire' THEN 'fire_count'
      WHEN 'love' THEN 'love_count'
      ELSE 'likes_count'
    END;
    EXECUTE format('UPDATE public.feed_posts SET %I = %I + 1 WHERE id = $1', v_col, v_col)
      USING NEW.post_id;

  ELSIF TG_OP = 'DELETE' THEN
    v_col := CASE OLD.reaction_type
      WHEN 'fire' THEN 'fire_count'
      WHEN 'love' THEN 'love_count'
      ELSE 'likes_count'
    END;
    EXECUTE format('UPDATE public.feed_posts SET %I = GREATEST(%I - 1, 0) WHERE id = $1', v_col, v_col)
      USING OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_feed_likes_count ON public.feed_likes;
CREATE TRIGGER trg_feed_likes_count
  AFTER INSERT OR DELETE ON public.feed_likes
  FOR EACH ROW EXECUTE FUNCTION public.feed_likes_count_sync();

-- Enable Supabase Realtime for feed changes.
-- This is required for other profiles to see new posts/reaction counts without reloading.
ALTER TABLE public.feed_posts REPLICA IDENTITY FULL;
ALTER TABLE public.feed_likes REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_likes;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
