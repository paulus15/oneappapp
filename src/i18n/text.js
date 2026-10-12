import { i18n, englishUi } from './index'

// Source-message catalogue complements the existing keyed Vue I18n catalogue.
// Read the reactive locale and catalogue on every render, including labels stored in
// option getters. The English catalogue loads on demand: until it arrives, French shows.
let reverseFor = null
let sources = new Map()
function englishToSource(catalogue) {
  if (reverseFor !== catalogue) {
    sources = new Map(
      Object.entries(catalogue).map(([source, value]) => [value, source])
    )
    reverseFor = catalogue
  }
  return sources
}

export function ui(source, values = {}) {
  if (typeof source !== 'string') return source
  const english = englishUi.value
  const locale = i18n.global.locale.value
  const normalized = source.replace(/\s+/g, ' ').trim()
  let translated = normalized
  if (english) {
    const original = Object.hasOwn(english, normalized)
      ? normalized
      : englishToSource(english).get(normalized) || normalized
    translated = locale === 'en' ? english[original] || source : original
  }
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
