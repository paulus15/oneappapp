// Quasar supplies the built worker URL; the browser manages its update lifecycle.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.QUASAR_SERVICE_WORKER_FILE)
      .catch(error =>
        console.error('PWA Store: service worker registration failed', error)
      )
  })
}
