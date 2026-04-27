function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // The app should keep working even when SW registration is unavailable.
    })
  })
}

export default registerServiceWorker
