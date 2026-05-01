import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronRight,
  Search,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import usePlayerProfile from '../profile/usePlayerProfile'

const filterOptions = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Activos' },
  { id: 'pending', label: 'Pendientes' },
  { id: 'category', label: 'Sin categoria' },
]

function CoachPlayersGallery() {
  const { profile } = usePlayerProfile()
  const [players, setPlayers] = useState([])
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)

  useEffect(() => {
    if (!profile.clubId) {
      return
    }

    let isMounted = true

    const loadPlayers = async () => {
      setIsLoading(true)
      setError('')

      const { data, error: playersError } = await supabase
        .from('players')
        .select(
          'id, full_name, email, avatar_url, level, xp, club_membership_status, current_category, suggested_category, age_group, rating',
        )
        .eq('club_id', profile.clubId)
        .or('is_coach.is.null,is_coach.eq.false')
        .order('full_name', { ascending: true })

      if (!isMounted) return

      if (playersError) {
        setError(playersError.message)
      } else {
        setPlayers(data || [])
      }

      setIsLoading(false)
    }

    loadPlayers()

    return () => {
      isMounted = false
    }
  }, [profile.clubId])

  const stats = useMemo(() => {
    const active = players.filter((player) => player.club_membership_status === 'approved')
    const pending = players.filter((player) => player.club_membership_status === 'pending')
    const withoutCategory = active.filter((player) => !player.current_category)

    return {
      total: players.length,
      active: active.length,
      pending: pending.length,
      withoutCategory: withoutCategory.length,
    }
  }, [players])

  const visiblePlayers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return players.filter((player) => {
      const matchesQuery =
        !normalizedQuery ||
        [player.full_name, player.email, player.current_category, player.suggested_category]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery))

      if (!matchesQuery) return false
      if (filter === 'active') return player.club_membership_status === 'approved'
      if (filter === 'pending') return player.club_membership_status === 'pending'
      if (filter === 'category') return !player.current_category
      return true
    })
  }, [filter, players, query])

  if (!profile.clubId) {
    return (
      <p className="rounded-[2rem] border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
        Vincula tu perfil de coach a un club para ver la galeria de jugadores.
      </p>
    )
  }

  return (
    <section className="grid gap-5">
      <PlayersHero
        stats={stats}
        coachName={profile.fullName || 'Coach OPEN'}
        onAdd={() => setIsAddOpen(true)}
      />

      <div className="grid gap-3 rounded-[2rem] border border-open-light bg-open-surface p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="flex min-h-14 items-center gap-3 rounded-[1.35rem] border border-open-light bg-open-bg px-4">
            <Search size={18} strokeWidth={2} className="shrink-0 text-open-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, email o categoria"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-open-ink outline-none placeholder:text-open-muted"
            />
          </label>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                className={[
                  'min-h-12 rounded-[1.1rem] border px-3 text-sm font-black transition',
                  filter === option.id
                    ? 'border-open-ink bg-open-ink text-open-surface'
                    : 'border-open-light bg-open-bg text-open-muted hover:border-open-ink hover:text-open-ink',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <p className="rounded-[1.35rem] border border-open-light bg-open-bg p-4 text-sm text-open-muted">
            {error}
          </p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {visiblePlayers.map((player) => (
            <PlayerGalleryCard key={player.id} player={player} />
          ))}
        </div>

        {!isLoading && visiblePlayers.length === 0 ? (
          <p className="rounded-[1.35rem] border border-open-light bg-open-bg p-6 text-center text-sm text-open-muted">
            No hay jugadores en esta vista.
          </p>
        ) : null}

        {isLoading ? (
          <p className="rounded-[1.35rem] border border-open-light bg-open-bg p-6 text-center text-sm text-open-muted">
            Cargando jugadores...
          </p>
        ) : null}
      </div>

      {isAddOpen ? <AddPlayerModal onClose={() => setIsAddOpen(false)} /> : null}
    </section>
  )
}

function PlayersHero({ stats, coachName, onAdd }) {
  return (
    <header className="relative isolate overflow-hidden rounded-[2rem] border border-open-light bg-open-ink p-5 text-white sm:rounded-[2.5rem] sm:p-7 lg:p-10">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1542144582-1ba00456b5e3?auto=format&fit=crop&w=1400&q=80')",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/84 to-black/30" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.44fr)] lg:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200/90">
            Coach - Jugadores
          </p>
          <h1 className="mt-6 max-w-[11ch] text-4xl font-black leading-[0.95] sm:text-5xl lg:text-7xl">
            Galeria de jugadores.
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-white/72">
            Roster visual de {coachName}: perfiles, categorias, estado de club
            y accesos rapidos al detalle de cada alumno.
          </p>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <HeroMetric label="Total" value={stats.total} />
            <HeroMetric label="Activos" value={stats.active} />
            <HeroMetric label="Pendientes" value={stats.pending} />
            <HeroMetric label="Sin cat." value={stats.withoutCategory} />
          </div>
          <button
            type="button"
            onClick={onAdd}
            className="flex min-h-14 items-center justify-center gap-3 rounded-[1.35rem] bg-white px-5 text-base font-black text-black transition hover:bg-white/90"
          >
            <UserPlus size={22} strokeWidth={2.4} />
            Agregar o vincular
          </button>
        </div>
      </div>
    </header>
  )
}

function HeroMetric({ label, value }) {
  return (
    <div className="grid min-h-20 content-center rounded-[1.2rem] border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
      <span className="text-2xl font-black text-white">{value}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/48">
        {label}
      </span>
    </div>
  )
}

function PlayerGalleryCard({ player }) {
  const name = player.full_name || 'Jugador OPEN'
  const category = player.current_category || player.suggested_category || 'Pendiente'
  const status = formatMembership(player.club_membership_status)
  const initials = getInitials(name)

  return (
    <article className="group grid min-h-[26rem] content-between overflow-hidden rounded-[2rem] border border-open-light bg-open-bg p-3 text-open-ink transition hover:border-open-ink">
      <div className="relative min-h-56 overflow-hidden rounded-[1.6rem] bg-open-ink text-white">
        {player.avatar_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${player.avatar_url})` }}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-black via-zinc-900 to-zinc-700 text-6xl font-black text-white/16">
            {initials}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/18 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 grid gap-2 p-4">
          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-black">
            {status}
          </span>
          <h2 className="text-2xl font-black leading-7 text-white">{name}</h2>
        </div>
      </div>

      <div className="grid gap-4 p-1">
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="Cat." value={category} />
          <MiniStat label="LVL" value={player.level || 1} />
          <MiniStat label="XP" value={formatNumber(player.xp || 0)} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/players/${player.id}`}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[1.2rem] bg-open-ink px-4 text-sm font-black text-open-surface transition hover:opacity-90"
          >
            Ver perfil
            <ChevronRight size={17} strokeWidth={2.2} />
          </Link>
          <Link
            to="/ranking"
            className="grid min-h-12 w-12 place-items-center rounded-[1.2rem] border border-open-light bg-open-surface text-open-ink transition hover:border-open-ink"
            aria-label="Ver ranking"
          >
            <Trophy size={18} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </article>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="min-w-0 rounded-[1rem] border border-open-light bg-open-surface p-2">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-open-muted">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-open-ink">{value}</p>
    </div>
  )
}

function AddPlayerModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/45 p-3 backdrop-blur-sm sm:place-items-center sm:p-6">
      <section className="grid max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/20 bg-open-surface p-4 shadow-2xl shadow-black/25 sm:rounded-[2.5rem] sm:p-5 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,0.75fr)_minmax(0,1.25fr)]">
          <div className="relative isolate grid min-h-72 content-between overflow-hidden rounded-[2rem] bg-open-ink p-5 text-white sm:p-6">
            <div
              className="absolute inset-0 -z-20 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?auto=format&fit=crop&w=1400&q=80')",
              }}
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-black/82 to-black/30" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200/90">
                  Jugadores
                </p>
                <h3 className="mt-6 max-w-[9ch] text-5xl font-black leading-[0.95]">
                  Agregar o vincular.
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-black transition hover:bg-white/90"
                aria-label="Cerrar"
              >
                <X size={22} strokeWidth={2.4} />
              </button>
            </div>
            <p className="max-w-sm text-sm font-semibold leading-6 text-white/72">
              Esta ventana concentra el siguiente flujo productivo para alta,
              invitacion o vinculacion de alumnos.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ModalOption
              icon={UserPlus}
              title="Agregar jugador nuevo"
              detail="Crea una ficha interna y despues completa su perfil."
              to="/profile"
              primary
            />
            <ModalOption
              icon={ShieldCheck}
              title="Vincular perfil existente"
              detail="Conecta una cuenta OPEN existente con el club."
              to="/profile"
            />
            <ModalOption
              icon={Users}
              title="Ver todos"
              detail="Regresa al roster y revisa jugadores activos."
              to="/jugadores"
            />
            <ModalOption
              icon={Trophy}
              title="Evaluar jugadores"
              detail="Asigna categoria, stats y XP desde el sistema de coach."
              to="/evaluaciones"
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function ModalOption({ icon: Icon, title, detail, to, primary = false }) {
  return (
    <Link
      to={to}
      className={[
        'grid min-h-52 content-between rounded-[1.75rem] border p-4 transition',
        primary
          ? 'border-open-ink bg-open-ink text-open-surface'
          : 'border-open-light bg-open-bg text-open-ink hover:border-open-ink',
      ].join(' ')}
    >
      <span className={['grid h-12 w-12 place-items-center rounded-[1rem]', primary ? 'bg-white/10' : 'bg-open-surface'].join(' ')}>
        <Icon size={22} strokeWidth={2} />
      </span>
      <span>
        <span className="block text-xl font-black leading-6">{title}</span>
        <span className={['mt-2 block text-sm leading-6', primary ? 'text-white/68' : 'text-open-muted'].join(' ')}>
          {detail}
        </span>
      </span>
    </Link>
  )
}

function formatMembership(value) {
  const labels = {
    approved: 'Activo',
    pending: 'Pendiente',
    rejected: 'Rechazado',
    unassigned: 'Sin club',
  }

  return labels[value] || 'Activo'
}

function formatNumber(value) {
  if (value >= 1000) return `${Math.round(value / 100) / 10}k`
  return value
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default CoachPlayersGallery
