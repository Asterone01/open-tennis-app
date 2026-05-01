import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  ChevronRight,
  Dumbbell,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import usePlayerProfile from '../profile/usePlayerProfile'

const chartColors = ['#0D0D0F', '#2FA7B8', '#737373', '#D4D4D4', '#171717']
const rosterColors = ['#0D0D0F', '#2FA7B8', '#A3A3A3', '#E5E5E5']

function CoachDashboard() {
  const { profile } = usePlayerProfile()
  const [players, setPlayers] = useState([])
  const [sessions, setSessions] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!profile.clubId) return
    let isMounted = true

    const load = async () => {
      setIsLoading(true)
      setError('')

      const today = new Date().toISOString().slice(0, 10)

      const [playersRes, sessionsRes, tournamentsRes] = await Promise.all([
        supabase
          .from('players')
          .select('id, full_name, email, club_membership_status, current_category, suggested_category, xp, level')
          .eq('club_id', profile.clubId)
          .or('is_coach.is.null,is_coach.eq.false'),
        supabase
          .from('training_sessions')
          .select('id, title, session_date, max_players, status')
          .eq('club_id', profile.clubId)
          .gte('session_date', today)
          .order('session_date', { ascending: true })
          .limit(8),
        supabase
          .from('tournaments')
          .select('id, title, status, start_date, category, max_players')
          .eq('club_id', profile.clubId)
          .order('start_date', { ascending: false })
          .limit(8),
      ])

      if (!isMounted) return

      const firstError = playersRes.error || sessionsRes.error || tournamentsRes.error
      if (firstError) {
        setError(firstError.message)
      }

      setPlayers(playersRes.data || [])
      setSessions(sessionsRes.data || [])
      setTournaments(tournamentsRes.data || [])
      setIsLoading(false)
    }

    load()
    return () => { isMounted = false }
  }, [profile.clubId])

  const approvedPlayers = useMemo(
    () => players.filter((player) => player.club_membership_status === 'approved'),
    [players],
  )
  const pendingEvaluation = useMemo(
    () => approvedPlayers.filter((player) => !player.current_category),
    [approvedPlayers],
  )
  const averageXp = useMemo(() => {
    if (approvedPlayers.length === 0) return 0
    const totalXp = approvedPlayers.reduce((sum, player) => sum + Number(player.xp || 0), 0)
    return Math.round(totalXp / approvedPlayers.length)
  }, [approvedPlayers])
  const activeTournaments = tournaments.filter((tournament) => tournament.status !== 'completed')

  const categoryData = useMemo(() => buildCategoryData(approvedPlayers), [approvedPlayers])
  const rosterStatusData = useMemo(
    () => buildRosterStatusData(players, approvedPlayers, pendingEvaluation),
    [approvedPlayers, pendingEvaluation, players],
  )
  const evaluationCoverage = approvedPlayers.length > 0
    ? Math.round(((approvedPlayers.length - pendingEvaluation.length) / approvedPlayers.length) * 100)
    : 0

  if (!profile.clubId) {
    return (
      <p className="rounded-[2rem] border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
        Necesitas pertenecer a un club para acceder al dashboard de coach.
      </p>
    )
  }

  return (
    <section className="grid gap-5">
      <DashboardHero
        coachName={profile.fullName || 'Coach OPEN'}
        isLoading={isLoading}
        playersCount={approvedPlayers.length}
        pendingCount={pendingEvaluation.length}
        sessionsCount={sessions.length}
        averageXp={averageXp}
      />

      {error ? (
        <p className="rounded-[1.5rem] border border-open-light bg-open-surface p-4 text-sm text-open-muted">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartPanel title="Categorias" subtitle="Distribucion del roster" footer={<CategoryLegend data={categoryData} />}>
          {categoryData.length > 0 ? (
            <DonutChart data={categoryData} colors={chartColors} centerLabel={`${approvedPlayers.length}`} centerDetail="jugadores" />
          ) : (
            <EmptyPanel text="Aun no hay categorias asignadas." />
          )}
        </ChartPanel>

        <ChartPanel title="Estado del roster" subtitle="Activos y pendientes" footer={<CategoryLegend data={rosterStatusData} colors={rosterColors} />}>
          <DonutChart data={rosterStatusData} colors={rosterColors} centerLabel={`${players.length}`} centerDetail="perfiles" />
        </ChartPanel>

        <ChartPanel title="Cobertura" subtitle="Evaluacion del equipo">
          <GaugeChart value={evaluationCoverage} />
          <p className="rounded-[1.25rem] bg-open-bg p-4 text-sm leading-6 text-open-muted">
            {pendingEvaluation.length === 0
              ? 'Todo el roster activo tiene categoria asignada.'
              : `${pendingEvaluation.length} jugadores activos todavia necesitan categoria.`}
          </p>
        </ChartPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ListPanel title="Proximas sesiones" to="/entrenamientos" empty="Sin sesiones proximas.">
          {sessions.slice(0, 4).map((session) => (
            <InfoRow
              key={session.id}
              title={session.title || 'Sesion de entrenamiento'}
              detail={session.session_date}
              badge={session.status || 'open'}
            />
          ))}
        </ListPanel>

        <ListPanel title="Pendientes de evaluacion" to="/evaluaciones" empty="Sin pendientes ahora.">
          {pendingEvaluation.slice(0, 4).map((player) => (
            <InfoRow
              key={player.id}
              title={player.full_name || player.email}
              detail={player.suggested_category ? `Sugerida: Cat. ${player.suggested_category}` : 'Sin categoria'}
              to={`/players/${player.id}`}
            />
          ))}
        </ListPanel>

        <ListPanel title="Torneos activos" to="/tournaments" empty="Sin torneos activos.">
          {activeTournaments.slice(0, 4).map((tournament) => (
            <InfoRow
              key={tournament.id}
              title={tournament.title}
              detail={tournament.start_date || 'Fecha pendiente'}
              badge={formatStatus(tournament.status)}
            />
          ))}
        </ListPanel>
      </div>
    </section>
  )
}

function DashboardHero({ coachName, isLoading, playersCount, pendingCount, sessionsCount, averageXp }) {
  const metrics = [
    { label: 'Jugadores', value: isLoading ? '...' : playersCount, icon: Users },
    { label: 'Por evaluar', value: isLoading ? '...' : pendingCount, icon: ShieldCheck },
    { label: 'Sesiones', value: isLoading ? '...' : sessionsCount, icon: Dumbbell },
    { label: 'XP prom.', value: isLoading ? '...' : formatNumber(averageXp), icon: Trophy },
  ]

  return (
    <header className="relative isolate overflow-hidden rounded-[2rem] border border-open-light bg-open-ink p-5 text-white sm:rounded-[2.5rem] sm:p-7 lg:p-10">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1544717301-9cdcb1f5940f?auto=format&fit=crop&w=1400&q=80')",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/84 to-black/34" />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.55fr)] xl:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200/90">
            Coach dashboard
          </p>
          <h1 className="mt-6 max-w-[12ch] text-4xl font-black leading-[0.95] sm:text-5xl lg:text-7xl">
            {coachName}
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-white/72">
            Lectura rapida del club: roster, actividad, entrenamientos,
            competencia y pendientes para tomar decisiones.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {metrics.map((metric) => (
            <HeroMetric key={metric.label} metric={metric} />
          ))}
        </div>
      </div>
    </header>
  )
}

function HeroMetric({ metric }) {
  const Icon = metric.icon

  return (
    <div className="grid min-h-24 content-between rounded-[1.25rem] border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
      <Icon size={18} strokeWidth={2} className="text-white/70" />
      <span>
        <span className="block text-2xl font-black text-white">{metric.value}</span>
        <span className="block text-[10px] font-black uppercase tracking-[0.14em] text-white/48">
          {metric.label}
        </span>
      </span>
    </div>
  )
}

function ChartPanel({ title, subtitle, children, footer }) {
  return (
    <section className="grid gap-4 rounded-[2rem] border border-open-light bg-open-surface p-4 sm:p-5">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">
          {subtitle}
        </p>
        <h2 className="mt-1 text-2xl font-black text-open-ink">{title}</h2>
      </div>
      {children}
      {footer}
    </section>
  )
}

function DonutChart({ data, colors, centerLabel, centerDetail }) {
  return (
    <div className="relative min-h-[17rem]">
      <ResponsiveContainer width="100%" height={270}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius={66}
            outerRadius={104}
            paddingAngle={5}
            cornerRadius={14}
            stroke="transparent"
          >
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              border: '1px solid rgba(13,13,15,0.12)',
              borderRadius: 16,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-4xl font-black text-open-ink">{centerLabel}</p>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-open-muted">{centerDetail}</p>
        </div>
      </div>
    </div>
  )
}

function GaugeChart({ value }) {
  const data = [
    { label: 'Evaluado', value },
    { label: 'Pendiente', value: Math.max(100 - value, 0) },
  ]

  return (
    <div className="relative min-h-[17rem]">
      <ResponsiveContainer width="100%" height={270}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            startAngle={210}
            endAngle={-30}
            innerRadius={70}
            outerRadius={106}
            paddingAngle={4}
            cornerRadius={16}
            stroke="transparent"
          >
            <Cell fill="#0D0D0F" />
            <Cell fill="#E5E5E5" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-5xl font-black text-open-ink">{value}%</p>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-open-muted">evaluado</p>
        </div>
      </div>
    </div>
  )
}

function CategoryLegend({ data, colors = chartColors }) {
  if (data.length === 0) return null

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {data.map((entry, index) => (
        <div key={entry.label} className="flex items-center justify-between gap-3 rounded-[1rem] bg-open-bg px-3 py-2">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="truncate text-xs font-black text-open-ink">{entry.label}</span>
          </span>
          <span className="text-xs font-black text-open-muted">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

function ListPanel({ title, to, empty, children }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children)

  return (
    <section className="grid content-start gap-3 rounded-[2rem] border border-open-light bg-open-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-open-ink">{title}</h2>
        <Link
          to={to}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-open-ink text-open-surface"
          aria-label={title}
        >
          <ChevronRight size={18} strokeWidth={2.2} />
        </Link>
      </div>
      <div className="grid gap-2">
        {hasChildren ? children : <EmptyPanel text={empty} />}
      </div>
    </section>
  )
}

function InfoRow({ title, detail, badge, to }) {
  const content = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-open-ink">{title}</span>
        <span className="mt-1 block text-xs text-open-muted">{detail}</span>
      </span>
      {badge ? (
        <span className="rounded-full bg-open-bg px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-open-muted">
          {badge}
        </span>
      ) : (
        <ChevronRight size={16} strokeWidth={2.2} className="text-open-muted" />
      )}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="flex min-h-16 items-center gap-3 rounded-[1.25rem] border border-open-light bg-open-bg p-3 transition hover:border-open-ink"
      >
        {content}
      </Link>
    )
  }

  return (
    <div className="flex min-h-16 items-center gap-3 rounded-[1.25rem] border border-open-light bg-open-bg p-3">
      {content}
    </div>
  )
}

function EmptyPanel({ text }) {
  return (
    <p className="rounded-[1.25rem] border border-open-light bg-open-bg p-4 text-sm text-open-muted">
      {text}
    </p>
  )
}

function buildCategoryData(players) {
  const counts = players.reduce((acc, player) => {
    const key = player.current_category || player.suggested_category || 'Pendiente'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts).map(([label, value]) => ({ label, value }))
}

function formatStatus(status) {
  const labels = {
    open: 'Abierto',
    in_progress: 'Activo',
    completed: 'Cerrado',
    cancelled: 'Cancelado',
  }

  return labels[status] || status || 'Activo'
}

function buildRosterStatusData(players, approvedPlayers, pendingEvaluation) {
  const pendingMembership = players.filter((player) => player.club_membership_status === 'pending').length
  const activeEvaluated = Math.max(approvedPlayers.length - pendingEvaluation.length, 0)
  const unassigned = players.filter((player) => !player.club_membership_status || player.club_membership_status === 'unassigned').length

  return [
    { label: 'Activos evaluados', value: activeEvaluated },
    { label: 'Por evaluar', value: pendingEvaluation.length },
    { label: 'Membresia pendiente', value: pendingMembership },
    { label: 'Sin club', value: unassigned },
  ].filter((item) => item.value > 0)
}

function formatNumber(value) {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`
  return value
}

export default CoachDashboard
