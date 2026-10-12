// process.env.API_URL is replaced by its value at build time (quasar.config.js build.env), so
// the browser never sees a `process` global; VITE_API_URL alone is not exposed by Quasar.
export const API_BASE_URL =
  process.env.API_URL ||
  import.meta.env.VITE_API_URL ||
  'https://oneapp.test/api'

let MEDIA_ORIGIN = 'https://oneapp.test'
try {
  MEDIA_ORIGIN = new URL(API_BASE_URL).origin
} catch {
  // fallback
}

export function resolveMediaUrl(source) {
  const value = String(source || '').trim()

  if (!value) return ''
  if (/^(data:|blob:|http:\/\/|https:\/\/)/i.test(value)) return value
  if (value.startsWith('//')) return `${window.location.protocol}${value}`

  try {
    const cleanPath = value.startsWith('/') ? value : `/${value}`
    return `${MEDIA_ORIGIN}${cleanPath}`
  } catch {
    return value
  }
}
