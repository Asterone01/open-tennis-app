import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Settings, Trophy, Users, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useManagerClub from '../../hooks/useManagerClub'
import BrandKitEditor from './BrandKitEditor'

function ManagerDashboard() {
  const { clubId, isLoading: isClubLoading } = useManagerClub()
  const [stats, setStats] = useState(null)
  const [pendingPlayers, setPendingPlayers] = useState([])
  const [activeTournaments, setActiveTournaments] = useState([])
  const [updatingId, setUpdatingId] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const load = async () => {
    if (!clubId) return
    setIsLoading(true)

    const [playersRes, tournamentsRes] = await Promise.all([
      supabase
        .from('players')
        .select('id, full_name, email, club_membership_status, is_coach, xp, level, created_at')
        .eq('club_id', clubId),
      supabase
        .from('tournaments')
        .select('id, title, status, start_date, category, age_group')
        .eq('club_id', clubId)
        .in('status', ['open', 'in_progress'])
        .order('start_date', { ascending: true }),
    ])

    const players = playersRes.data || []
    const approved = players.filter((p) => p.club_membership_status === 'approved' && !p.is_coach)
    const coaches = players.filter((p) => p.is_coach)
    const pending = players.filter((p) => p.club_membership_status === 'pending')

    setStats({
      members: approved.length,
      coaches: coaches.length,
      pending: pending.length,
    })
    setPendingPlayers(pending)
    setActiveTournaments(tournamentsRes.data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    load()
  }, [clubId])

  const handleMembership = async (playerId, status) => {
    setUpdatingId(playerId)
    setMessage('')

    const { error } = await supabase
      .from('players')
      .update({ club_membership_status: status })
      .eq('id', playerId)

    if (error) {
      setMessage(error.message)
    } else {
      setPendingPlayers((current) => current.filter((p) => p.id !== playerId))
      setStats((current) =>
        current
          ? {
              ...current,
              pending: Math.max(current.pending - 1, 0),
              members: status === 'approved' ? current.members + 1 : current.members,
            }
          : current,
      )
      setMessage(status === 'approved' ? 'Jugador aprobado.' : 'Solicitud rechazada.')
    }

    setUpdatingId('')
  }

  if (isClubLoading) {
    return <p className="text-sm text-open-muted">Cargando club...</p>
  }

  if (!clubId) {
    return (
      <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
        No se encontró un club asociado a este manager.
      </p>
    )
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            Manager Hub
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">
            Control del Club
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-open-muted">
          Estado del club, solicitudes de ingreso y torneos activos.
        </p>
      </div>

      {message ? (
        <p className="border border-open-light bg-open-surface px-4 py-3 text-sm font-semibold text-open-ink">
          {message}
        </p>
      ) : null}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Miembros activos" value={isLoading ? '—' : stats?.members ?? 0} icon={Users} />
        <KpiCard label="Coaches" value={isLoading ? '—' : stats?.coaches ?? 0} icon={Settings} />
        <KpiCard
          label="Solicitudes pendientes"
          value={isLoading ? '—' : stats?.pending ?? 0}
          icon={Users}
          highlight={stats?.pending > 0}
        />
      </div>

      {/* Solicitudes de ingreso */}
      <article className="border border-open-light bg-open-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
            Solicitudes de ingreso
          </h2>
          {stats?.pending > 0 && (
            <span className="grid h-6 min-w-6 place-items-center bg-open-primary px-1 text-[10px] font-semibold text-white">
              {stats.pending}
            </span>
          )}
        </div>

        {pendingPlayers.length === 0 ? (
          <p className="mt-4 text-sm text-open-muted">
            No hay solicitudes pendientes.
          </p>
        ) : (
          <div className="mt-4 grid gap-2">
            {pendingPlayers.map((player) => (
              <div
                key={player.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-open-light bg-open-bg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-open-ink">
                    {player.full_name || player.email}
                  </p>
                  <p className="mt-0.5 text-xs text-open-muted">
                    {player.email}
                    {player.created_at
                      ? ` · Solicito ${new Date(player.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`
                      : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!!updatingId}
                    onClick={() => handleMembership(player.id, 'approved')}
                    className="inline-flex h-9 items-center gap-1.5 bg-open-ink px-3 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check size={13} strokeWidth={2} />
                    Aprobar
                  </button>
                  <button
                    type="button"
                    disabled={!!updatingId}
                    onClick={() => handleMembership(player.id, 'rejected')}
                    className="inline-flex h-9 items-center gap-1.5 border border-open-light bg-open-surface px-3 text-xs font-semibold text-open-ink transition hover:border-open-primary disabled:opacity-50"
                  >
                    <X size={13} strokeWidth={2} />
                    Rechazar
                  </button>
                  <Link
                    to={`/players/${player.id}`}
                    className="inline-flex h-9 items-center border border-open-light bg-open-surface px-3 text-xs font-semibold text-open-ink transition hover:border-open-primary"
                  >
                    Ver perfil
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* Torneos activos */}
      <article className="border border-open-light bg-open-surface p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Trophy size={18} strokeWidth={1.8} />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
              Torneos activos
            </h2>
          </div>
          <Link
            to="/tournaments"
            className="text-xs font-semibold text-open-primary transition hover:opacity-70"
          >
            Gestionar
          </Link>
        </div>

        {activeTournaments.length === 0 ? (
          <div className="mt-4 flex items-center justify-between gap-4 border border-open-light bg-open-bg px-4 py-3">
            <p className="text-sm text-open-muted">Sin torneos activos.</p>
            <Link
              to="/tournaments"
              className="text-xs font-semibold text-open-primary transition hover:opacity-70"
            >
              Crear torneo
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-2">
            {activeTournaments.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 border border-open-light bg-open-bg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-open-ink">{t.title}</p>
                  <p className="mt-0.5 text-xs text-open-muted">
                    {t.category ? `Cat. ${t.category}` : ''}
                    {t.age_group ? ` · ${t.age_group}` : ''}
                    {t.start_date ? ` · ${t.start_date}` : ''}
                  </p>
                </div>
                <span
                  className={[
                    'border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]',
                    t.status === 'in_progress'
                      ? 'border-open-ink text-open-ink'
                      : 'border-open-light text-open-muted',
                  ].join(' ')}
                >
                  {t.status === 'in_progress' ? 'En curso' : 'Inscripciones'}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* Acceso membresías */}
      <Link
        to="/memberships"
        className="flex items-center justify-between gap-4 border border-open-light bg-open-surface px-5 py-4 transition hover:border-open-primary"
      >
        <div>
          <p className="text-sm font-semibold text-open-ink">Gestionar membresías</p>
          <p className="mt-0.5 text-xs text-open-muted">
            Pagos, planes, fechas de vencimiento y notas por jugador.
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-open-primary">Ver todo →</span>
      </Link>

      {/* Brand Kit */}
      <article className="border border-open-light bg-open-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
          Identidad del club
        </h2>
        <div className="mt-4">
          <BrandKitEditor />
        </div>
      </article>
    </section>
  )
}

function KpiCard({ label, value, icon: Icon, highlight = false }) {
  return (
    <article
      className={[
        'border p-5',
        highlight ? 'border-open-primary bg-open-surface' : 'border-open-light bg-open-surface',
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

export default ManagerDashboard
