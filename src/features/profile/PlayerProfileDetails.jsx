import { Flame, Lock, Medal, Swords, Trophy } from 'lucide-react'

const achievementItems = [
  { label: 'Primer Paso', state: 'unlocked' },
  { label: 'Entrenador', state: 'unlocked' },
  { label: 'Ganador', state: 'locked' },
  { label: 'Campeon', state: 'locked' },
]

function PlayerProfileDetails({ profile }) {
  const skillBars = buildSkillBars(profile)
  const matchStats = buildMatchStats(profile)
  const recentMatches = profile?.recentMatches || []
  const streakMap = buildStreakMap(profile)
  const stats = [
    { label: 'Ranking', value: profile?.ranking || '--' },
    { label: 'Partidos', value: recentMatches.length || profile?.matchCount || 0 },
    { label: 'Victorias', value: countWins(profile) },
    { label: 'Racha', value: `${profile?.currentStreak || 0}` },
  ]
  const streaks = [
    { label: 'Entrenamientos', value: `${profile?.trainingStreak || 0} dias` },
    { label: 'Victorias', value: `${streakMap.wins || 0} seguidas` },
    { label: 'Derrotas', value: `${streakMap.losses || 0} seguidas` },
    { label: 'Partidos', value: `${streakMap.matches || 0} dias` },
  ]

  return (
    <div className="grid gap-5">
      <section className="grid gap-3 sm:grid-cols-4">
        {stats.map((item) => (
          <article
            key={item.label}
            className="border border-open-light bg-open-surface p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-open-ink">
              {item.value}
            </p>
          </article>
        ))}
      </section>

      <section className="border border-open-light bg-open-surface p-5">
        <SectionTitle title="Habilidades" />
        <div className="mt-5 grid gap-4">
          {skillBars.map((skill) => (
            <SkillBar key={skill.label} skill={skill} />
          ))}
        </div>
      </section>

      <section className="border border-open-light bg-open-surface p-5">
        <SectionTitle title="Estadisticas de partido" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {matchStats.map((item) => (
            <article
              key={item.label}
              className="border border-open-light bg-open-bg p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-open-ink">
                {item.value}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="border border-open-light bg-open-surface p-5">
          <SectionTitle title="Medallas" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            {achievementItems.map((item) => (
              <Achievement key={item.label} item={item} />
            ))}
          </div>
        </article>

        <article className="border border-open-light bg-open-surface p-5">
          <SectionTitle title="Rachas activas" />
          <div className="mt-5 grid gap-3">
            {streaks.map((streak) => (
              <div
                key={streak.label}
                className="flex items-center justify-between border border-open-light bg-open-bg p-3"
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-open-ink">
                  <Flame size={16} strokeWidth={1.8} />
                  {streak.label}
                </span>
                <span className="text-sm font-semibold text-open-muted">
                  {streak.value}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="border border-open-light bg-open-surface p-5">
          <SectionTitle title="Historial" />
          <div className="mt-5 grid gap-3">
            {recentMatches.length ? (
              recentMatches.map((match) => (
                <MatchHistoryItem
                  key={match.id}
                  match={match}
                  profile={profile}
                />
              ))
            ) : (
              <div className="flex items-center justify-between border border-open-light bg-open-bg p-3">
                <div>
                  <p className="text-sm font-semibold text-open-ink">
                    Amistosos
                  </p>
                  <p className="mt-1 text-xs text-open-muted">
                    Sin partidos registrados
                  </p>
                </div>
                <span className="text-sm font-semibold text-open-muted">
                  0-0
                </span>
              </div>
            )}
          </div>
        </article>

        <article className="border border-open-light bg-open-surface p-5">
          <SectionTitle title="Trofeos" />
          <div className="mt-5 grid gap-3">
            <div className="flex items-center gap-3 border border-open-light bg-open-bg p-3">
              <div className="grid h-11 w-11 place-items-center border border-open-light bg-open-surface">
                <Trophy size={18} strokeWidth={1.8} />
              </div>
              <div>
                <p className="text-sm font-semibold text-open-ink">
                  Copa Primavera
                </p>
                <p className="mt-1 text-xs text-open-muted">
                  Disponible al cerrar torneos
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}

function MatchHistoryItem({ match, profile }) {
  const isWinner = String(match.winner_player_id) === String(profile?.playerId)

  return (
    <div className="flex items-center justify-between gap-3 border border-open-light bg-open-bg p-3">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center border border-open-light bg-open-surface">
          <Swords size={16} strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-semibold text-open-ink">
            {isWinner ? 'Victoria' : 'Partido amistoso'}
          </p>
          <p className="mt-1 text-xs text-open-muted">
            {match.match_date} - {formatStatus(match.status)}
          </p>
        </div>
      </div>
      <span className="text-sm font-semibold text-open-muted">
        {match.score}
      </span>
    </div>
  )
}

function SectionTitle({ title }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
      {title}
    </h2>
  )
}

function SkillBar({ skill }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="text-open-ink">{skill.label}</span>
        <span className="text-open-muted">{skill.score}/10</span>
      </div>
      <div className="mt-2 h-2 border border-open-light bg-open-bg">
        <div className="h-full bg-open-ink" style={{ width: `${skill.value}%` }} />
      </div>
    </div>
  )
}

function Achievement({ item }) {
  const isUnlocked = item.state === 'unlocked'
  const Icon = isUnlocked ? Medal : Lock

  return (
    <div
      className={[
        'border p-3',
        isUnlocked
          ? 'border-open-ink bg-open-ink text-white'
          : 'border-open-light bg-open-bg text-open-muted',
      ].join(' ')}
    >
      <Icon size={18} strokeWidth={1.8} />
      <p className="mt-3 text-sm font-semibold">{item.label}</p>
      <p className="mt-1 text-xs opacity-70">
        {isUnlocked ? 'Desbloqueada' : 'Bloqueada'}
      </p>
    </div>
  )
}

function buildSkillBars(profile) {
  const stats = profile?.stats || {}
  return [
    { label: 'Derecha', value: stats.stat_derecha ?? 50 },
    { label: 'Reves', value: stats.stat_reves ?? 50 },
    { label: 'Saque', value: stats.stat_saque ?? 50 },
    { label: 'Volea', value: stats.stat_volea ?? 50 },
    { label: 'Movilidad', value: stats.stat_movilidad ?? 50 },
    { label: 'Slice', value: stats.stat_slice ?? 50 },
  ].map((skill) => ({
    ...skill,
    score: Math.round(skill.value / 10),
  }))
}

function buildMatchStats(profile) {
  const stats = profile?.matchStats || {}

  return [
    { label: 'Aces', value: stats.aces || 0 },
    { label: 'Dobles faltas', value: stats.doubleFaults || 0 },
    { label: 'Winners', value: stats.winners || 0 },
    { label: 'Errores NF', value: stats.unforcedErrors || 0 },
    { label: 'Errores forzados', value: stats.forcedErrors || 0 },
    { label: 'Puntos partido', value: stats.matchPoints || 0 },
    { label: 'Puntos contra', value: stats.pointsAgainst || 0 },
  ]
}

function buildStreakMap(profile) {
  return (profile?.streakRows || []).reduce((map, streak) => {
    map[streak.streak_type] = streak.current_count || 0
    return map
  }, {})
}

function countWins(profile) {
  const playerId = String(profile?.playerId || '')
  if (!playerId) return profile?.wins || 0

  return (profile?.recentMatches || []).filter(
    (match) =>
      match.status === 'confirmed' &&
      String(match.winner_player_id) === playerId,
  ).length
}

function formatStatus(status) {
  const labels = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    rejected: 'Rechazado',
    expired: 'Expirado',
  }

  return labels[status] || status
}

export default PlayerProfileDetails
