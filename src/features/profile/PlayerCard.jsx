import { Camera } from 'lucide-react'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { calculateLevelFromXp, getNextLevelXp } from '../gamification/xpLedger'

function PlayerCard({
  profile,
  canEditAvatar = false,
  isAvatarUploading = false,
  onAvatarClick,
}) {
  const fullName = profile?.fullName || 'Jugador OPEN'
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
  const xp = profile?.xp || 0
  const level = calculateLevelFromXp(xp)
  const category =
    profile?.currentCategory || profile?.suggestedCategory || 'Sin categoria'
  const ageGroup = formatAgeGroup(profile?.ageGroup)
  const membership = formatMembership(profile?.clubMembershipStatus)
  const clubName = profile?.clubName || 'Sin club'
  const cardColor = resolveCardColor(profile)
  const playerSkills = buildRadarData(profile)
  const rating = calculateRating(playerSkills)
  const nextLevelXp = getNextLevelXp(level)
  const progress = Math.min(Math.round((xp / nextLevelXp) * 100), 100)

  return (
    <article
      className="relative overflow-hidden border border-black/20 p-6 text-white"
      style={{ backgroundColor: cardColor }}
    >
      <div className="pointer-events-none absolute inset-0 bg-black/35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-white/10" />

      <header className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onAvatarClick}
            disabled={!canEditAvatar || isAvatarUploading}
            className={[
              'relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-xl font-semibold',
              canEditAvatar
                ? 'cursor-pointer transition hover:border-white/60'
                : 'cursor-default',
            ].join(' ')}
            aria-label={
              canEditAvatar ? 'Cambiar foto de perfil' : 'Foto de perfil'
            }
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              initials || 'OP'
            )}
            {canEditAvatar ? (
              <span className="absolute inset-x-0 bottom-0 grid h-6 place-items-center bg-black/55 text-white">
                <Camera size={13} strokeWidth={1.8} />
              </span>
            ) : null}
            {isAvatarUploading ? (
              <span className="absolute inset-0 grid place-items-center bg-black/60 text-[10px] font-semibold uppercase tracking-[0.12em]">
                Subiendo
              </span>
            ) : null}
          </button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Player Card
            </p>
            <h2 className="mt-2 truncate text-2xl font-semibold text-white">
              {fullName}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/65">
              <span className="border border-white/15 px-2 py-1">
                {clubName}
              </span>
              <span className="border border-white/15 px-2 py-1">
                Cat. {category}
              </span>
              <span className="border border-white/15 px-2 py-1">
                {ageGroup}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 border border-white/15 bg-white px-4 py-3 text-center text-[#0D0D0F]">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45">
            Level
          </span>
          <strong className="block font-display text-xl font-black leading-none tracking-[0.08em]">
            LVL {level}
          </strong>
        </div>
      </header>

      <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-2">
        <HeroMetric
          label="XP Experiencia"
          value={`${xp.toLocaleString()} pts`}
          detail={`${progress}% hacia Nivel ${level + 1}`}
        />
        <HeroMetric
          label={`Rating Cat. ${category}`}
          value={`${rating} / 100`}
          detail="Actualizado por evaluacion"
        />
      </div>

      <div className="relative z-10 mt-6 h-72">
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

      <footer className="relative z-10 mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-4">
        <Metric label="Club" value={clubName} />
        <Metric label="Membresia" value={membership} />
        <Metric label="Ranking" value={profile?.ranking || '--'} />
        <Metric label="Racha" value={`${profile?.currentStreak || 0} dias`} />
      </footer>
    </article>
  )
}

function buildRadarData(profile) {
  return [
    { skill: 'Derecha', value: profile?.stats?.stat_derecha ?? 50 },
    { skill: 'Reves', value: profile?.stats?.stat_reves ?? 50 },
    { skill: 'Saque', value: profile?.stats?.stat_saque ?? 50 },
    { skill: 'Volea', value: profile?.stats?.stat_volea ?? 50 },
    { skill: 'Movilidad', value: profile?.stats?.stat_movilidad ?? 50 },
    { skill: 'Slice', value: profile?.stats?.stat_slice ?? 50 },
  ]
}

function resolveCardColor(profile) {
  if (profile?.playerCardColor) {
    return profile.playerCardColor
  }

  if (profile?.clubPrimaryColor) {
    return profile.clubPrimaryColor
  }

  return '#0D0D0F'
}

function calculateRating(skills) {
  const total = skills.reduce((sum, skill) => sum + skill.value, 0)
  return Math.round(total / skills.length)
}

function formatAgeGroup(value) {
  const labels = {
    junior: 'Junior',
    juvenil: 'Juvenil',
    adulto: 'Adulto',
    senior: 'Senior',
  }

  return labels[value] || 'Sin grupo'
}

function formatMembership(value) {
  const labels = {
    unassigned: 'Sin club',
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  }

  return labels[value] || 'Sin club'
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

function HeroMetric({ label, value, detail }) {
  return (
    <div className="border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
        {label}
      </p>
      <p className="mt-3 font-display text-2xl italic text-white">{value}</p>
      <p className="mt-2 text-xs font-semibold text-white/45">{detail}</p>
    </div>
  )
}

export default PlayerCard
