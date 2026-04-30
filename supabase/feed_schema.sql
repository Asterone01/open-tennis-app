-- Social feed & events board for OPEN.
-- Run after clubs_schema.sql, players_access_policies.sql,
-- and tournaments_schema.sql.

-- ─── Feed posts ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feed_posts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id      uuid        NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  author_id    uuid        NOT NULL REFERENCES auth.users(id)   ON DELETE CASCADE,
  author_name  text        NOT NULL,
  author_role  text        NOT NULL DEFAULT 'player', -- 'player' | 'coach' | 'manager'
  type         text        NOT NULL DEFAULT 'post',   -- 'post' | 'tournament_share' | 'event'
  content      text,
  -- tournament_share
  tournament_id uuid       REFERENCES public.tournaments(id) ON DELETE SET NULL,
  -- event
  event_title  text,
  event_date   timestamptz,
  event_location text,
  -- counters (denormalised for fast reads)
  likes_count  int         NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feed_posts_club_created_idx
  ON public.feed_posts(club_id, created_at DESC);

-- ─── Likes ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feed_likes (
  post_id    uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- Keep likes_count in sync
CREATE OR REPLACE FUNCTION public.feed_likes_count_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_feed_likes_count ON public.feed_likes;
CREATE TRIGGER trg_feed_likes_count
  AFTER INSERT OR DELETE ON public.feed_likes
  FOR EACH ROW EXECUTE FUNCTION public.feed_likes_count_sync();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE public.feed_posts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_likes  ENABLE ROW LEVEL SECURITY;

-- Posts: club members can read
DROP POLICY IF EXISTS "Club members read feed posts" ON public.feed_posts;
CREATE POLICY "Club members read feed posts"
  ON public.feed_posts FOR SELECT TO authenticated
  USING (
    club_id IN (
      SELECT club_id   FROM public.players WHERE user_id = auth.uid()
      UNION
      SELECT id        FROM public.clubs   WHERE manager_id = auth.uid()
    )
  );

-- Posts: coaches and managers can insert for their club
DROP POLICY IF EXISTS "Coaches and managers create feed posts" ON public.feed_posts;
CREATE POLICY "Coaches and managers create feed posts"
  ON public.feed_posts FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      -- is manager of this club
      EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND manager_id = auth.uid())
      -- is a coach in this club
      OR EXISTS (SELECT 1 FROM public.players WHERE user_id = auth.uid() AND club_id = feed_posts.club_id AND is_coach = true)
    )
  );

-- Posts: author can delete own posts
DROP POLICY IF EXISTS "Authors delete own posts" ON public.feed_posts;
CREATE POLICY "Authors delete own posts"
  ON public.feed_posts FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Likes: anyone in the club can read
DROP POLICY IF EXISTS "Club members read likes" ON public.feed_likes;
CREATE POLICY "Club members read likes"
  ON public.feed_likes FOR SELECT TO authenticated
  USING (
    post_id IN (
      SELECT id FROM public.feed_posts
       WHERE club_id IN (
         SELECT club_id FROM public.players WHERE user_id = auth.uid()
         UNION
         SELECT id     FROM public.clubs    WHERE manager_id = auth.uid()
       )
    )
  );

-- Likes: authenticated users can like
DROP POLICY IF EXISTS "Users like posts" ON public.feed_likes;
CREATE POLICY "Users like posts"
  ON public.feed_likes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Likes: users can unlike (delete their own)
DROP POLICY IF EXISTS "Users unlike posts" ON public.feed_likes;
CREATE POLICY "Users unlike posts"
  ON public.feed_likes FOR DELETE TO authenticated
  USING (user_id = auth.uid());
