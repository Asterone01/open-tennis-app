import { useCallback, useEffect, useState } from 'react'

const COLOR_MODE_KEY = 'open_color_mode'
const DEFAULT_COLOR_MODE = 'light'

function applyColorMode(mode) {
  const nextMode = mode === 'dark' ? 'dark' : 'light'
  const root = document.documentElement

  root.dataset.theme = nextMode
  root.classList.toggle('dark', nextMode === 'dark')
}

function getStoredColorMode() {
  if (typeof window === 'undefined') {
    return DEFAULT_COLOR_MODE
  }

  const storedMode = window.localStorage.getItem(COLOR_MODE_KEY)

  if (storedMode === 'dark' || storedMode === 'light') {
    return storedMode
  }

  return DEFAULT_COLOR_MODE
}

function useColorMode() {
  const [colorMode, setColorMode] = useState(getStoredColorMode)

  useEffect(() => {
    applyColorMode(colorMode)
    window.localStorage.setItem(COLOR_MODE_KEY, colorMode)
  }, [colorMode])

  const toggleColorMode = useCallback(() => {
    setColorMode((currentMode) =>
      currentMode === 'dark' ? 'light' : 'dark',
    )
  }, [])

  return {
    colorMode,
    setColorMode,
    toggleColorMode,
  }
}

export { applyColorMode }
export default useColorMode
