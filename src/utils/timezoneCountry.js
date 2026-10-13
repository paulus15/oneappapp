// Guesses the visitor's country from the browser time zone (no permission prompt, no server call).
// A zone can cover several countries (Africa/Abidjan: BF, CI, SN…), so the pick is, in order:
// a country named by the browser languages (fr-SN), the zone's own country (only zone of CI),
// or the single active candidate. Anything ambiguous returns null: the visitor chooses.

const ISO = /^[A-Z]{2}$/

function languageRegions(languages) {
  return (languages || [])
    .map(tag => String(tag).split('-')[1]?.toUpperCase())
    .filter(region => ISO.test(region || ''))
}

// `tz` is moment-timezone (injected for tests); `active` the active ISO codes of the store.
export function pickCountry(timeZone, languages, active, tz) {
  const zone = timeZone && tz.tz.zone(timeZone)
  if (!zone) return null
  const allowed = new Set(active)
  const candidates = zone.countries().filter(code => allowed.has(code))
  const fromLanguage = languageRegions(languages).find(region =>
    candidates.includes(region)
  )
  if (fromLanguage) return fromLanguage
  const owner = candidates.filter(code => {
    const zones = tz.tz.zonesForCountry(code)
    return zones.length === 1 && zones[0] === zone.name
  })
  if (owner.length === 1) return owner[0]
  return candidates.length === 1 ? candidates[0] : null
}

// `activeCodes` resolves to the ISO codes of the active countries.
export async function countryFromTimezone(activeCodes) {
  let timeZone
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return null
  }
  if (!timeZone) return null
  // Loaded only when a first visit needs it: the time zone data is not in the main bundle.
  const [{ default: tz }, active] = await Promise.all([
    import('moment-timezone'),
    activeCodes()
  ])
  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language]
  return pickCountry(timeZone, languages, active, tz)
}
