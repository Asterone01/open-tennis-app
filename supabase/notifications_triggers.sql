-- Live notification triggers for OPEN.
-- Run after notifications_schema.sql, courts_schema.sql,
-- court_reservations_schema.sql, and tournaments_schema.sql.

-- ─── Helper: allow service triggers to bypass RLS ────────────────────────────

-- Reservation → notify manager + player
CREATE OR REPLACE FUNCTION public.open_notify_reservation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_manager_id uuid;
  v_court_name  text;
  v_player_name text;
BEGIN
  SELECT co.name, cl.manager_id
    INTO v_court_name, v_manager_id
    FROM public.courts co
    JOIN public.clubs  cl ON cl.id = co.club_id
   WHERE co.id = NEW.court_id;

  SELECT full_name INTO v_player_name
    FROM public.players WHERE user_id = NEW.user_id;

  -- Notify manager
  IF v_manager_id IS NOT NULL AND v_manager_id IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO public.notifications
      (user_id, actor_user_id, club_id, type, title, body, href, metadata)
    VALUES (
      v_manager_id, NEW.user_id, NEW.club_id,
      'reservation_new',
      'Nueva reserva — ' || COALESCE(v_court_name, 'Cancha'),
      COALESCE(v_player_name, 'Un jugador') || ' · '
        || NEW.reservation_date::text || ' · '
        || NEW.start_time::text,
      '/canchas',
      jsonb_build_object('reservation_id', NEW.id, 'court_id', NEW.court_id)
    );
  END IF;

  -- Notify player
  INSERT INTO public.notifications
    (user_id, actor_user_id, club_id, type, title, body, href, metadata)
  VALUES (
    NEW.user_id, NEW.user_id, NEW.club_id,
    'reservation_created',
    CASE WHEN NEW.status = 'confirmed'
         THEN 'Reserva confirmada'
         ELSE 'Reserva pendiente de aprobación'
    END,
    COALESCE(v_court_name, 'Cancha') || ' · '
      || NEW.reservation_date::text || ' '
      || NEW.start_time::text || '–' || NEW.end_time::text,
    '/canchas',
    jsonb_build_object('reservation_id', NEW.id)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_reservation ON public.court_reservations;
CREATE TRIGGER trg_notify_reservation
  AFTER INSERT ON public.court_reservations
  FOR EACH ROW EXECUTE FUNCTION public.open_notify_reservation();

-- ─── Reservation status change → notify player ───────────────────────────────

CREATE OR REPLACE FUNCTION public.open_notify_reservation_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_court_name text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  SELECT name INTO v_court_name FROM public.courts WHERE id = NEW.court_id;

  INSERT INTO public.notifications
    (user_id, actor_user_id, club_id, type, title, body, href, metadata)
  VALUES (
    NEW.user_id, NEW.user_id, NEW.club_id,
    'reservation_status_' || NEW.status,
    CASE NEW.status
      WHEN 'confirmed'  THEN 'Reserva confirmada'
      WHEN 'cancelled'  THEN 'Reserva cancelada'
      ELSE 'Reserva actualizada'
    END,
    COALESCE(v_court_name, 'Cancha') || ' · '
      || NEW.reservation_date::text || ' '
      || NEW.start_time::text || '–' || NEW.end_time::text,
    '/canchas',
    jsonb_build_object('reservation_id', NEW.id, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_reservation_status ON public.court_reservations;
CREATE TRIGGER trg_notify_reservation_status
  AFTER UPDATE OF status ON public.court_reservations
  FOR EACH ROW EXECUTE FUNCTION public.open_notify_reservation_status();

-- ─── Tournament entry → notify player + manager ──────────────────────────────

CREATE OR REPLACE FUNCTION public.open_notify_tournament_entry()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tournament_name text;
  v_club_id         uuid;
  v_manager_id      uuid;
  v_player_name     text;
BEGIN
  SELECT t.title, t.club_id, cl.manager_id
    INTO v_tournament_name, v_club_id, v_manager_id
    FROM public.tournaments t
    JOIN public.clubs cl ON cl.id = t.club_id
   WHERE t.id = NEW.tournament_id;

  SELECT full_name INTO v_player_name
    FROM public.players WHERE user_id = NEW.user_id;

  -- Notify player
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications
      (user_id, actor_user_id, club_id, type, title, body, href, metadata)
    VALUES (
      NEW.user_id, NEW.user_id, v_club_id,
      'tournament_registered',
      'Inscrito — ' || COALESCE(v_tournament_name, 'Torneo'),
      '¡Estás en la lista! Buena suerte.',
      '/tournaments',
      jsonb_build_object('tournament_id', NEW.tournament_id)
    );
  END IF;

  -- Notify manager
  IF v_manager_id IS NOT NULL AND v_manager_id IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO public.notifications
      (user_id, actor_user_id, club_id, type, title, body, href, metadata)
    VALUES (
      v_manager_id, NEW.user_id, v_club_id,
      'tournament_entry_new',
      'Nueva inscripción — ' || COALESCE(v_tournament_name, 'Torneo'),
      COALESCE(v_player_name, 'Un jugador') || ' se inscribió',
      '/tournaments',
      jsonb_build_object('tournament_id', NEW.tournament_id, 'entry_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_tournament_entry ON public.tournament_entries;
CREATE TRIGGER trg_notify_tournament_entry
  AFTER INSERT ON public.tournament_entries
  FOR EACH ROW EXECUTE FUNCTION public.open_notify_tournament_entry();

-- ─── Membership status change → notify player ────────────────────────────────

CREATE OR REPLACE FUNCTION public.open_notify_membership_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.club_membership_status IS NOT DISTINCT FROM NEW.club_membership_status THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notifications
    (user_id, actor_user_id, club_id, type, title, body, href, metadata)
  VALUES (
    NEW.user_id, NEW.user_id, NEW.club_id,
    'membership_' || COALESCE(NEW.club_membership_status, 'changed'),
    CASE NEW.club_membership_status
      WHEN 'approved' THEN 'Membresía aprobada'
      WHEN 'rejected' THEN 'Membresía rechazada'
      WHEN 'pending'  THEN 'Solicitud enviada'
      ELSE 'Membresía actualizada'
    END,
    CASE NEW.club_membership_status
      WHEN 'approved' THEN 'Ya eres miembro del club. ¡Bienvenido!'
      WHEN 'rejected' THEN 'Tu solicitud no fue aprobada. Contacta al manager.'
      ELSE NULL
    END,
    '/profile',
    jsonb_build_object('status', NEW.club_membership_status)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_membership ON public.players;
CREATE TRIGGER trg_notify_membership
  AFTER UPDATE OF club_membership_status ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.open_notify_membership_change();

-- ─── Feed post → notify club members for events/tournament shares ─────────────

CREATE OR REPLACE FUNCTION public.open_notify_feed_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NEW.type NOT IN ('tournament_share', 'event') THEN RETURN NEW; END IF;

  FOR v_user_id IN
    SELECT user_id FROM public.players
     WHERE club_id = NEW.club_id
       AND user_id IS NOT NULL
       AND user_id IS DISTINCT FROM NEW.author_id
  LOOP
    INSERT INTO public.notifications
      (user_id, actor_user_id, club_id, type, title, body, href, metadata)
    VALUES (
      v_user_id, NEW.author_id, NEW.club_id,
      'feed_' || NEW.type,
      CASE NEW.type
        WHEN 'tournament_share' THEN 'Torneo compartido: ' || COALESCE(NEW.event_title, NEW.content, 'Nuevo torneo')
        WHEN 'event'            THEN 'Nuevo evento: ' || COALESCE(NEW.event_title, 'Ver feed')
      END,
      CASE NEW.type
        WHEN 'tournament_share' THEN NEW.author_name || ' compartió un torneo'
        WHEN 'event'            THEN COALESCE(NEW.content, NEW.author_name || ' publicó un evento')
      END,
      '/feed',
      jsonb_build_object('post_id', NEW.id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_feed_post ON public.feed_posts;
CREATE TRIGGER trg_notify_feed_post
  AFTER INSERT ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.open_notify_feed_post();
