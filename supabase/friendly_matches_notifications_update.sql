-- Friendly matches notifications.
-- Run after notifications_schema.sql and friendly_matches_schedule_update.sql.

CREATE OR REPLACE FUNCTION public.open_notify_friendly_match_schedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_time text;
  v_body text;
BEGIN
  IF NEW.status <> 'scheduled' THEN
    RETURN NEW;
  END IF;

  v_time := COALESCE(to_char(NEW.match_time, 'HH24:MI'), 'hora pendiente');
  v_body := format(
    'Tienes partido el %s a las %s en %s.',
    COALESCE(to_char(NEW.match_date, 'YYYY-MM-DD'), 'fecha pendiente'),
    v_time,
    COALESCE(NULLIF(NEW.court, ''), 'cancha pendiente')
  );

  INSERT INTO public.notifications (
    user_id,
    actor_user_id,
    player_id,
    club_id,
    type,
    title,
    body,
    href,
    metadata
  )
  SELECT user_id, NEW.created_by_user_id, player_id, NEW.club_id,
         'friendly_match_scheduled', 'Partido programado', v_body, '/matches',
         jsonb_build_object('match_id', NEW.id, 'match_type', NEW.match_type)
  FROM (
    VALUES
      (NEW.created_by_user_id, NEW.created_by_player_id),
      (NEW.opponent_user_id, NEW.opponent_player_id)
  ) AS targets(user_id, player_id)
  WHERE user_id IS NOT NULL;

  IF NEW.is_live_match AND NEW.judge_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      actor_user_id,
      player_id,
      club_id,
      type,
      title,
      body,
      href,
      metadata
    )
    VALUES (
      NEW.judge_user_id,
      NEW.created_by_user_id,
      NEW.judge_player_id,
      NEW.club_id,
      'friendly_match_judge',
      'Juez asignado',
      v_body,
      '/matches',
      jsonb_build_object('match_id', NEW.id, 'match_type', NEW.match_type)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_friendly_match_schedule ON public.friendly_matches;
CREATE TRIGGER trg_notify_friendly_match_schedule
  AFTER INSERT ON public.friendly_matches
  FOR EACH ROW EXECUTE FUNCTION public.open_notify_friendly_match_schedule();
