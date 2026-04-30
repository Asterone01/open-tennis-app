import { useEffect, useState } from 'react'

const DISMISSED_KEY = 'open_pwa_install_dismissed'

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1',
  )
  const [hasUpdate, setHasUpdate] = useState(false)
  const [swRegistration, setSwRegistration] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Online / offline
  useEffect(() => {
    const online = () => setIsOnline(true)
    const offline = () => setIsOnline(false)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }, [])

  // Install prompt
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // SW update detection
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then((reg) => {
      setSwRegistration(reg)

      // Check for updates every 60s
      const interval = setInterval(() => reg.update(), 60_000)

      reg.addEventListener('updatefound', () => {
        const worker = reg.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            setHasUpdate(true)
          }
        })
      })

      return () => clearInterval(interval)
    })

    // When the SW controlling the page changes, reload to get fresh content
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }, [])

  const install = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setInstallPrompt(null)
  }

  const dismiss = () => {
    setIsDismissed(true)
    localStorage.setItem(DISMISSED_KEY, '1')
  }

  const applyUpdate = () => {
    swRegistration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  }

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isInStandaloneMode =
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && window.navigator.standalone)

  const canShowInstallBanner =
    !isInstalled &&
    !isInStandaloneMode &&
    !isDismissed &&
    (installPrompt !== null || isIOS)

  return {
    canShowInstallBanner,
    hasUpdate,
    isIOS,
    isOnline,
    install,
    dismiss,
    applyUpdate,
  }
}
