import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Swords, UserRound } from 'lucide-react'
import usePlayerProfile from '../profile/usePlayerProfile'
import { supabase } from '../../lib/supabase'
import { getRating } from './competitionUtils'

function RankingView() {
  const navigate = useNavigate()
  const { player: currentPlayer, profile, isLoading: isProfileLoading } =
    usePlayerProfile()
  const [players, setPlayers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadRanking = async () => {
      if (isProfileLoading) return

      setIsLoading(true)
      setError('')

      if (!profile.clubId) {
        setPlayers([])
        setIsLoading(false)
        return
      }

      const { data, error: rankingError } = await supabase
        .from('players')
        .select('*')
        .eq('club_id', profile.clubId)

      if (!isMounted) return

      if (rankingError) {
        setError(rankingError.message)
      } else {
        setPlayers(data || [])
      }

      setIsLoading(false)
    }

    loadRanking()

    return () => {
      isMounted = false
    }
  }, [isProfileLoading, profile.clubId])

  const rankedPlayers = useMemo(
    () =>
      [...players].sort(
        (a, b) => getRating(b) - getRating(a) || (b.level || 1) - (a.level || 1),
      ),
    [players],
  )

  const handleCompare = (opponent) => {
    if (!currentPlayer || opponent.id === currentPlayer.id) return

    navigate(`/h2h/${opponent.id}`, {
      state: {
        playerOne: currentPlayer,
        playerTwo: opponent,
      },
    })
  }

  return (
    <motion.section
      className="grid gap-6 bg-open-bg"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
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
          Clasificación por rating y comparación Face-to-Face entre jugadores.
        </p>
      </div>

      {error ? (
        <p className="border border-open-light bg-open-surface px-4 py-3 text-sm text-open-muted">
          {error}
        </p>
      ) : null}

      {!profile.clubId && !isProfileLoading ? (
        <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
          Únete a un club desde tu perfil para ver el ranking.
        </p>
      ) : null}

      <div className="overflow-hidden border border-open-light bg-open-surface">
        <div className="hidden grid-cols-[72px_1fr_92px_110px_132px] border-b border-open-light px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-open-muted md:grid">
          <span>Pos</span>
          <span>Jugador</span>
          <span>Nivel</span>
          <span>Rating</span>
          <span>Acción</span>
        </div>

        <div className="grid">
          {rankedPlayers.map((player, index) => (
            <RankingRow
              key={player.id}
              player={player}
              position={index + 1}
              isCurrentPlayer={player.id === currentPlayer?.id}
              onCompare={() => handleCompare(player)}
            />
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-open-muted">Cargando ranking...</p>
      ) : null}
    </motion.section>
  )
}

function RankingRow({ player, position, isCurrentPlayer, onCompare }) {
  const topTone = ['text-black', 'text-zinc-700', 'text-zinc-400'][position - 1]
  const initials = getInitials(player.full_name || player.email || 'OPEN')

  return (
    <article className="grid gap-3 border-b border-open-light px-4 py-4 last:border-b-0 md:grid-cols-[72px_1fr_92px_110px_132px] md:items-center md:gap-0">
      <div className="flex items-center gap-2 text-sm font-semibold text-open-ink">
        {position <= 3 ? (
          <Crown size={18} strokeWidth={1.8} className={topTone} />
        ) : null}
        #{position}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center border border-open-light bg-open-bg text-sm font-semibold text-open-ink">
          {initials || <UserRound size={18} strokeWidth={1.8} />}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-open-ink">
            {player.full_name || 'Jugador OPEN'}
          </h2>
          <p className="mt-1 text-xs text-open-muted">
            {isCurrentPlayer ? 'Tú' : player.email}
          </p>
        </div>
      </div>

      <span className="text-sm font-semibold text-open-ink">
        LVL {player.level || 1}
      </span>
      <span className="text-sm font-semibold text-open-ink">
        {getRating(player)}
      </span>
      <button
        type="button"
        onClick={onCompare}
        disabled={isCurrentPlayer}
        className="inline-flex h-10 items-center justify-center gap-2 border border-open-light bg-open-bg px-3 text-sm font-semibold text-open-ink transition hover:border-open-primary disabled:cursor-not-allowed disabled:text-open-muted"
      >
        <Swords size={16} strokeWidth={1.8} />
        Comparar
      </button>
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

export default RankingView
