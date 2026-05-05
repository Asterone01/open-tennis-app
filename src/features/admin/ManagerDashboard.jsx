import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ChevronRight, CreditCard, MapPin, Trophy, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import useManagerClub from '../../hooks/useManagerClub'

const chartColors = ['#0D0D0F', '#2FA7B8', '#737373', '#D4D4D4']
const operationColors = ['#0D0D0F', '#2FA7B8', '#A3A3A3']

function ManagerDashboard() {
  const { club, clubId, isLoading: isClubLoading } = useManagerClub()
  const [players, setPlayers] = useState([])
  const [courts, setCourts] = useState([])
  const [reservations, setReservations] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!clubId) return
    let isMounted = true

    const load = async () => {
      setIsLoading(true)
      setError('')
      const today = new Date().toISOString().slice(0, 10)

      const [playersRes, courtsRes, reservationsRes, tournamentsRes] = await Promise.all([
        supabase
          .from('players')
          .select('id, full_name, email, club_membership_status, membership_payment_status, is_coach, created_at')
          .eq('club_id', clubId),
        supabase
          .from('courts')
          .select('id, name, status')
          .eq('club_id', clubId),
        supabase
          .from('court_reservations')
          .select('id, status, payment_status, reservation_date, court_id')
          .eq('club_id', clubId)
          .gte('reservation_date', today)
          .limit(80),
        supabase
          .from('tournaments')
          .select('id, title, status, start_date, category, age_group')
          .eq('club_id', clubId)
          .order('start_date', { ascending: true })
          .limit(8),
      ])

      if (!isMounted) return

      const firstError = playersRes.error || courtsRes.error || reservationsRes.error || tournamentsRes.error
      if (firstError) setError(firstError.message)

      setPlayers(playersRes.data || [])
      setCourts(courtsRes.data || [])
      setReservations(reservationsRes.data || [])
      setTournaments(tournamentsRes.data || [])
      setIsLoading(false)
    }

    load()
    return () => { isMounted = false }
  }, [clubId])

  const approvedPlayers = useMemo(
    () => players.filter((player) => player.club_membership_status === 'approved' && !player.is_coach),
    [players],
  )
  const coaches = useMemo(
    () => players.filter((player) => player.is_coach && player.club_membership_status === 'approved'),
    [players],
  )
  const pendingMembers = useMemo(
    () => players.filter((player) => player.club_membership_status === 'pending'),
    [players],
  )
  const activeCourts = courts.filter((court) => court.status === 'active')
  const activeTournaments = tournaments.filter((tournament) => ['open', 'in_progress'].includes(tournament.status))
  const confirmedReservations = reservations.filter((reservation) => reservation.status === 'confirmed')
  const pendingPayments = players.filter((player) =>
    ['pending', 'overdue'].includes(player.membership_payment_status),
  )

  const memberData = useMemo(
    () => [
      { label: 'Jugadores', value: approvedPlayers.length },
      { label: 'Coaches', value: coaches.length },
      { label: 'Pendientes', value: pendingMembers.length },
    ].filter((item) => item.value > 0),
    [approvedPlayers.length, coaches.length, pendingMembers.length],
  )

  const operationData = useMemo(
    () => [
      { label: 'Canchas', value: activeCourts.length },
      { label: 'Reservas', value: confirmedReservations.length },
      { label: 'Torneos', value: activeTournaments.length },
    ].filter((item) => item.value > 0),
    [activeCourts.length, activeTournaments.length, confirmedReservations.length],
  )

  const approvalCoverage = players.length > 0
    ? Math.round(((players.length - pendingMembers.length) / players.length) * 100)
    : 0

  if (isClubLoading) {
    return <p className="text-sm text-open-muted">Cargando club...</p>
  }

  if (!clubId) {
    return (
      <p className="rounded-[2rem] border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
        No se encontro un club asociado a este manager.
      </p>
    )
  }

  return (
    <section className="grid gap-5">
      <DashboardHero
        clubName={club?.name || 'Club OPEN'}
        isLoading={isLoading}
        membersCount={approvedPlayers.length}
        coachesCount={coaches.length}
        courtsCount={activeCourts.length}
        pendingCount={pendingMembers.length}
      />

      {error ? (
        <p className="rounded-[1.5rem] border border-open-light bg-open-surface p-4 text-sm text-open-muted">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <ActionBanner
          kicker="Membresias"
          title={`${pendingMembers.length} pendientes`}
          detail={
            pendingMembers.length === 0
              ? 'No hay solicitudes esperando aprobacion.'
              : 'Aprueba jugadores y coaches para activar su acceso.'
          }
          to="/membresias"
          image="https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80"
          icon={CreditCard}
        />
        <ActionBanner
          kicker="Canchas"
          title={`${activeCourts.length} activas`}
          detail={
            reservations[0]
              ? `${confirmedReservations.length} reservas proximas confirmadas.`
              : 'Configura disponibilidad, fotos y precios del club.'
          }
          to="/canchas"
          image="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80"
          icon={MapPin}
        />
        <ActionBanner
          kicker="Competencia"
          title={`${activeTournaments.length} torneos`}
          detail={
            activeTournaments[0]
              ? `Activo: ${activeTournaments[0].title}`
              : 'Crea torneos y revisa ranking del club.'
          }
          to="/tournaments"
          image="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80"
          icon={Trophy}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartPanel title="Miembros" subtitle="Composicion del club" footer={<CategoryLegend data={memberData} />}>
          {memberData.length > 0 ? (
            <DonutChart data={memberData} colors={chartColors} centerLabel={`${players.length}`} centerDetail="perfiles" />
          ) : (
            <EmptyPanel text="Aun no hay miembros vinculados." />
          )}
        </ChartPanel>

        <ChartPanel title="Operacion" subtitle="Canchas y actividad" footer={<CategoryLegend data={operationData} colors={operationColors} />}>
          {operationData.length > 0 ? (
            <DonutChart data={operationData} colors={operationColors} centerLabel={`${activeCourts.length}`} centerDetail="canchas" />
          ) : (
            <EmptyPanel text="Configura canchas para iniciar operacion." />
          )}
        </ChartPanel>

        <ChartPanel title="Accesos" subtitle="Aprobacion y pagos">
          <GaugeChart value={approvalCoverage} />
          <p className="rounded-[1.25rem] bg-open-bg p-4 text-sm leading-6 text-open-muted">
            {pendingMembers.length === 0
              ? 'Todos los perfiles vinculados estan revisados.'
              : `${pendingMembers.length} solicitudes requieren aprobacion.`}
            {pendingPayments.length > 0 ? ` ${pendingPayments.length} membresias tienen pago pendiente.` : ''}
          </p>
        </ChartPanel>
      </div>
    </section>
  )
}

function DashboardHero({ clubName, isLoading, membersCount, coachesCount, courtsCount, pendingCount }) {
  const metrics = [
    { label: 'Miembros', value: isLoading ? '...' : membersCount, icon: Users },
    { label: 'Coaches', value: isLoading ? '...' : coachesCount, icon: Users },
    { label: 'Canchas', value: isLoading ? '...' : courtsCount, icon: MapPin },
    { label: 'Pendientes', value: isLoading ? '...' : pendingCount, icon: CreditCard },
  ]

  return (
    <header className="relative isolate overflow-hidden rounded-[2rem] border border-open-light bg-open-ink p-5 text-white sm:rounded-[2.5rem] sm:p-7 lg:p-10">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1400&q=80')",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/84 to-black/34" />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.55fr)] xl:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200/90">
            Manager dashboard
          </p>
          <h1 className="mt-6 max-w-[12ch] text-4xl font-black leading-[0.95] sm:text-5xl lg:text-7xl">
            {clubName}
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-white/72">
            Lectura rapida del club: membresias, canchas, reservas,
            competencia y pendientes de operacion.
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

function ActionBanner({ kicker, title, detail, to, image, icon: Icon }) {
  return (
    <Link
      to={to}
      className="group relative isolate grid min-h-56 overflow-hidden rounded-[2rem] border border-open-light p-5 text-white shadow-xl shadow-black/5 transition hover:-translate-y-0.5 hover:border-open-ink hover:shadow-2xl hover:shadow-black/10 sm:rounded-[2.35rem]"
    >
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center transition duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url('${image}')` }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-black/78 to-black/24" />
      <div className="grid h-full content-between gap-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200/90">
              {kicker}
            </p>
            <h2 className="mt-5 max-w-[10ch] text-4xl font-black leading-[0.92]">
              {title}
            </h2>
          </div>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-open-ink transition group-hover:scale-105">
            <Icon size={20} strokeWidth={2.2} />
          </span>
        </div>

        <div className="flex items-end justify-between gap-4">
          <p className="max-w-xs text-sm font-semibold leading-6 text-white/72">
            {detail}
          </p>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition group-hover:bg-white group-hover:text-open-ink">
            <ChevronRight size={19} strokeWidth={2.3} />
          </span>
        </div>
      </div>
    </Link>
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
    <div className="relative min-h-[17rem] min-w-0">
      <ResponsiveContainer width="100%" height={270} minWidth={0}>
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
    { label: 'Completado', value },
    { label: 'Pendiente', value: Math.max(100 - value, 0) },
  ]

  return (
    <div className="grid place-items-center rounded-[1.5rem] bg-open-bg p-4">
      <div className="relative h-48 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              innerRadius={72}
              outerRadius={104}
              paddingAngle={3}
              cornerRadius={12}
              stroke="transparent"
            >
              <Cell fill="#2FA7B8" />
              <Cell fill="#D4D4D4" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-x-0 bottom-2 text-center">
          <p className="text-4xl font-black text-open-ink">{value}%</p>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-open-muted">
            revisado
          </p>
        </div>
      </div>
    </div>
  )
}

function CategoryLegend({ data, colors = chartColors }) {
  if (!data.length) return null

  return (
    <div className="grid gap-2">
      {data.map((item, index) => (
        <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 font-semibold text-open-muted">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            {item.label}
          </span>
          <span className="font-black text-open-ink">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyPanel({ text }) {
  return (
    <div className="grid min-h-[17rem] place-items-center rounded-[1.5rem] bg-open-bg p-6 text-center text-sm font-semibold text-open-muted">
      {text}
    </div>
  )
}

export default ManagerDashboard
