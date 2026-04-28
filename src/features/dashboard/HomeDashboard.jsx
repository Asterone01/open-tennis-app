import { useState } from 'react'
import { CalendarDays, Flame, Gauge, Swords } from 'lucide-react'
import DailyQuests from '../gamification/DailyQuests'
import LevelUpOverlay from '../gamification/LevelUpOverlay'
import XPHistoryPanel from '../gamification/XPHistoryPanel'
import { calculateLevelFromXp, getNextLevelXp } from '../gamification/xpLedger'
import usePlayerProfile from '../profile/usePlayerProfile'

function HomeDashboard() {
  const [showLevelUp, setShowLevelUp] = useState(false)
  const { player, profile } = usePlayerProfile()
  const xp = profile.xp || 0
  const level = calculateLevelFromXp(xp)
  const nextLevelXp = getNextLevelXp(level)
  const progress = Math.min(Math.round((xp / nextLevelXp) * 100), 100)
  const remainingXp = Math.max(nextLevelXp - xp, 0)

  return (
    <section className="grid gap-5">
      <LevelUpOverlay
        isOpen={showLevelUp}
        onClose={() => setShowLevelUp(false)}
      />

      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            Home Hub
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">
            Tu actividad OPEN
          </h1>
          <p className="mt-2 text-sm font-semibold text-open-muted">
            {profile.fullName} - Cat.{' '}
            {profile.currentCategory || profile.suggestedCategory || 'pendiente'}
          </p>
        </div>
        <p className="max-w-md text-sm leading-6 text-open-muted">
          Resumen competitivo, proximos retos y progreso de jugador.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowLevelUp(true)}
        className="sr-only"
      >
        Probar subida de nivel
      </button>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.9fr]">
        <article className="border border-open-light bg-open-surface p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-open-muted">Nivel y XP</p>
              <h2 className="mt-3 text-4xl font-semibold text-open-ink">
                Nivel {level}
              </h2>
            </div>
            <div className="grid h-11 w-11 place-items-center border border-open-light bg-open-bg">
              <Gauge size={20} strokeWidth={1.8} />
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>{xp.toLocaleString()} XP</span>
              <span className="text-open-muted">
                {nextLevelXp.toLocaleString()} XP
              </span>
            </div>
            <div className="mt-3 h-3 border border-open-light bg-open-bg">
              <div
                className="h-full bg-open-ink"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-open-muted">
              {remainingXp} XP para alcanzar el Nivel {level + 1}.
            </p>
          </div>
        </article>

        <article className="border border-open-light bg-open-surface p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-open-muted">
                Proximo partido
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-open-ink">
                Reto pendiente
              </h2>
            </div>
            <div className="grid h-11 w-11 place-items-center border border-open-light bg-open-bg">
              <Swords size={20} strokeWidth={1.8} />
            </div>
          </div>

          <div className="mt-8 grid gap-4 border-t border-open-light pt-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-open-muted">Rival</span>
              <span className="text-sm font-semibold text-open-ink">
                Mateo R.
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-open-muted">Horario</span>
              <span className="text-sm font-semibold text-open-ink">
                Hoy, 19:30
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-open-ink">
              <CalendarDays size={16} strokeWidth={1.8} />
              Cancha Central
            </div>
          </div>
        </article>
      </div>

      <article className="grid gap-5 border border-open-light bg-open-surface p-5 md:grid-cols-[auto_1fr_auto] md:items-center md:p-6">
        <div className="grid h-14 w-14 place-items-center border border-open-light bg-open-bg">
          <Flame size={24} strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-semibold text-open-muted">Racha</p>
          <h2 className="mt-1 text-3xl font-semibold text-open-ink">
            {profile.currentStreak} dias activos
          </h2>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <span
              key={index}
              className="h-9 w-9 border border-open-ink bg-open-ink text-center text-xs font-semibold leading-9 text-white"
            >
              {index + 1}
            </span>
          ))}
        </div>
      </article>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <DailyQuests />
        <XPHistoryPanel player={player} />
      </div>
    </section>
  )
}

export default HomeDashboard
