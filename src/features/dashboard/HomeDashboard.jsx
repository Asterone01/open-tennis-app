import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Flame, Gauge, Medal, Swords, Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import DailyQuests from '../gamification/DailyQuests'
import XPHistoryPanel from '../gamification/XPHistoryPanel'
import { calculateLevelFromXp, getNextLevelXp } from '../gamification/xpLedger'
import usePlayerProfile from '../profile/usePlayerProfile'

const PLAYER_HERO_IMAGE =
  'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1800&q=80'

const actionBanners = [
  {
    kicker: 'Competir',
    title: 'Crear partido.',
    detail: 'Reta, registra marcador o confirma resultados.',
    to: '/matches',
    image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=1400&q=80',
    icon: Swords,
  },
  {
    kicker: 'Torneo',
    title: 'Entrar al bracket.',
    detail: 'Inscripciones, calendario y resultados.',
    to: '/tournaments',
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=1400&q=80',
    icon: Trophy,
  },
  {
    kicker: 'Club',
    title: 'Reservar cancha.',
    detail: 'Cancha, fecha, horario y reservas activas.',
    to: '/canchas',
    image: 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1400&q=80',
    icon: Calendar,
  },
]

function HomeDashboard() {
  const { player, profile } = usePlayerProfile()
  const xp = profile.xp || 0
  const level = calculateLevelFromXp(xp)
  const nextLevelXp = getNextLevelXp(level)
  const progress = Math.min(Math.round((xp / nextLevelXp) * 100), 100)
  const remainingXp = Math.max(nextLevelXp - xp, 0)

  const [pendingMatches, setPendingMatches] = useState([])
  const [lastMatch, setLastMatch] = useState(null)
  const [winStreak, setWinStreak] = useState(0)
  const [recentAchievements, setRecentAchievements] = useState([])
  const [nextTournament, setNextTournament] = useState(null)

  useEffect(() => {
    if (!player?.id) return
    let isMounted = true

    const load = async () => {
      const [pendingRes, historyRes, streaksRes, achievementsRes, tournamentRes] =
        await Promise.all([
          supabase
            .from('friendly_matches')
            .select('id, score, match_date, created_by_player_id, winner_player_id')
            .eq('opponent_player_id', String(player.id))
            .eq('status', 'pending')
            .order('match_date', { ascending: false })
            .limit(5),
          supabase
            .from('friendly_matches')
            .select('id, score, match_date, winner_player_id, created_by_player_id, opponent_player_id')
            .or(`created_by_player_id.eq.${player.id},opponent_player_id.eq.${player.id}`)
            .eq('status', 'confirmed')
            .order('match_date', { ascending: false })
            .limit(1),
          supabase
            .from('streaks')
            .select('streak_type, current_count, status')
            .eq('player_id', String(player.id)),
          supabase
            .from('player_achievements')
            .select('achievement_key, unlocked_at')
            .eq('player_id', String(player.id))
            .order('unlocked_at', { ascending: false })
            .limit(3),
          supabase
            .from('tournament_entries')
            .select('tournament_id, tournaments(id, title, start_date, status)')
            .eq('player_id', String(player.id))
            .in('tournaments.status', ['open', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(1),
        ])

      if (!isMounted) return

      setPendingMatches(pendingRes.data || [])
      setLastMatch((historyRes.data || [])[0] || null)
      setWinStreak((streaksRes.data || []).find((s) => s.streak_type === 'wins')?.current_count || 0)
      setRecentAchievements(achievementsRes.data || [])
      setNextTournament((tournamentRes.data || [])[0]?.tournaments || null)
    }

    load()
    return () => { isMounted = false }
  }, [player?.id])

  const isWinner = lastMatch
    ? String(lastMatch.winner_player_id) === String(player?.id)
    : null

  const category = profile.currentCategory || profile.suggestedCategory || 'Pendiente'

  return (
    <section className="grid gap-5">
      <article className="relative overflow-hidden rounded-[2rem] border border-open-light bg-open-ink text-white shadow-xl shadow-black/5">
        <img src={PLAYER_HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/15" />
        <div className="relative grid gap-8 p-7 sm:p-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">Player dashboard</p>
            <h1 className="mt-5 max-w-2xl text-5xl font-black leading-[0.92] md:text-7xl">
              {profile.fullName || 'Jugador OPEN'}
            </h1>
            <p className="mt-5 max-w-xl text-sm font-semibold leading-6 text-white/72">
              Cat. {category} · {profile.ageGroupLabel || 'Sin grupo'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <HeroMetric label="Nivel" value={level} />
            <HeroMetric label="XP" value={xp.toLocaleString('es')} />
            <HeroMetric label="Racha" value={winStreak} />
            <HeroMetric label="Pendientes" value={pendingMatches.length} />
          </div>
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-3">
        {actionBanners.map((action) => (
          <ActionBanner key={action.title} action={action} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <ProgressPanel
          level={level}
          xp={xp}
          nextLevelXp={nextLevelXp}
          progress={progress}
          remainingXp={remainingXp}
        />
        <StreakPanel lastMatch={lastMatch} isWinner={isWinner} winStreak={winStreak} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <PendingMatchesPanel pendingMatches={pendingMatches} />
        <TournamentPanel nextTournament={nextTournament} />
      </div>

      <AchievementsPanel achievements={recentAchievements} />

      <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <section className="rounded-[2rem] border border-open-light bg-open-surface p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-open-ink text-white">
              <Flame size={18} strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">Diario</p>
              <h2 className="text-2xl font-black text-open-ink">Retos del dia</h2>
            </div>
          </div>
          <DailyQuests />
        </section>
        <XPHistoryPanel player={player} />
      </div>
    </section>
  )
}

function HeroMetric({ label, value }) {
  return (
    <article className="rounded-[1.4rem] border border-white/10 bg-white/15 p-4 text-white backdrop-blur-md">
      <p className="text-3xl font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">{label}</p>
    </article>
  )
}

function ActionBanner({ action }) {
  const Icon = action.icon
  return (
    <Link
      to={action.to}
      className="group relative min-h-64 overflow-hidden rounded-[2rem] border border-open-light bg-open-ink p-5 text-white shadow-xl shadow-black/5 transition hover:border-open-ink"
    >
      <img src={action.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/68 to-black/10" />
      <div className="relative flex h-full min-h-56 flex-col justify-between">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-200/90">{action.kicker}</p>
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-open-ink">
            <Icon size={18} strokeWidth={2.2} />
          </span>
        </div>
        <div>
          <h2 className="max-w-[10ch] text-4xl font-black leading-[0.95]">{action.title}</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-white/72">{action.detail}</p>
        </div>
      </div>
    </Link>
  )
}

function ProgressPanel({ level, xp, nextLevelXp, progress, remainingXp }) {
  return (
    <section className="rounded-[2rem] border border-open-light bg-open-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">Progreso</p>
          <h2 className="mt-2 text-3xl font-black text-open-ink">Nivel {level}</h2>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-full bg-open-ink text-white">
          <Gauge size={20} strokeWidth={2} />
        </div>
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm font-bold">
          <span>{xp.toLocaleString('es')} XP</span>
          <span className="text-open-muted">{nextLevelXp.toLocaleString('es')} XP</span>
        </div>
        <div className="mt-3 h-3 rounded-full bg-open-light">
          <div className="h-full rounded-full bg-open-ink" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-sm font-semibold text-open-muted">
          {remainingXp.toLocaleString('es')} XP para Nivel {level + 1}
        </p>
      </div>
    </section>
  )
}

function StreakPanel({ lastMatch, isWinner, winStreak }) {
  return (
    <section className="rounded-[2rem] border border-open-light bg-open-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">Racha</p>
          <h2 className="mt-2 text-5xl font-black text-open-ink">{winStreak}</h2>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-full bg-open-ink text-white">
          <Flame size={20} strokeWidth={2} />
        </div>
      </div>
      <p className="mt-5 text-sm font-semibold leading-6 text-open-muted">
        {winStreak === 0
          ? 'Gana tu proximo partido para iniciar una racha.'
          : winStreak === 1
            ? '1 victoria seguida. Sigue asi.'
            : `${winStreak} victorias consecutivas.`}
      </p>
      {lastMatch ? (
        <p className="mt-3 text-sm font-black text-open-ink">
          Ultimo partido:{' '}
          <span className={isWinner ? 'text-open-primary' : 'text-open-muted'}>
            {isWinner ? 'Victoria' : 'Derrota'}
          </span>
          {lastMatch.score ? ` · ${lastMatch.score}` : ''}
        </p>
      ) : null}
    </section>
  )
}

function PendingMatchesPanel({ pendingMatches }) {
  return (
    <section className="rounded-[2rem] border border-open-light bg-open-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">Confirmaciones</p>
          <h2 className="mt-1 text-2xl font-black text-open-ink">Partidos pendientes</h2>
        </div>
        <Link to="/matches" className="rounded-full bg-open-ink px-4 py-2 text-xs font-black text-white">
          Ver
        </Link>
      </div>
      <div className="mt-4 grid gap-2">
        {pendingMatches.length === 0 ? (
          <p className="rounded-[1.4rem] border border-open-light bg-open-bg px-4 py-6 text-sm font-semibold text-open-muted">
            Sin partidos pendientes por confirmar.
          </p>
        ) : (
          pendingMatches.map((match) => (
            <div key={match.id} className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-open-light bg-open-bg px-4 py-3">
              <div>
                <p className="text-sm font-black text-open-ink">
                  {match.match_date}
                  {match.score ? ` · ${match.score}` : ''}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-open-muted">Pendiente de tu confirmacion</p>
              </div>
              <Link to="/matches" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-open-ink px-3 text-xs font-black text-white">
                Confirmar <ArrowRight size={13} strokeWidth={2} />
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function TournamentPanel({ nextTournament }) {
  return (
    <section className="rounded-[2rem] border border-open-light bg-open-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">Torneo</p>
          <h2 className="mt-1 text-2xl font-black text-open-ink">Inscripcion activa</h2>
        </div>
        <Trophy size={20} strokeWidth={2} />
      </div>
      {nextTournament ? (
        <div className="mt-4 rounded-[1.4rem] border border-open-light bg-open-bg p-4">
          <p className="text-lg font-black text-open-ink">{nextTournament.title}</p>
          <p className="mt-1 text-xs font-semibold text-open-muted">
            {nextTournament.status === 'open' ? 'Inscripciones abiertas' : 'En progreso'}
            {nextTournament.start_date ? ` · ${nextTournament.start_date}` : ''}
          </p>
          <Link to="/tournaments" className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-open-ink px-4 text-xs font-black text-white">
            Ver bracket <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      ) : (
        <p className="mt-4 rounded-[1.4rem] border border-open-light bg-open-bg px-4 py-6 text-sm font-semibold text-open-muted">
          No tienes torneo activo por ahora.
        </p>
      )}
    </section>
  )
}

function AchievementsPanel({ achievements }) {
  return (
    <section className="rounded-[2rem] border border-open-light bg-open-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-open-muted">Logros</p>
          <h2 className="mt-1 text-2xl font-black text-open-ink">Actividad reciente</h2>
        </div>
        <Link to="/profile" className="rounded-full bg-open-bg px-4 py-2 text-xs font-black text-open-muted">
          Perfil
        </Link>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {achievements.length === 0 ? (
          <p className="rounded-[1.4rem] border border-open-light bg-open-bg px-4 py-6 text-sm font-semibold text-open-muted sm:col-span-3">
            Todavia no hay logros recientes.
          </p>
        ) : (
          achievements.map((achievement) => (
            <div key={achievement.achievement_key} className="flex items-center gap-3 rounded-[1.4rem] bg-open-ink px-3 py-3">
              <Medal size={16} strokeWidth={1.8} className="shrink-0 text-white" />
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{achievement.achievement_key}</p>
                <p className="mt-0.5 text-[11px] text-white/60">
                  {new Date(achievement.unlocked_at).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default HomeDashboard
