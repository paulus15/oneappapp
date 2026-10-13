import { api } from '@/boot/axios'
import { currentLocale } from '@/i18n'

// Active countries, fetched once per page load and shared by every component that names one.
let cached = null

export function activeCountries() {
  cached ||= api
    .get('/countries', { skipCountryDetection: true })
    .then(({ data }) => (Array.isArray(data) ? data : []))
    .catch(() => {
      cached = null
      return []
    })
  return cached
}

export function countryName(country) {
  if (!country) return ''
  return currentLocale() === 'en'
    ? country.name_en || country.name
    : country.name || country.name_en
}

// Regional-indicator emoji from an ISO code (CI -> 🇨🇮). Windows shows the two letters instead.
export function flagEmoji(code) {
  const iso = String(code || '').toUpperCase()
  if (!/^[A-Z]{2}$/.test(iso)) return ''
  return String.fromCodePoint(
    ...[...iso].map(letter => 0x1f1e6 + letter.charCodeAt(0) - 65)
  )
}
