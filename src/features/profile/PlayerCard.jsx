import { useState } from 'react'
import { Camera, ChevronDown, ChevronUp, Shield, Trophy, User } from 'lucide-react'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { calculateLevelFromXp, getNextLevelXp } from '../gamification/xpLedger'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveCardColor(profile) {
  return profile?.playerCardColor || profile?.clubPrimaryColor || '#0D0D0F'
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `${r},${g},${b}`
}

function buildRadarData(profile) {
  return [
    { skill: 'Derecha',   value: profile?.stats?.stat_derecha   ?? 50 },
    { skill: 'Reves',     value: profile?.stats?.stat_reves     ?? 50 },
    { skill: 'Saque',     value: profile?.stats?.stat_saque     ?? 50 },
    { skill: 'Volea',     value: profile?.stats?.stat_volea     ?? 50 },
    { skill: 'Movilidad', value: profile?.stats?.stat_movilidad ?? 50 },
    { skill: 'Slice',     value: profile?.stats?.stat_slice     ?? 50 },
  ]
}

function calculateRating(skills) {
  return Math.round(skills.reduce((s, sk) => s + sk.value, 0) / skills.length)
}

function formatAgeGroup(v) {
  return { junior: 'Junior', juvenil: 'Juvenil', adulto: 'Adulto', senior: 'Senior' }[v] || ''
}

function formatMembership(v) {
  return { unassigned: 'Sin club', pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }[v] || '—'
}

function getRole(profile) {
  if (profile?.role === 'manager') return 'manager'
  if (profile?.isCoach) return 'coach'
  return 'player'
}

function initials(name) {
  return (name || 'OP')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

// ─── Main Component ───────────────────────────────────────────────────────────

function PlayerCard({ profile, canEditAvatar = false, isAvatarUploading = false, onAvatarClick }) {
  const [expanded, setExpanded] = useState(false)

  const role       = getRole(profile)
  const fullName   = profile?.fullName || 'Jugador OPEN'
  const xp         = profile?.xp || 0
  const level      = calculateLevelFromXp(xp)
  const nextXp     = getNextLevelXp(level)
  const progress   = Math.min(Math.round((xp / nextXp) * 100), 100)
  const category   = profile?.currentCategory || profile?.suggestedCategory || ''
  const ageGroup   = formatAgeGroup(profile?.ageGroup)
  const clubName   = profile?.clubName || 'Sin club'
  const membership = formatMembership(profile?.clubMembershipStatus)
  const cardColor  = resolveCardColor(profile)
  const rgb        = hexToRgb(cardColor.startsWith('#') ? cardColor : '#0D0D0F')

  const skills  = buildRadarData(profile)
  const rating  = calculateRating(skills)
  const hasAvatar = !!profile?.avatarUrl

  // Role badge config
  const roleMeta = {
    player:  { label: 'Player',  icon: User,   color: 'bg-white/15 text-white' },
    coach:   { label: 'Coach',   icon: Shield, color: 'bg-amber-400/20 text-amber-300' },
    manager: { label: 'Manager', icon: Trophy, color: 'bg-blue-400/20 text-blue-300' },
  }[role]
  const RoleIcon = roleMeta.icon

  return (
    <article
      className="relative overflow-hidden rounded-[2rem] border border-black/15 text-white shadow-2xl shadow-black/10 sm:rounded-[2.5rem]"
      style={{ backgroundColor: cardColor }}
    >
      {/* ── Texture overlay ── */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-black/25" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />

      {/* ── HERO ── */}
      <div className="relative min-h-[19rem] overflow-hidden sm:min-h-[22rem]">

        {/* Avatar — bleeds from right with gradient mask */}
        {hasAvatar ? (
          <>
            <img
              src={profile.avatarUrl}
              alt=""
              className="absolute inset-y-0 right-0 h-full w-full object-cover object-center opacity-85 md:w-3/5"
              style={{ maskImage: 'linear-gradient(to left, black 38%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to left, black 38%, transparent 100%)' }}
            />
            {/* Extra gradient so text is always readable */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: `linear-gradient(to right, rgb(${rgb}) 0%, rgba(${rgb},0.94) 38%, rgba(${rgb},0.62) 68%, transparent 100%)` }}
            />
          </>
        ) : (
          /* No avatar — decorative initials watermark */
          <div
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none text-[8rem] font-black leading-none tracking-tighter sm:text-[11rem]"
            style={{ color: `rgba(${rgb === '13,13,15' ? '255,255,255' : rgb},0.08)` }}
          >
            {initials(fullName)}
          </div>
        )}

        {/* Hero content */}
        <div className="relative z-10 flex min-h-[19rem] flex-col justify-between gap-5 p-5 sm:min-h-[22rem] sm:p-7">
          {/* Top row: role badge + level + avatar button */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest ${roleMeta.color}`}>
                <RoleIcon size={11} strokeWidth={2} />
                {roleMeta.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Level pill */}
              <div className="rounded-[1rem] border border-white/20 bg-white px-3 py-1.5 text-center text-[#0D0D0F] shadow-xl shadow-black/10">
                <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-black/40">Level</span>
                <strong className="block font-display text-base font-black leading-tight tracking-wider">LVL {level}</strong>
              </div>

              {/* Avatar button */}
              <button
                type="button"
                onClick={onAvatarClick}
                disabled={!canEditAvatar || isAvatarUploading}
                className={[
                  'relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-sm font-bold shadow-xl shadow-black/10 sm:h-14 sm:w-14',
                  canEditAvatar ? 'cursor-pointer hover:border-white/50 transition' : 'cursor-default',
                ].join(' ')}
                aria-label={canEditAvatar ? 'Cambiar foto de perfil' : undefined}
              >
                {hasAvatar ? (
                  <img src={profile.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  <span>{initials(fullName)}</span>
                )}
                {canEditAvatar && (
                  <span className="absolute inset-x-0 bottom-0 grid h-5 place-items-center bg-black/50">
                    <Camera size={11} strokeWidth={1.8} />
                  </span>
                )}
                {isAvatarUploading && (
                  <span className="absolute inset-0 grid place-items-center bg-black/60 text-[9px] font-semibold uppercase tracking-widest">
                    ...
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Name + tags */}
          <div>
            <h2 className="max-w-[11ch] text-4xl font-black leading-[0.9] tracking-tight text-white drop-shadow sm:text-5xl lg:text-6xl">
              {fullName}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Tag>{clubName}</Tag>
              {role !== 'manager' && category ? <Tag>Cat. {category}</Tag> : null}
              {role !== 'manager' && ageGroup ? <Tag>{ageGroup}</Tag> : null}
              {role === 'manager' ? <Tag>Manager</Tag> : null}
            </div>
          </div>
        </div>

        {/* XP progress bar at bottom of hero */}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
          <div
            className="h-full bg-white/60 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── METRICS ROW ── */}
      <div className="relative z-10 grid grid-cols-1 gap-px border-t border-white/10 bg-white/5 sm:grid-cols-2">
        {role === 'manager' ? (
          <>
            <HeroMetric label="Club" value={clubName} detail="Tu organización" />
            <HeroMetric label="Membresía" value={membership} detail="Estado actual" />
          </>
        ) : (
          <>
            <HeroMetric label="XP Experiencia" value={`${xp.toLocaleString()} pts`} detail={`${progress}% hacia Nivel ${level + 1}`} />
            <HeroMetric label={`Rating${category ? ` Cat. ${category}` : ''}`} value={`${rating} / 100`} detail="Actualizado por evaluación" />
          </>
        )}
      </div>

      {/* ── EXPAND TOGGLE ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="relative z-10 flex min-h-12 w-full items-center justify-center gap-2 border-t border-white/10 bg-white/5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/58 transition hover:bg-white/10 hover:text-white/86"
      >
        {expanded ? (
          <>Menos detalles <ChevronUp size={13} strokeWidth={2} /></>
        ) : (
          <>Ver habilidades y estadísticas <ChevronDown size={13} strokeWidth={2} /></>
        )}
      </button>

      {/* ── EXPANDED SECTION ── */}
      {expanded && (
        <div className="relative z-10 border-t border-white/10">
          {/* Radar chart — players and coaches only */}
          {role !== 'manager' && (
            <div className="h-64 px-4 pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={skills} outerRadius="72%">
                  <PolarGrid stroke="#FFFFFF" strokeOpacity={0.15} />
                  <PolarAngleAxis
                    dataKey="skill"
                    tick={{ fill: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 600 }}
                  />
                  <Radar
                    dataKey="value"
                    stroke="#FFFFFF"
                    strokeOpacity={0.9}
                    strokeWidth={1.5}
                    fill="#FFFFFF"
                    fillOpacity={0.12}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Footer metrics — role-specific */}
          <div className="grid gap-px border-t border-white/10 bg-white/5 sm:grid-cols-4">
            {role === 'player' && (
              <>
                <FooterMetric label="Club"      value={clubName} />
                <FooterMetric label="Membresía" value={membership} />
                <FooterMetric label="Ranking"   value={profile?.ranking || '--'} />
                <FooterMetric label="Racha"     value={`${profile?.currentStreak || 0} días`} />
              </>
            )}
            {role === 'coach' && (
              <>
                <FooterMetric label="Club"      value={clubName} />
                <FooterMetric label="Membresía" value={membership} />
                <FooterMetric label="Racha"     value={`${profile?.currentStreak || 0} días`} />
                <FooterMetric label="XP total"  value={`${xp.toLocaleString()} pts`} />
              </>
            )}
            {role === 'manager' && (
              <>
                <FooterMetric label="Club"      value={clubName} />
                <FooterMetric label="Membresía" value={membership} />
                <FooterMetric label="Nivel"     value={`LVL ${level}`} />
                <FooterMetric label="XP"        value={`${xp.toLocaleString()} pts`} />
              </>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tag({ children }) {
  return (
    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/72 backdrop-blur-sm">
      {children}
    </span>
  )
}

function HeroMetric({ label, value, detail }) {
  return (
    <div className="min-h-28 p-4 md:p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-2 text-xl font-black tracking-tight text-white">{value}</p>
      <p className="mt-1 text-[11px] text-white/40">{detail}</p>
    </div>
  )
}

function FooterMetric({ label, value }) {
  return (
    <div className="min-h-24 p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className="mt-1.5 text-base font-bold text-white">{value}</p>
    </div>
  )
}

export default PlayerCard
