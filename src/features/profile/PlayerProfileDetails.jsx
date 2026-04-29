import { useState } from 'react'
import { Flame, Lock, Medal, Swords, Trophy, X } from 'lucide-react'
import {
  ACHIEVEMENTS_CATALOG,
  ACHIEVEMENTS_ORDER,
} from '../gamification/achievementsLedger'

const RARITY_LABEL = { common: 'Comun', silver: 'Plata', gold: 'Oro' }

function PlayerProfileDetails({ profile }) {
  const [selectedAchievement, setSelectedAchievement] = useState(null)
  const skillBars = buildSkillBars(profile)
  const matchStats = buildMatchStats(profile)
  const recentMatches = profile?.recentMatches || []
  const streakMap = buildStreakMap(profile)
  const unlockedKeys = buildUnlockedMap(profile?.achievementRows || [])
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
            {ACHIEVEMENTS_ORDER.map((key) => {
              const def = ACHIEVEMENTS_CATALOG[key]
              const unlockedAt = unlockedKeys[key] || null
              return (
                <Achievement
                  key={key}
                  def={def}
                  unlockedAt={unlockedAt}
                  onPress={() => setSelectedAchievement({ def, unlockedAt })}
                />
              )
            })}
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
          <TrophyList trophies={profile?.trophyRows || []} />
        </article>
      </section>
      {selectedAchievement && (
        <AchievementModal
          def={selectedAchievement.def}
          unlockedAt={selectedAchievement.unlockedAt}
          onClose={() => setSelectedAchievement(null)}
        />
      )}
    </div>
  )
}

function AchievementModal({ def, unlockedAt, onClose }) {
  const isUnlocked = Boolean(unlockedAt)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm border border-open-light bg-open-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div
            className={[
              'grid h-12 w-12 shrink-0 place-items-center border',
              isUnlocked
                ? 'border-open-ink bg-open-ink text-white'
                : 'border-open-light bg-open-bg text-open-muted',
            ].join(' ')}
          >
            {isUnlocked ? (
              <Medal size={20} strokeWidth={1.8} />
            ) : (
              <Lock size={20} strokeWidth={1.8} />
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-auto grid h-8 w-8 place-items-center border border-open-light bg-open-bg text-open-muted transition hover:text-open-ink"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        <p className="mt-4 text-base font-semibold text-open-ink">{def.name}</p>
        <p className="mt-1 text-sm text-open-muted">{def.description}</p>

        <div className="mt-4 flex items-center gap-2 border-t border-open-light pt-4">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
            Rareza
          </span>
          <span className="ml-auto text-xs font-semibold uppercase tracking-[0.14em] text-open-ink">
            {RARITY_LABEL[def.rarity] || def.rarity}
          </span>
        </div>

        {isUnlocked && (
          <div className="flex items-center gap-2 border-t border-open-light pt-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
              Desbloqueada
            </span>
            <span className="ml-auto text-xs font-semibold text-open-ink">
              {new Date(unlockedAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        )}

        {!isUnlocked && (
          <p className="mt-3 border-t border-open-light pt-3 text-xs text-open-muted">
            Bloqueada — completa la condicion para desbloquear.
          </p>
        )}
      </div>
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

function Achievement({ def, unlockedAt, onPress }) {
  const isUnlocked = Boolean(unlockedAt)
  const Icon = isUnlocked ? Medal : Lock

  return (
    <button
      onClick={onPress}
      className={[
        'border p-3 text-left transition',
        isUnlocked
          ? 'border-open-ink bg-open-ink text-white hover:opacity-90'
          : 'border-open-light bg-open-bg text-open-muted hover:border-open-ink',
      ].join(' ')}
    >
      <Icon size={18} strokeWidth={1.8} />
      <p className="mt-3 text-sm font-semibold">{def.name}</p>
      <p className="mt-1 text-xs opacity-70">
        {isUnlocked ? 'Desbloqueada' : 'Bloqueada'}
      </p>
    </button>
  )
}

function TrophyList({ trophies }) {
  if (!trophies.length) {
    return (
      <div className="mt-5 flex items-center gap-3 border border-open-light bg-open-bg p-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center border border-open-light bg-open-surface">
          <Trophy size={18} strokeWidth={1.8} />
        </div>
        <p className="text-sm text-open-muted">Los trofeos aparecen al ganar torneos.</p>
      </div>
    )
  }

  return (
    <div className="mt-5 grid gap-3">
      {trophies.map((trophy) => (
        <div key={trophy.id} className="flex items-center gap-3 border border-open-ink bg-open-ink p-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center border border-white/20 bg-white/10">
            <Trophy size={18} strokeWidth={1.8} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {trophy.tournament_title}
            </p>
            <p className="mt-1 text-xs text-white/60">
              {trophy.club_name || 'Club OPEN'} ·{' '}
              {trophy.won_at
                ? new Date(trophy.won_at).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Fecha pendiente'}
            </p>
            {trophy.custom_message ? (
              <p className="mt-1 truncate text-xs italic text-white/70">
                "{trophy.custom_message}"
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function buildUnlockedMap(achievementRows) {
  return achievementRows.reduce((map, row) => {
    map[row.achievement_key] = row.unlocked_at
    return map
  }, {})
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
