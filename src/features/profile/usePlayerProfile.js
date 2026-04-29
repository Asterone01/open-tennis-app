import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ensurePlayerProfile } from './profileConnections'

function usePlayerProfile() {
  const [user, setUser] = useState(null)
  const [player, setPlayer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProfile = useCallback(async (isMounted = () => true) => {
    setIsLoading(true)
    setError('')

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (!isMounted()) {
      return
    }

    if (userError) {
      setError(userError.message)
      setIsLoading(false)
      return
    }

    const currentUser = userData.user
    setUser(currentUser)

    if (!currentUser) {
      setIsLoading(false)
      return
    }

    const { data: playerData, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle()

    if (!isMounted()) {
      return
    }

    if (playerError) {
      setError(playerError.message)
    } else if (playerData) {
      setPlayer(playerData)
    } else {
      const { data: ensuredPlayer, error: ensureError } =
        await ensurePlayerProfile(currentUser)

      if (!isMounted()) {
        return
      }

      if (ensureError) {
        setError(ensureError.message)
      } else {
        setPlayer(ensuredPlayer)
      }
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    let isMounted = true
    const timeoutId = window.setTimeout(() => {
      loadProfile(() => isMounted)
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [loadProfile])

  return {
    user,
    player,
    isLoading,
    error,
    reloadProfile: () => loadProfile(),
    profile: {
      playerId: player?.id || '',
      fullName:
        player?.full_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.nombre ||
        user?.email ||
        'Jugador OPEN',
      email: player?.email || user?.email || '',
      phone: player?.phone || user?.user_metadata?.phone || '',
      avatarUrl: player?.avatar_url || user?.user_metadata?.avatar_url || '',
      playerCardColor:
        player?.player_card_color ||
        user?.user_metadata?.player_card_color ||
        '',
      level: player?.level || user?.user_metadata?.level || 1,
      xp: player?.xp || user?.user_metadata?.xp || 0,
      currentStreak:
        player?.current_streak || user?.user_metadata?.current_streak || 0,
      yearsPlaying:
        player?.years_playing || user?.user_metadata?.years_playing || 0,
      ageGroup: player?.age_group || user?.user_metadata?.age_group || '',
      suggestedCategory:
        player?.suggested_category ||
        user?.user_metadata?.suggested_category ||
        '',
      currentCategory:
        player?.current_category || user?.user_metadata?.current_category || '',
      clubMembershipStatus:
        player?.club_membership_status ||
        user?.user_metadata?.club_membership_status ||
        'unassigned',
      membershipId: player?.membership_id || '',
      membershipSince: player?.membership_since || '',
      membershipPlan: player?.membership_plan || 'standard',
      membershipPaymentStatus: player?.membership_payment_status || 'unknown',
      membershipNextPaymentDate: player?.membership_next_payment_date || '',
      membershipLastPaymentDate: player?.membership_last_payment_date || '',
      membershipNotes: player?.membership_notes || '',
      onboardingCompleted:
        player?.onboarding_completed ||
        user?.user_metadata?.onboarding_completed ||
        false,
      role: player?.role || user?.user_metadata?.role || 'player',
      clubId: player?.club_id || user?.user_metadata?.club_id || null,
      isCoach: player?.is_coach || user?.user_metadata?.role === 'coach',
      stats: {
        stat_derecha: player?.stat_derecha ?? player?.stat_ataque ?? 50,
        stat_reves: player?.stat_reves ?? player?.stat_defensa ?? 50,
        stat_saque: player?.stat_saque ?? 50,
        stat_volea: player?.stat_volea ?? player?.stat_mentalidad ?? 50,
        stat_movilidad: player?.stat_movilidad ?? player?.stat_fisico ?? 50,
        stat_slice: player?.stat_slice ?? 50,
      },
      matchStats: {
        aces: player?.match_aces || 0,
        doubleFaults: player?.match_double_faults || 0,
        winners: player?.match_winners || 0,
        unforcedErrors: player?.match_unforced_errors || 0,
        forcedErrors: player?.match_forced_errors || 0,
        matchPoints: player?.match_points || 0,
        pointsAgainst: player?.match_points_against || 0,
      },
    },
  }
}

export default usePlayerProfile
