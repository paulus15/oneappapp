// Helpers for the public listing of an application (details page "Information" block).

/** Only http(s) links leave the Store: anything else (javascript:, data:…) is dropped. */
export function safeExternalUrl(value) {
  try {
    const url = new URL(String(value || '').trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch {
    return ''
  }
}

export function safeEmail(value) {
  const email = String(value || '').trim()
  return /^[^\s@<>()"]+@[^\s@<>()"]+\.[^\s@<>()"]+$/.test(email) ? email : ''
}

/** Display name of an ISO language or region code in the visitor's language. */
export function displayName(code, locale, type) {
  const value = String(code || '').trim()
  if (!value) return ''
  try {
    return new Intl.DisplayNames([locale], { type }).of(value) || value
  } catch {
    return value
  }
}

/** Codes of the country list, whether the API sends strings or { code } objects. */
export function countryCodes(countries) {
  if (!Array.isArray(countries)) return []
  return countries
    .map(c => (typeof c === 'string' ? c : c?.code || ''))
    .filter(Boolean)
}

/** Keys of the declared compatibility, from { mobile: true } or ['mobile']. */
export function compatibilityKeys(compatibility) {
  if (Array.isArray(compatibility)) return compatibility.map(String)
  if (compatibility && typeof compatibility === 'object')
    return Object.entries(compatibility)
      .filter(([, on]) => on && on !== '0')
      .map(([key]) => key)
  return []
}
