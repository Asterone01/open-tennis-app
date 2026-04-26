import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

function usePlayerProfile() {
  const [user, setUser] = useState(null)
  const [player, setPlayer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      setIsLoading(true)
      setError('')

      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (!isMounted) {
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

      if (!isMounted) {
        return
      }

      if (playerError) {
        setError(playerError.message)
      } else {
        setPlayer(playerData)
      }

      setIsLoading(false)
    }

    loadProfile()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    user,
    player,
    isLoading,
    error,
    profile: {
      fullName:
        player?.full_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.nombre ||
        user?.email ||
        'Jugador OPEN',
      email: player?.email || user?.email || '',
      level: player?.level || user?.user_metadata?.level || 1,
      xp: player?.xp || user?.user_metadata?.xp || 0,
      currentStreak:
        player?.current_streak || user?.user_metadata?.current_streak || 0,
      yearsPlaying:
        player?.years_playing || user?.user_metadata?.years_playing || 0,
      role: player?.role || user?.user_metadata?.role || 'player',
    },
  }
}

export default usePlayerProfile
