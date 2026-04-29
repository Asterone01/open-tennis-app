import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame, Gauge, Medal, Swords, Trophy } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import DailyQuests from '../gamification/DailyQuests'
import XPHistoryPanel from '../gamification/XPHistoryPanel'
import { calculateLevelFromXp, getNextLevelXp } from '../gamification/xpLedger'
import usePlayerProfile from '../profile/usePlayerProfile'

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

      const wins = (streaksRes.data || []).find((s) => s.streak_type === 'wins')
      setWinStreak(wins?.current_count || 0)

      setRecentAchievements(achievementsRes.data || [])

      const entry = (tournamentRes.data || [])[0]
      setNextTournament(entry?.tournaments || null)
    }

    load()
    return () => { isMounted = false }
  }, [player?.id])

  const isWinner = lastMatch
    ? String(lastMatch.winner_player_id) === String(player?.id)
    : null

  return (
    <section className="grid gap-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            Player Hub
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">
            {profile.fullName || 'Jugador OPEN'}
          </h1>
          <p className="mt-2 text-sm font-semibold text-open-muted">
            Cat.{' '}
            {profile.currentCategory || profile.suggestedCategory || 'Pendiente'}{' '}
            · {profile.ageGroupLabel || 'Sin grupo'}
          </p>
        </div>
        <p className="max-w-md text-sm leading-6 text-open-muted">
          Resumen competitivo, progreso y proximos retos.
        </p>
      </div>

      {/* XP + Racha */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
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
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>{xp.toLocaleString()} XP</span>
              <span className="text-open-muted">
                {nextLevelXp.toLocaleString()} XP
              </span>
            </div>
            <div className="mt-3 h-3 border border-open-light bg-open-bg">
              <div className="h-full bg-open-ink" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-sm text-open-muted">
              {remainingXp.toLocaleString()} XP para Nivel {level + 1}
            </p>
          </div>
        </article>

        <article className="border border-open-light bg-open-surface p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-open-muted">Racha de victorias</p>
              <h2 className="mt-3 text-4xl font-semibold text-open-ink">
                {winStreak}
              </h2>
            </div>
            <div className="grid h-11 w-11 place-items-center border border-open-light bg-open-bg">
              <Flame size={20} strokeWidth={1.8} />
            </div>
          </div>
          <p className="mt-6 text-sm text-open-muted">
            {winStreak === 0
              ? 'Gana tu proximo partido para iniciar una racha.'
              : winStreak === 1
              ? '1 victoria seguida. Sigue asi.'
              : `${winStreak} victorias consecutivas.`}
          </p>
          {lastMatch ? (
            <p className="mt-3 text-sm font-semibold text-open-ink">
              Ultimo partido:{' '}
              <span className={isWinner ? 'text-open-primary' : 'text-open-muted'}>
                {isWinner ? 'Victoria' : 'Derrota'}
              </span>
              {lastMatch.score ? ` · ${lastMatch.score}` : ''}
            </p>
          ) : null}
        </article>
      </div>

      {/* Confirmaciones pendientes */}
      {pendingMatches.length > 0 && (
        <article className="border border-open-light bg-open-surface p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Swords size={18} strokeWidth={1.8} />
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
                Partidos a confirmar
              </h2>
            </div>
            <Link
              to="/matches"
              className="text-xs font-semibold text-open-primary transition hover:opacity-70"
            >
              Ver todos
            </Link>
          </div>
          <div className="mt-4 grid gap-2">
            {pendingMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between gap-3 border border-open-light bg-open-bg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-open-ink">
                    {match.match_date}
                    {match.score ? ` · ${match.score}` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-open-muted">
                    Pendiente de tu confirmacion
                  </p>
                </div>
                <Link
                  to="/matches"
                  className="inline-flex h-9 items-center gap-1.5 bg-open-ink px-3 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Confirmar
                  <ArrowRight size={13} strokeWidth={2} />
                </Link>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* Torneo activo */}
      {nextTournament && (
        <article className="flex items-center justify-between gap-4 border border-open-light bg-open-surface p-5">
          <div className="flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center border border-open-light bg-open-bg">
              <Trophy size={18} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-open-muted">
                Torneo inscrito
              </p>
              <p className="mt-1 text-sm font-semibold text-open-ink">
                {nextTournament.title}
              </p>
              <p className="mt-0.5 text-xs text-open-muted">
                {nextTournament.status === 'open' ? 'Inscripciones abiertas' : 'En progreso'}
                {nextTournament.start_date ? ` · ${nextTournament.start_date}` : ''}
              </p>
            </div>
          </div>
          <Link
            to="/tournaments"
            className="shrink-0 text-xs font-semibold text-open-primary transition hover:opacity-70"
          >
            Ver bracket
          </Link>
        </article>
      )}

      {/* Logros recientes */}
      {recentAchievements.length > 0 && (
        <article className="border border-open-light bg-open-surface p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Medal size={18} strokeWidth={1.8} />
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-open-muted">
                Logros recientes
              </h2>
            </div>
            <Link
              to="/profile"
              className="text-xs font-semibold text-open-primary transition hover:opacity-70"
            >
              Ver todos
            </Link>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {recentAchievements.map((a) => (
              <div
                key={a.achievement_key}
                className="flex items-center gap-3 border border-open-ink bg-open-ink px-3 py-3"
              >
                <Medal size={16} strokeWidth={1.8} className="shrink-0 text-white" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {a.achievement_key}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/60">
                    {new Date(a.unlocked_at).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <DailyQuests />
        <XPHistoryPanel player={player} />
      </div>
    </section>
  )
}

export default HomeDashboard
