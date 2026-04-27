import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { ArrowLeft } from 'lucide-react'
import { getRating } from './competitionUtils'

function FaceToFaceView() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const playerOne = state?.playerOne
  const playerTwo = state?.playerTwo

  if (!playerOne || !playerTwo) {
    return (
      <section className="grid gap-5">
        <button
          type="button"
          onClick={() => navigate('/ranking')}
          className="inline-flex h-10 w-fit items-center gap-2 border border-open-light bg-open-surface px-3 text-sm font-semibold text-open-ink"
        >
          <ArrowLeft size={16} strokeWidth={1.8} />
          Volver al ranking
        </button>
        <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
          Selecciona un jugador desde el ranking para comparar.
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
      <button
        type="button"
        onClick={() => navigate('/ranking')}
        className="inline-flex h-10 w-fit items-center gap-2 border border-open-light bg-open-surface px-3 text-sm font-semibold text-open-ink transition hover:border-open-primary"
      >
        <ArrowLeft size={16} strokeWidth={1.8} />
        Ranking
      </button>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border border-open-light bg-open-surface p-5 md:p-8">
        <PlayerHeader player={playerOne} align="left" />
        <motion.div
          className="font-display text-4xl italic text-open-primary md:text-6xl"
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
              <PolarGrid stroke="#0D0D0F" strokeOpacity={0.14} />
              <PolarAngleAxis
                dataKey="skill"
                tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }}
              />
              <Radar
                dataKey="playerOne"
                stroke="#2B2B2D"
                strokeWidth={1.5}
                fill="#2B2B2D"
                fillOpacity={0.6}
              />
              <Radar
                dataKey="playerTwo"
                stroke="#0D0D0F"
                strokeWidth={2}
                fill="transparent"
                fillOpacity={0}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.article>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Historial H2H" value="2 - 1" detail="Datos demo" />
        <StatCard
          label={playerOne.full_name || 'Jugador 1'}
          value={getRating(playerOne)}
          detail="Rating"
        />
        <StatCard
          label={playerTwo.full_name || 'Jugador 2'}
          value={getRating(playerTwo)}
          detail="Rating"
        />
      </div>
    </motion.section>
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

function StatCard({ label, value, detail }) {
  return (
    <article className="border border-open-light bg-open-surface p-5">
      <p className="text-sm font-semibold text-open-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-open-ink">{value}</p>
      <p className="mt-1 text-sm text-open-muted">{detail}</p>
    </article>
  )
}

function buildRadarData(playerOne, playerTwo) {
  return [
    ['Ataque', 'stat_ataque'],
    ['Defensa', 'stat_defensa'],
    ['Saque', 'stat_saque'],
    ['Físico', 'stat_fisico'],
    ['Mentalidad', 'stat_mentalidad'],
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
