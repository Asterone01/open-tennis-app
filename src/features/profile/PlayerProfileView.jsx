import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getPlayerAchievements } from '../gamification/achievementsLedger'
import PlayerCard from './PlayerCard'
import PlayerProfileDetails from './PlayerProfileDetails'

function PlayerProfileView() {
  const { playerId } = useParams()
  const [player, setPlayer] = useState(null)
  const [club, setClub] = useState(null)
  const [recentMatches, setRecentMatches] = useState([])
  const [streakRows, setStreakRows] = useState([])
  const [achievementRows, setAchievementRows] = useState([])
  const [trophyRows, setTrophyRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadPlayer = async () => {
      setIsLoading(true)
      setError('')

      const { data, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .maybeSingle()

      if (!isMounted) return

      if (playerError || !data) {
        setError(playerError?.message || 'No se encontro este jugador.')
        setPlayer(null)
        setClub(null)
        setIsLoading(false)
        return
      }

      setPlayer(data)

      if (data.club_id) {
        const { data: clubData } = await supabase
          .from('clubs')
          .select('id, name, primary_color, logo_url')
          .eq('id', data.club_id)
          .maybeSingle()

        if (isMounted) {
          setClub(clubData || null)
        }
      } else {
        setClub(null)
      }

      const { data: matchesData } = await supabase
        .from('friendly_matches')
        .select('*')
        .or(`created_by_player_id.eq.${data.id},opponent_player_id.eq.${data.id}`)
        .order('match_date', { ascending: false })
        .limit(5)

      if (isMounted) {
        setRecentMatches(matchesData || [])
      }

      const { data: streaksData } = await supabase
        .from('streaks')
        .select('streak_type, current_count, max_record, status')
        .eq('player_id', String(data.id))

      if (isMounted) {
        setStreakRows(streaksData || [])
      }

      const [achievements, trophiesRes] = await Promise.all([
        getPlayerAchievements(data.id),
        supabase
          .from('tournament_trophies')
          .select('*')
          .eq('player_id', String(data.id))
          .order('won_at', { ascending: false }),
      ])

      if (isMounted) {
        setAchievementRows(achievements)
        setTrophyRows(trophiesRes.data || [])
        setIsLoading(false)
      }
    }

    loadPlayer()

    return () => {
      isMounted = false
    }
  }, [playerId])

  if (isLoading) {
    return <p className="text-sm text-open-muted">Cargando perfil...</p>
  }

  if (error || !player) {
    return (
      <section className="grid gap-5">
        <BackLink />
        <p className="border border-open-light bg-open-surface px-4 py-8 text-center text-sm text-open-muted">
          {error || 'No se encontro este jugador.'}
        </p>
      </section>
    )
  }

  const profile = toCardProfile(player, club, recentMatches, streakRows, achievementRows, trophyRows)

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6">
      <BackLink />

      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
            Perfil de jugador
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-open-ink md:text-5xl">
            {profile.fullName}
          </h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-open-muted">
          Vista de club para coach y manager.
        </p>
      </div>

      <PlayerCard profile={profile} />

      <section className="grid gap-3 border border-open-light bg-open-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-open-muted">
          Datos de club
        </h2>
        <InfoRow label="Club" value={profile.clubName || 'Sin club'} />
        <InfoRow label="Estado" value={profile.clubMembershipLabel} />
        <InfoRow
          label="Categoria"
          value={
            profile.currentCategory || profile.suggestedCategory || 'Pendiente'
          }
        />
        <InfoRow label="Grupo" value={profile.ageGroupLabel} />
        <InfoRow label="Email" value={profile.email || 'Sin email'} />
      </section>

      <PlayerProfileDetails profile={profile} />
    </section>
  )
}

function BackLink() {
  return (
    <Link
      to="/dashboard"
      className="inline-flex h-10 w-fit items-center gap-2 border border-open-light bg-open-surface px-3 text-sm font-semibold text-open-ink transition hover:border-open-primary"
    >
      <ArrowLeft size={16} strokeWidth={1.8} />
      Dashboard
    </Link>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-open-light pt-3 text-sm first:border-t-0 first:pt-0">
      <span className="text-open-muted">{label}</span>
      <span className="text-right font-semibold text-open-ink">{value}</span>
    </div>
  )
}

function toCardProfile(player, club, recentMatches = [], streakRows = [], achievementRows = [], trophyRows = []) {
  return {
    playerId: player.id || '',
    fullName: player.full_name || player.email || 'Jugador OPEN',
    email: player.email || '',
    avatarUrl: player.avatar_url || '',
    playerCardColor: player.player_card_color || '',
    level: player.level || 1,
    xp: player.xp || 0,
    ageGroup: player.age_group || '',
    ageGroupLabel: formatAgeGroup(player.age_group),
    suggestedCategory: player.suggested_category || '',
    currentCategory: player.current_category || '',
    clubId: player.club_id || null,
    clubName: club?.name || '',
    clubPrimaryColor: club?.primary_color || '',
    clubMembershipStatus: player.club_membership_status || 'unassigned',
    clubMembershipLabel: formatMembership(player.club_membership_status),
    recentMatches,
    streakRows,
    achievementRows,
    trophyRows,
    stats: {
      stat_derecha: player.stat_derecha ?? player.stat_ataque ?? 50,
      stat_reves: player.stat_reves ?? player.stat_defensa ?? 50,
      stat_saque: player.stat_saque ?? 50,
      stat_volea: player.stat_volea ?? player.stat_mentalidad ?? 50,
      stat_movilidad: player.stat_movilidad ?? player.stat_fisico ?? 50,
      stat_slice: player.stat_slice ?? 50,
    },
    matchStats: {
      aces: player.match_aces || 0,
      doubleFaults: player.match_double_faults || 0,
      winners: player.match_winners || 0,
      unforcedErrors: player.match_unforced_errors || 0,
      forcedErrors: player.match_forced_errors || 0,
      matchPoints: player.match_points || 0,
      pointsAgainst: player.match_points_against || 0,
    },
  }
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

export default PlayerProfileView
