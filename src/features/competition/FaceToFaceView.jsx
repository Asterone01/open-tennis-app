import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { ArrowLeft } from 'lucide-react'
import usePlayerProfile from '../profile/usePlayerProfile'
import { supabase } from '../../lib/supabase'
import { getRating } from './competitionUtils'

function FaceToFaceView() {
  const navigate = useNavigate()
  const { opponentId } = useParams()
  const { state } = useLocation()
  const { player: currentPlayer, isLoading: isProfileLoading } =
    usePlayerProfile()
  const [playerOne, setPlayerOne] = useState(state?.playerOne || null)
  const [playerTwo, setPlayerTwo] = useState(state?.playerTwo || null)
  const [isLoading, setIsLoading] = useState(Boolean(opponentId))
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadPlayers = async () => {
      if (!opponentId || isProfileLoading) return

      const basePlayer = state?.playerOne || currentPlayer

      if (!basePlayer) return

      setIsLoading(true)
      setError('')

      const { data: opponent, error: opponentError } = await supabase
        .from('players')
        .select('*')
        .eq('id', opponentId)
        .maybeSingle()

      if (!isMounted) return

      if (opponentError || !opponent) {
        setError(opponentError?.message || 'No se encontró el rival.')
      } else {
        setPlayerOne(basePlayer)
        setPlayerTwo(opponent)
      }

      setIsLoading(false)
    }

    loadPlayers()

    return () => {
      isMounted = false
    }
  }, [currentPlayer, isProfileLoading, opponentId, state?.playerOne])

  if (isLoading) {
    return <p className="text-sm text-open-muted">Cargando comparación...</p>
  }

  if (error || !playerOne || !playerTwo) {
    return (
      <section className="grid gap-5">
        <BackButton onClick={() => navigate('/ranking')} />
        <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
          {error || 'Selecciona un jugador desde el ranking para comparar.'}
        </p>
      </section>
    )
  }

  const chartData = buildRadarData(playerOne, playerTwo)

  return (
    <motion.section
      className="grid gap-6 bg-open-bg"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <BackButton onClick={() => navigate('/ranking')} />

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border border-open-light bg-open-surface p-5 md:p-8">
        <PlayerHeader player={playerOne} align="left" />
        <motion.div
          className="font-display text-3xl italic text-open-primary md:text-6xl"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.42, ease: 'easeOut' }}
        >
          VS
        </motion.div>
        <PlayerHeader player={playerTwo} align="right" />
      </div>

      <motion.article
        className="border border-open-light bg-open-surface p-4 md:p-6"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.18, duration: 0.5, ease: 'easeOut' }}
      >
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData} outerRadius="72%">
              <PolarGrid stroke="var(--color-primary)" strokeOpacity={0.14} />
              <PolarAngleAxis
                dataKey="skill"
                tick={{
                  fill: 'var(--color-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <Radar
                dataKey="playerOne"
                stroke="var(--color-primary)"
                strokeWidth={1.5}
                fill="var(--color-primary)"
                fillOpacity={0.8}
              />
              <Radar
                dataKey="playerTwo"
                stroke="var(--color-muted)"
                strokeWidth={2}
                fill="transparent"
                fillOpacity={0}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.article>

      <div className="grid gap-4 md:grid-cols-3">
        <CompareStat label="XP" left={playerOne.xp || 0} right={playerTwo.xp || 0} />
        <CompareStat
          label="Nivel"
          left={playerOne.level || 1}
          right={playerTwo.level || 1}
        />
        <CompareStat
          label="ELO"
          left={getRating(playerOne)}
          right={getRating(playerTwo)}
        />
      </div>
    </motion.section>
  )
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 w-fit items-center gap-2 border border-open-light bg-open-surface px-3 text-sm font-semibold text-open-ink transition hover:border-open-primary"
    >
      <ArrowLeft size={16} strokeWidth={1.8} />
      Ranking
    </button>
  )
}

function PlayerHeader({ player, align }) {
  const initials = getInitials(player.full_name || player.email || 'OPEN')

  return (
    <div
      className={[
        'flex min-w-0 items-center gap-3',
        align === 'right' ? 'flex-row-reverse text-right' : '',
      ].join(' ')}
    >
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-open-light bg-open-bg text-lg font-semibold text-open-ink">
        {initials}
      </div>
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-open-ink md:text-2xl">
          {player.full_name || 'Jugador OPEN'}
        </h1>
        <p className="mt-1 text-sm font-semibold text-open-muted">
          LVL {player.level || 1}
        </p>
      </div>
    </div>
  )
}

function CompareStat({ label, left, right }) {
  return (
    <article className="border border-open-light bg-open-surface p-5">
      <p className="text-sm font-semibold text-open-muted">{label}</p>
      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <p className="text-2xl font-semibold text-open-ink">{left}</p>
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
          vs
        </span>
        <p className="text-right text-2xl font-semibold text-open-ink">{right}</p>
      </div>
    </article>
  )
}

function buildRadarData(playerOne, playerTwo) {
  return [
    ['Derecha', 'stat_derecha'],
    ['Reves', 'stat_reves'],
    ['Saque', 'stat_saque'],
    ['Volea', 'stat_volea'],
    ['Movilidad', 'stat_movilidad'],
    ['Slice', 'stat_slice'],
  ].map(([skill, key]) => ({
    skill,
    playerOne: playerOne[key] ?? 50,
    playerTwo: playerTwo[key] ?? 50,
  }))
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

export default FaceToFaceView
