import { i18n } from './index'
import english from './ui.en.json'

// Source-message catalogue complements the existing keyed Vue I18n catalogue.
// Read the reactive locale on every render, including labels stored in option getters.
const sources = new Map(
  Object.entries(english).map(([source, value]) => [value, source])
)
export function ui(source, values = {}) {
  if (typeof source !== 'string') return source
  const normalized = source.replace(/\s+/g, ' ').trim()
  const original = Object.hasOwn(english, normalized)
    ? normalized
    : sources.get(normalized) || normalized
  const translated =
    i18n.global.locale.value === 'en' ? english[original] || source : original
  return translated.replace(/\{(\w+)\}/g, (match, key) =>
    Object.hasOwn(values, key) ? String(values[key]) : match
  )
}

// Only use for platform-owned static copy, never app descriptions or user reviews.
export function localizedCopy(value) {
  if (typeof value === 'string') return ui(value)
  if (Array.isArray(value)) return value.map(localizedCopy)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, localizedCopy(item)])
    )
  return value
}
