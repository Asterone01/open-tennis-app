import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'

function PlayerCard({ profile }) {
  const fullName = profile?.fullName || 'Jugador OPEN'
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const level = profile?.level || 1
  const xp = profile?.xp || 0
  const playerSkills = [
    { skill: 'Ataque', value: profile?.stats?.stat_ataque ?? 50 },
    { skill: 'Defensa', value: profile?.stats?.stat_defensa ?? 50 },
    { skill: 'Saque', value: profile?.stats?.stat_saque ?? 50 },
    { skill: 'Fisico', value: profile?.stats?.stat_fisico ?? 50 },
    { skill: 'Mentalidad', value: profile?.stats?.stat_mentalidad ?? 50 },
  ]

  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#2B2B2D] bg-[#0D0D0F] p-6 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-white/5" />

      <header className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-xl font-semibold">
            {initials || 'OP'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Player Card
            </p>
            <h2 className="mt-2 truncate text-2xl font-semibold text-white">
              {fullName}
            </h2>
          </div>
        </div>

        <div className="shrink-0 rounded-xl border border-white/15 bg-white px-4 py-3 text-center text-[#0D0D0F]">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
            Level
          </span>
          <strong className="block font-display text-xl font-black leading-none tracking-[0.08em]">
            LVL {level}
          </strong>
        </div>
      </header>

      <div className="relative z-10 mt-8 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={playerSkills} outerRadius="74%">
            <PolarGrid stroke="#FFFFFF" strokeOpacity={0.18} />
            <PolarAngleAxis
              dataKey="skill"
              tick={{
                fill: 'rgba(255,255,255,0.72)',
                fontSize: 12,
                fontWeight: 600,
              }}
            />
            <Radar
              dataKey="value"
              stroke="#FFFFFF"
              strokeOpacity={0.9}
              strokeWidth={1.5}
              fill="#FFFFFF"
              fillOpacity={0.1}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <footer className="relative z-10 mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
        <Metric label="Ranking" value="#24" />
        <Metric label="Wins" value="38" />
        <Metric label="XP" value={formatNumber(xp)} />
      </footer>
    </article>
  )
}

function formatNumber(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }

  return String(value)
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

export default PlayerCard
