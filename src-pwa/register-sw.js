// Check long-lived tabs too; activate only after the user accepts a reload.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.QUASAR_SERVICE_WORKER_FILE, {
        updateViaCache: 'none'
      })
      .then(registration => {
        let promptedWorker
        let refreshing = false
        const hadController = Boolean(navigator.serviceWorker.controller)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (
            !hadController ||
            refreshing ||
            !navigator.serviceWorker.controller
          )
            return
          refreshing = true
          window.location.reload()
        })
        const offerUpdate = () => {
          const worker = registration.waiting
          if (
            !navigator.serviceWorker.controller ||
            !worker ||
            worker === promptedWorker
          )
            return
          promptedWorker = worker
          if (
            window.confirm(
              'Une mise à jour de PWA Store est disponible. Recharger maintenant ?'
            )
          ) {
            worker.postMessage({ type: 'SKIP_WAITING' })
          }
        }
        offerUpdate()
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed') offerUpdate()
          })
        })
        const checkUpdate = () => {
          if (document.visibilityState === 'visible')
            registration.update().catch(() => {})
        }
        document.addEventListener('visibilitychange', checkUpdate)
        window.setInterval(checkUpdate, 60 * 60 * 1000)
      })
      .catch(error =>
        console.error('PWA Store: service worker registration failed', error)
      )
  })
}
