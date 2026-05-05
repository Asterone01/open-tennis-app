import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Search, Swords, UserRound } from 'lucide-react'
import usePlayerProfile from '../profile/usePlayerProfile'
import useManagerClub from '../../hooks/useManagerClub'
import { supabase } from '../../lib/supabase'
import { getRating } from './competitionUtils'

const CATEGORIES = ['D', 'C', 'B', 'A', 'Pro']
const RANKING_HERO_IMAGE =
  'https://images.unsplash.com/photo-1530915365347-e35b749a0381?auto=format&fit=crop&w=1800&q=80'
const PODIUM_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
]
const AGE_GROUPS = [
  { value: 'junior', label: 'Junior' },
  { value: 'juvenil', label: 'Juvenil' },
  { value: 'adulto', label: 'Adulto' },
  { value: 'senior', label: 'Senior' },
]

function RankingView() {
  const navigate = useNavigate()
  const { player: currentPlayer, profile, isLoading: isProfileLoading } =
    usePlayerProfile()
  const { clubId: managerClubId } = useManagerClub()
  const effectiveClubId = profile.clubId || managerClubId

  const [players, setPlayers] = useState([])
  const [winMap, setWinMap] = useState({})
  const [matchCountMap, setMatchCountMap] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterAgeGroup, setFilterAgeGroup] = useState('')

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (isProfileLoading) return
      if (!effectiveClubId) {
        setPlayers([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError('')

      const [playersRes, matchesRes] = await Promise.all([
        supabase
          .from('players')
          .select(
            'id, full_name, email, avatar_url, level, xp, current_category, suggested_category, age_group, club_membership_status, is_coach, stat_derecha, stat_reves, stat_saque, stat_volea, stat_movilidad, stat_slice, rating',
          )
          .eq('club_id', effectiveClubId)
          .or('is_coach.is.null,is_coach.eq.false')
          .neq('club_membership_status', 'rejected'),
        supabase
          .from('friendly_matches')
          .select('created_by_player_id, opponent_player_id, winner_player_id')
          .eq('club_id', effectiveClubId)
          .eq('status', 'confirmed'),
      ])

      if (!isMounted) return

      if (playersRes.error) {
        setError(playersRes.error.message)
        setIsLoading(false)
        return
      }

      setPlayers(playersRes.data || [])

      // Build win/match count maps from confirmed matches
      const wins = {}
      const matchCount = {}

      for (const m of matchesRes.data || []) {
        const ids = [m.created_by_player_id, m.opponent_player_id].filter(Boolean)
        for (const id of ids) {
          matchCount[id] = (matchCount[id] || 0) + 1
        }
        if (m.winner_player_id) {
          wins[m.winner_player_id] = (wins[m.winner_player_id] || 0) + 1
        }
      }

      setWinMap(wins)
      setMatchCountMap(matchCount)
      setIsLoading(false)
    }

    load()
    return () => { isMounted = false }
  }, [isProfileLoading, effectiveClubId])

  const rankedPlayers = useMemo(
    () =>
      [...players].sort(
        (a, b) =>
          getRating(b) - getRating(a) ||
          (b.level || 1) - (a.level || 1) ||
          (b.xp || 0) - (a.xp || 0),
      ),
    [players],
  )

  // Apply filters on the already-ranked list (positions are from full ranking)
  const filteredWithPos = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rankedPlayers
      .map((p, i) => ({ player: p, position: i + 1 }))
      .filter(({ player: p }) => {
        if (filterCategory) {
          const cat = p.current_category || p.suggested_category || ''
          if (cat !== filterCategory) return false
        }
        if (filterAgeGroup && p.age_group !== filterAgeGroup) return false
        if (q) {
          const name = (p.full_name || p.email || '').toLowerCase()
          if (!name.includes(q)) return false
        }
        return true
      })
  }, [rankedPlayers, filterCategory, filterAgeGroup, search])

  const myEntry = useMemo(
    () =>
      rankedPlayers
        .map((p, i) => ({ player: p, position: i + 1 }))
        .find(({ player }) => String(player.id) === String(currentPlayer?.id)),
    [rankedPlayers, currentPlayer?.id],
  )

  const topThree = useMemo(
    () => rankedPlayers.slice(0, 3).map((player, index) => ({ player, position: index + 1 })),
    [rankedPlayers],
  )

  const clubStats = useMemo(() => {
    const confirmedMatches =
      Object.values(matchCountMap).reduce((total, count) => total + count, 0) / 2
    const activePlayers = rankedPlayers.filter(
      (player) => player.club_membership_status === 'approved',
    )
    const averageRating = rankedPlayers.length
      ? Math.round(rankedPlayers.reduce((total, player) => total + getRating(player), 0) / rankedPlayers.length)
      : 0

    return {
      players: rankedPlayers.length,
      activePlayers: activePlayers.length,
      matches: confirmedMatches,
      averageRating,
    }
  }, [matchCountMap, rankedPlayers])

  const handleCompare = (opponent) => {
    if (!currentPlayer || String(opponent.id) === String(currentPlayer.id)) return
    navigate(`/h2h/${opponent.id}`, {
      state: { playerOne: currentPlayer, playerTwo: opponent },
    })
  }

  const activeFilters = filterCategory || filterAgeGroup || search

  return (
    <motion.section
      className="grid gap-6 bg-open-bg"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-open-ink px-5 py-6 text-white shadow-sm sm:rounded-[2.5rem] sm:px-8 sm:py-8 lg:min-h-[22rem] lg:px-10 lg:py-10">
        <div
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${RANKING_HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,0,0,0.92),rgba(0,0,0,0.58),rgba(0,0,0,0.22))]" />
        <div className="grid min-h-full gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/68">
              Competencia
            </p>
            <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[0.94] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Ranking del club.
            </h1>
            <p className="mt-5 max-w-xl text-sm font-semibold leading-6 text-white/76">
              Rating, categorias y comparaciones H2H para entender quien esta subiendo, quien compite y donde esta cada jugador.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <HeroMetric label="Jugadores" value={clubStats.players} />
            <HeroMetric label="Activos" value={clubStats.activePlayers} />
            <HeroMetric label="Partidos" value={clubStats.matches} />
            <HeroMetric label="Rating avg" value={clubStats.averageRating || '--'} />
          </div>
        </div>
      </header>
      <div className="hidden" aria-hidden="true">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            Competencia
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">
            Ranking del Club
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-open-muted">
          Clasificacion por rating · filtros por categoria y grupo de edad.
        </p>
      </div>

      {error ? (
        <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
          {error}
        </p>
      ) : null}

      {!effectiveClubId && !isProfileLoading ? (
        <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
          Unete a un club desde tu perfil para ver el ranking.
        </p>
      ) : null}

      {/* Mi posicion */}
      {myEntry && (
        <article className="grid gap-4 rounded-[1.75rem] border border-open-ink bg-open-ink px-5 py-4 text-white shadow-sm sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Tu posicion
            </p>
            <p className="mt-1 text-3xl font-semibold text-white">
              #{myEntry.position}
            </p>
          </div>
          <div className="min-w-0 border-white/20 sm:border-l sm:pl-4">
            <p className="truncate text-sm font-semibold text-white">
              {profile.fullName || 'Jugador OPEN'}
            </p>
            <p className="mt-0.5 text-xs text-white/60">
              Cat. {profile.currentCategory || profile.suggestedCategory || 'Pendiente'} ·{' '}
              {formatAgeGroup(myEntry.player.age_group)} · Rating {getRating(myEntry.player)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">Victorias</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {winMap[String(currentPlayer?.id)] || 0}
              <span className="text-sm text-white/60">
                /{matchCountMap[String(currentPlayer?.id)] || 0}
              </span>
            </p>
          </div>
        </article>
      )}

      {topThree.length > 0 ? (
        <section className="grid gap-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-open-muted">
                Podio
              </p>
              <h2 className="mt-1 text-2xl font-black text-open-ink">Top 3 del club</h2>
            </div>
            <p className="hidden max-w-sm text-right text-sm leading-6 text-open-muted sm:block">
              Los tres mejores aparecen como banners para leer el ranking rapido en mobile y web.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {topThree.map(({ player, position }) => (
              <PodiumCard
                key={player.id}
                player={player}
                position={position}
                wins={winMap[String(player.id)] || 0}
                matchCount={matchCountMap[String(player.id)] || 0}
                image={player.avatar_url || PODIUM_FALLBACK_IMAGES[position - 1]}
                isCurrentPlayer={String(player.id) === String(currentPlayer?.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Filtros */}
      <div className="grid gap-3 rounded-[1.75rem] border border-open-light bg-open-surface p-3 shadow-sm sm:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search
            size={16}
            strokeWidth={1.8}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-open-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar jugador..."
            className="h-12 w-full rounded-[1rem] border border-open-light bg-open-bg pl-9 pr-3 text-sm font-semibold text-open-ink outline-none focus:border-open-primary"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-12 rounded-[1rem] border border-open-light bg-open-bg px-3 text-sm font-semibold text-open-ink outline-none focus:border-open-primary"
        >
          <option value="">Todas las categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              Categoria {c}
            </option>
          ))}
        </select>

        <select
          value={filterAgeGroup}
          onChange={(e) => setFilterAgeGroup(e.target.value)}
          className="h-12 rounded-[1rem] border border-open-light bg-open-bg px-3 text-sm font-semibold text-open-ink outline-none focus:border-open-primary"
        >
          <option value="">Todos los grupos</option>
          {AGE_GROUPS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      {activeFilters && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-open-muted">
            {filteredWithPos.length} jugador{filteredWithPos.length !== 1 ? 'es' : ''} encontrado{filteredWithPos.length !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => { setSearch(''); setFilterCategory(''); setFilterAgeGroup('') }}
            className="text-xs font-semibold text-open-primary transition hover:opacity-70"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-[1.75rem] border border-open-light bg-open-surface shadow-sm">
        <div className="hidden grid-cols-[60px_1fr_80px_80px_90px_80px_80px_136px] border-b border-open-light px-4 py-4 text-xs font-black uppercase tracking-[0.14em] text-open-muted md:grid">
          <span>Pos</span>
          <span>Jugador</span>
          <span>Cat</span>
          <span>Grupo</span>
          <span>Nivel</span>
          <span>Rating</span>
          <span>V/P</span>
          <span>Accion</span>
        </div>

        <div className="grid gap-2 p-2">
          {filteredWithPos.map(({ player, position }) => (
            <RankingRow
              key={player.id}
              player={player}
              position={position}
              isCurrentPlayer={String(player.id) === String(currentPlayer?.id)}
              wins={winMap[String(player.id)] || 0}
              matchCount={matchCountMap[String(player.id)] || 0}
              onCompare={() => handleCompare(player)}
            />
          ))}
        </div>

        {!isLoading && filteredWithPos.length === 0 && profile.clubId && (
          <p className="px-4 py-8 text-center text-sm text-open-muted">
            No hay jugadores con esos filtros.
          </p>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-open-muted">Cargando ranking...</p>
      )}
    </motion.section>
  )
}

function HeroMetric({ label, value }) {
  return (
    <div className="rounded-[1.35rem] border border-white/14 bg-white/10 p-4 backdrop-blur-md">
      <p className="text-2xl font-black leading-none text-white">{value}</p>
      <p className="mt-2 text-[0.64rem] font-black uppercase tracking-[0.18em] text-white/68">
        {label}
      </p>
    </div>
  )
}

function PodiumCard({ player, position, wins, matchCount, image, isCurrentPlayer }) {
  const losses = matchCount - wins
  const category = player.current_category || player.suggested_category || 'Pendiente'
  const initials = getInitials(player.full_name || player.email || 'OPEN')
  const medalLabel = position === 1 ? 'Lider' : position === 2 ? 'Segundo' : 'Tercero'

  return (
    <Link
      to={`/players/${player.id}`}
      className="group relative isolate grid min-h-[18rem] overflow-hidden rounded-[2rem] bg-open-ink p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
    >
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center transition duration-500 group-hover:scale-105"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.3),rgba(0,0,0,0.86))]" />

      <div className="flex items-start justify-between gap-3">
        <div className="grid h-16 w-16 place-items-center rounded-[1.35rem] bg-white text-2xl font-black text-open-ink">
          #{position}
        </div>
        <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] text-white backdrop-blur-md">
          {medalLabel}
        </span>
      </div>

      <div className="mt-auto">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-[1rem] border border-white/20 bg-white/12 text-sm font-black">
            {player.avatar_url ? (
              <img src={player.avatar_url} alt={player.full_name} className="h-full w-full object-cover" />
            ) : initials ? (
              initials
            ) : (
              <UserRound size={18} strokeWidth={1.8} />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-black leading-6">
              {player.full_name || 'Jugador OPEN'}
              {isCurrentPlayer ? <span className="ml-2 text-xs text-white/64">(Tu)</span> : null}
            </p>
            <p className="mt-1 text-xs font-semibold text-white/68">
              Cat. {category} · Nv. {player.level || 1}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <PodiumStat label="Rating" value={getRating(player)} />
          <PodiumStat label="Victorias" value={wins} />
          <PodiumStat label="V/D" value={matchCount > 0 ? `${wins}/${losses}` : '--'} />
        </div>
      </div>
    </Link>
  )
}

function PodiumStat({ label, value }) {
  return (
    <span className="rounded-[1rem] border border-white/14 bg-white/10 px-3 py-2 backdrop-blur-md">
      <span className="block text-base font-black leading-none text-white">{value}</span>
      <span className="mt-1 block text-[0.58rem] font-black uppercase tracking-[0.14em] text-white/56">
        {label}
      </span>
    </span>
  )
}

function RankingRow({ player, position, isCurrentPlayer, wins, matchCount, onCompare }) {
  const losses = matchCount - wins
  const winRate = matchCount > 0 ? Math.round((wins / matchCount) * 100) : null
  const category = player.current_category || player.suggested_category || '—'
  const initials = getInitials(player.full_name || player.email || 'OPEN')

  const posIcon =
    position === 1 ? (
      <Crown size={16} strokeWidth={1.8} className="text-black dark:text-white" />
    ) : position === 2 ? (
      <Crown size={16} strokeWidth={1.8} className="text-zinc-500" />
    ) : position === 3 ? (
      <Crown size={16} strokeWidth={1.8} className="text-zinc-400" />
    ) : null

  return (
    <article
      className={[
        'grid gap-y-2 rounded-[1.25rem] border border-transparent px-4 py-4 transition md:grid-cols-[60px_1fr_80px_80px_90px_80px_80px_136px] md:items-center md:gap-y-0',
        isCurrentPlayer ? 'border-open-ink bg-open-bg' : 'bg-white hover:border-open-light',
      ].join(' ')}
    >
      {/* Posicion */}
      <div className="flex items-center gap-1.5 text-sm font-semibold text-open-ink">
        {posIcon}
        <span className={position <= 3 ? 'font-bold' : ''}>#{position}</span>
      </div>

      {/* Nombre + avatar */}
      <Link
        to={`/players/${player.id}`}
        className="flex min-w-0 items-center gap-3 transition hover:opacity-70"
      >
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[1rem] border border-open-light bg-open-bg text-sm font-black text-open-ink">
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt={player.full_name}
              className="h-full w-full object-cover"
            />
          ) : initials ? (
            initials
          ) : (
            <UserRound size={16} strokeWidth={1.8} />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-open-ink">
            {player.full_name || 'Jugador OPEN'}
            {isCurrentPlayer && (
              <span className="ml-2 text-xs font-normal text-open-muted">(Tú)</span>
            )}
          </p>
          <p className="mt-0.5 truncate text-xs text-open-muted md:hidden">
            Cat. {category} · {formatAgeGroup(player.age_group)} · Rating {getRating(player)}
          </p>
        </div>
      </Link>

      {/* Categoria */}
      <span className="hidden text-sm font-semibold text-open-ink md:block">
        {category}
      </span>

      {/* Grupo */}
      <span className="hidden text-sm text-open-muted md:block">
        {formatAgeGroup(player.age_group)}
      </span>

      {/* Nivel */}
      <span className="hidden text-sm font-semibold text-open-ink md:block">
        Nv. {player.level || 1}
      </span>

      {/* Rating */}
      <span className="hidden text-sm font-semibold text-open-ink md:block">
        {getRating(player)}
      </span>

      {/* V/D */}
      <span className="hidden text-sm text-open-muted md:block">
        {matchCount > 0 ? (
          <>
            <span className="font-semibold text-open-ink">{wins}</span>
            <span className="text-open-muted">/{losses}</span>
            {winRate !== null && (
              <span className="ml-1 text-xs text-open-muted">({winRate}%)</span>
            )}
          </>
        ) : (
          <span className="text-open-muted">—</span>
        )}
      </span>

      {/* Mobile stats row */}
      <div className="flex items-center gap-4 text-xs text-open-muted md:hidden">
        <span>
          V/D: <span className="font-semibold text-open-ink">{wins}</span>/{losses}
          {winRate !== null ? ` (${winRate}%)` : ''}
        </span>
        <span>Nv. {player.level || 1}</span>
      </div>

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCompare}
          disabled={isCurrentPlayer}
          title="Face to Face"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-open-light bg-open-bg px-3 text-xs font-black text-open-ink transition hover:border-open-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Swords size={14} strokeWidth={1.8} />
          <span className="hidden sm:inline">H2H</span>
        </button>
        <Link
          to={`/players/${player.id}`}
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-open-light bg-open-bg px-3 text-xs font-black text-open-ink transition hover:border-open-primary"
        >
          Ver perfil
        </Link>
      </div>
    </article>
  )
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

function formatAgeGroup(value) {
  const labels = { junior: 'Junior', juvenil: 'Juvenil', adulto: 'Adulto', senior: 'Senior' }
  return labels[value] || '—'
}

export default RankingView
