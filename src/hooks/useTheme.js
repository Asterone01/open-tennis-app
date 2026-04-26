import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_THEME = {
  primaryColor: '#0D0D0F',
  logoUrl: '',
  clubName: 'OPEN',
}

function applyTheme(theme) {
  const primaryColor = theme?.primaryColor || DEFAULT_THEME.primaryColor

  document.documentElement.style.setProperty(
    '--color-brand-primary',
    primaryColor,
  )
}

function normalizeClub(club) {
  if (!club) {
    return DEFAULT_THEME
  }

  return {
    primaryColor: club.primary_color || DEFAULT_THEME.primaryColor,
    logoUrl: club.logo_url || '',
    clubName: club.name || DEFAULT_THEME.clubName,
  }
}

function useTheme(clubId) {
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [isLoading, setIsLoading] = useState(true)

  const loadTheme = useCallback(async () => {
    setIsLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      setTheme(DEFAULT_THEME)
      applyTheme(DEFAULT_THEME)
      setIsLoading(false)
      return
    }

    let query = supabase
      .from('clubs')
      .select('id, name, primary_color, logo_url')

    if (clubId) {
      query = query.eq('id', clubId)
    } else if (user.user_metadata?.role === 'manager') {
      query = query.eq('manager_id', user.id)
    } else if (user.user_metadata?.club_id) {
      query = query.eq('id', user.user_metadata.club_id)
    } else {
      setTheme(DEFAULT_THEME)
      applyTheme(DEFAULT_THEME)
      setIsLoading(false)
      return
    }

    const { data: club } = await query.maybeSingle()
    const nextTheme = normalizeClub(club)

    setTheme(nextTheme)
    applyTheme(nextTheme)
    setIsLoading(false)
  }, [clubId])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadTheme()
    }, 0)

    const handleThemeUpdate = (event) => {
      const nextTheme = {
        primaryColor:
          event.detail?.primaryColor || DEFAULT_THEME.primaryColor,
        logoUrl: event.detail?.logoUrl || '',
        clubName: event.detail?.clubName || DEFAULT_THEME.clubName,
      }

      setTheme(nextTheme)
      applyTheme(nextTheme)
    }

    window.addEventListener('open-theme-updated', handleThemeUpdate)

    return () => {
      window.clearTimeout(timeoutId)
      window.removeEventListener('open-theme-updated', handleThemeUpdate)
    }
  }, [loadTheme])

  return {
    theme,
    isLoading,
    reloadTheme: loadTheme,
  }
}

export { DEFAULT_THEME, applyTheme }
export default useTheme
