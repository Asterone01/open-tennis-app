import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, ClipboardList, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import usePlayerProfile from '../profile/usePlayerProfile'

function CoachDashboard() {
  const { profile } = usePlayerProfile()
  const [stats, setStats] = useState(null)
  const [needsEval, setNeedsEval] = useState([])
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [recentMatches, setRecentMatches] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!profile.clubId) return
    let isMounted = true

    const load = async () => {
      setIsLoading(true)

      const today = new Date().toISOString().slice(0, 10)

      const [playersRes, sessionsRes, matchesRes] = await Promise.all([
        supabase
          .from('players')
          .select('id, full_name, email, club_membership_status, current_category, suggested_category, xp, level')
          .eq('club_id', profile.clubId)
          .or('is_coach.is.null,is_coach.eq.false'),
        supabase
          .from('training_sessions')
          .select('id, title, session_date, start_time, max_players, status')
          .eq('club_id', profile.clubId)
          .gte('session_date', today)
          .order('session_date', { ascending: true })
          .limit(4),
        supabase
          .from('friendly_matches')
          .select('id, match_date, score, status, winner_player_id, created_by_player_id, opponent_player_id')
          .eq('club_id', profile.clubId)
          .order('match_date', { ascending: false })
          .limit(6),
      ])

      if (!isMounted) return

      const players = playersRes.data || []
      const approved = players.filter((p) => p.club_membership_status === 'approved')
      const pending = players.filter((p) => p.club_membership_status === 'pending')
      const noCategory = approved.filter((p) => !p.current_category)

      setStats({
        total: approved.length,
        pending: pending.length,
        noCategory: noCategory.length,
      })
      setNeedsEval(noCategory.slice(0, 4))
      setUpcomingSessions(sessionsRes.data || [])
      setRecentMatches(matchesRes.data || [])
      setIsLoading(false)
    }

    load()
    return () => { isMounted = false }
  }, [profile.clubId])

  if (!profile.clubId) {
    return (
      <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
        Necesitas pertenecer a un club para acceder al dashboard de coach.
      </p>
    )
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            Coach Hub
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">
            {profile.fullName || 'Coach OPEN'}
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-open-muted">
          Roster, evaluaciones pendientes y proximas sesiones de entrenamiento.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Jugadores activos"
          value={isLoading ? '—' : stats?.total ?? 0}
          icon={Users}
        />
        <StatCard
          label="Sin categoria asignada"
          value={isLoading ? '—' : stats?.noCategory ?? 0}
          icon={ClipboardList}
          highlight={stats?.noCategory > 0}
        />
        <StatCard
          label="Sesiones proximas"
          value={isLoading ? '—' : upcomingSessions.length}
          icon={BookOpen}
        />
      </div>

      {/* Jugadores sin categoria */}
      {needsEval.length > 0 && (
        <article className="border border-open-light bg-open-surface p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
              Pendientes de evaluacion
            </h2>
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-open-primary transition hover:opacity-70"
            >
              Ir a evaluaciones
            </Link>
          </div>
          <div className="mt-4 grid gap-2">
            {needsEval.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 border border-open-light bg-open-bg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-open-ink">
                    {p.full_name || p.email}
                  </p>
                  <p className="mt-0.5 text-xs text-open-muted">
                    {p.suggested_category
                      ? `Sugerida: Cat. ${p.suggested_category}`
                      : 'Sin categoria sugerida'}
                  </p>
                </div>
                <Link
                  to={`/players/${p.id}`}
                  className="inline-flex h-8 items-center gap-1.5 border border-open-light bg-open-surface px-3 text-xs font-semibold text-open-ink transition hover:border-open-primary"
                >
                  Ver
                  <ArrowRight size={12} strokeWidth={2} />
                </Link>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* Proximas sesiones */}
      <article className="border border-open-light bg-open-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen size={18} strokeWidth={1.8} />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
              Proximas sesiones
            </h2>
          </div>
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-open-primary transition hover:opacity-70"
          >
            Gestionar
          </Link>
        </div>

        {upcomingSessions.length === 0 ? (
          <p className="mt-4 text-sm text-open-muted">
            Sin sesiones programadas proximas.
          </p>
        ) : (
          <div className="mt-4 grid gap-2">
            {upcomingSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-3 border border-open-light bg-open-bg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-open-ink">
                    {session.title || 'Sesion de entrenamiento'}
                  </p>
                  <p className="mt-0.5 text-xs text-open-muted">
                    {session.session_date}
                    {session.start_time ? ` · ${session.start_time.slice(0, 5)}` : ''}
                    {session.max_players ? ` · max ${session.max_players} jugadores` : ''}
                  </p>
                </div>
                <span
                  className={[
                    'border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]',
                    session.status === 'open'
                      ? 'border-open-primary text-open-primary'
                      : 'border-open-light text-open-muted',
                  ].join(' ')}
                >
                  {session.status === 'open' ? 'Abierta' : session.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* Actividad reciente de partidos */}
      <article className="border border-open-light bg-open-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
            Actividad de partidos en el club
          </h2>
          <Link
            to="/matches"
            className="text-xs font-semibold text-open-primary transition hover:opacity-70"
          >
            Ver todos
          </Link>
        </div>

        {recentMatches.length === 0 ? (
          <p className="mt-4 text-sm text-open-muted">Sin partidos recientes.</p>
        ) : (
          <div className="mt-4 grid gap-2">
            {recentMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between gap-3 border border-open-light bg-open-bg px-4 py-2"
              >
                <p className="text-sm text-open-ink">
                  {match.match_date}
                  {match.score ? ` · ${match.score}` : ''}
                </p>
                <span
                  className={[
                    'text-xs font-semibold',
                    match.status === 'confirmed' ? 'text-open-ink' : 'text-open-muted',
                  ].join(' ')}
                >
                  {formatStatus(match.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* Accesos rapidos */}
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink to="/tournaments" label="Torneos" description="Crear o gestionar brackets" />
        <QuickLink to="/matches" label="Partidos" description="Historial y confirmaciones" />
        <QuickLink to="/ranking" label="Ranking" description="Tabla de clasificacion" />
      </div>
    </section>
  )
}

function StatCard({ label, value, icon: Icon, highlight = false }) {
  return (
    <article
      className={[
        'border p-5',
        highlight
          ? 'border-open-primary bg-open-surface'
          : 'border-open-light bg-open-surface',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-open-muted">{label}</p>
        <div className="grid h-9 w-9 place-items-center border border-open-light bg-open-bg">
          <Icon size={16} strokeWidth={1.8} />
        </div>
      </div>
      <p className="mt-4 text-4xl font-semibold text-open-ink">{value}</p>
    </article>
  )
}

function QuickLink({ to, label, description }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between gap-3 border border-open-light bg-open-surface px-4 py-4 transition hover:border-open-primary"
    >
      <div>
        <p className="text-sm font-semibold text-open-ink">{label}</p>
        <p className="mt-0.5 text-xs text-open-muted">{description}</p>
      </div>
      <ArrowRight size={16} strokeWidth={1.8} className="shrink-0 text-open-muted" />
    </Link>
  )
}

function formatStatus(status) {
  const labels = { pending: 'Pendiente', confirmed: 'Confirmado', rejected: 'Rechazado', expired: 'Expirado' }
  return labels[status] || status
}

export default CoachDashboard
