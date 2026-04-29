import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function useManagerClub() {
  const [club, setClub] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData.user?.id
      if (!uid) { setIsLoading(false); return }

      const { data, error: clubError } = await supabase
        .from('clubs')
        .select('id, name, primary_color, logo_url')
        .eq('manager_id', uid)
        .maybeSingle()

      if (!isMounted) return

      if (clubError) setError(clubError.message)
      else setClub(data || null)
      setIsLoading(false)
    }

    load()
    return () => { isMounted = false }
  }, [])

  return { club, clubId: club?.id || null, isLoading, error }
}

export default useManagerClub
