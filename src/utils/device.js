export function deviceIdentity() {
  try {
    let id = localStorage.getItem('pwa-store-device-id')
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem('pwa-store-device-id', id)
    }
    return id
  } catch {
    return null
  }
}
export function devicePlatform() {
  const ua = navigator.userAgent
  if (/Android/i.test(ua)) return 'android'
  if (
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
    return 'ios'
  if (/Windows/i.test(ua)) return 'windows'
  if (/Mac/i.test(ua)) return 'macos'
  if (/Linux/i.test(ua)) return 'linux'
  return 'web'
}
