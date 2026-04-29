import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Search, Swords, UserRound } from 'lucide-react'
import usePlayerProfile from '../profile/usePlayerProfile'
import useManagerClub from '../../hooks/useManagerClub'
import { supabase } from '../../lib/supabase'
import { getRating } from './competitionUtils'

const CATEGORIES = ['D', 'C', 'B', 'A', 'Pro']
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
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
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
        <article className="grid grid-cols-[auto_1fr_auto] items-center gap-4 border border-open-ink bg-open-ink px-5 py-4">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Tu posicion
            </p>
            <p className="mt-1 text-3xl font-semibold text-white">
              #{myEntry.position}
            </p>
          </div>
          <div className="min-w-0 border-l border-white/20 pl-4">
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

      {/* Filtros */}
      <div className="grid gap-3 sm:grid-cols-[1fr_160px_160px]">
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
            className="h-11 w-full border border-open-light bg-open-surface pl-9 pr-3 text-sm text-open-ink outline-none focus:border-open-primary"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
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
          className="h-11 border border-open-light bg-open-surface px-3 text-sm text-open-ink outline-none focus:border-open-primary"
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
      <div className="overflow-hidden border border-open-light bg-open-surface">
        <div className="hidden grid-cols-[60px_1fr_80px_80px_90px_80px_80px_136px] border-b border-open-light px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-open-muted md:grid">
          <span>Pos</span>
          <span>Jugador</span>
          <span>Cat</span>
          <span>Grupo</span>
          <span>Nivel</span>
          <span>Rating</span>
          <span>V/P</span>
          <span>Accion</span>
        </div>

        <div className="grid divide-y divide-open-light">
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
        'grid gap-y-2 px-4 py-4 md:grid-cols-[60px_1fr_80px_80px_90px_80px_80px_136px] md:items-center md:gap-y-0',
        isCurrentPlayer ? 'bg-open-bg' : '',
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
        <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden border border-open-light bg-open-bg text-sm font-semibold text-open-ink">
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
          className="inline-flex h-9 items-center gap-1.5 border border-open-light bg-open-bg px-2.5 text-xs font-semibold text-open-ink transition hover:border-open-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Swords size={14} strokeWidth={1.8} />
          <span className="hidden sm:inline">H2H</span>
        </button>
        <Link
          to={`/players/${player.id}`}
          className="inline-flex h-9 items-center gap-1.5 border border-open-light bg-open-bg px-2.5 text-xs font-semibold text-open-ink transition hover:border-open-primary"
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
