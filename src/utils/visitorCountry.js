// A visitor's chosen country, kept in this browser only. Signed-in users follow their profile instead.
const KEY = 'pwa-country'
// 'manual' once the visitor picked (or cleared) a country themselves, 'auto' when it was detected.
const SOURCE_KEY = 'pwa-country-source'
// Detection is tried once per browsing session when the server could not tell.
const TRIED_KEY = 'pwa-country-detection-tried'
const DETECTION_TIMEOUT_MS = 2500
const ISO = /^[A-Z]{2}$/

let detection = null

export function visitorCountry() {
  try {
    const code = localStorage.getItem(KEY)
    return ISO.test(code || '') ? code : null
  } catch {
    return null
  }
}

// The visitor's own choice: it always wins over detection and is remembered, even when cleared.
export function setVisitorCountry(code) {
  try {
    if (code) localStorage.setItem(KEY, code)
    else localStorage.removeItem(KEY)
    localStorage.setItem(SOURCE_KEY, 'manual')
  } catch {
    // Without storage the choice lasts until the page is reloaded.
  }
}

export function visitorCountrySource() {
  try {
    return localStorage.getItem(SOURCE_KEY)
  } catch {
    return null
  }
}

function needsDetection() {
  try {
    return (
      !visitorCountry() &&
      !localStorage.getItem(SOURCE_KEY) &&
      sessionStorage.getItem(TRIED_KEY) !== '1'
    )
  } catch {
    // Without storage the result could not be kept: do not ask on every request.
    return false
  }
}

function rememberDetected(value) {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : ''
  try {
    sessionStorage.setItem(TRIED_KEY, '1')
    // A manual choice made while the request was in flight wins.
    if (ISO.test(code) && !localStorage.getItem(SOURCE_KEY)) {
      localStorage.setItem(KEY, code)
      localStorage.setItem(SOURCE_KEY, 'auto')
    }
  } catch {
    // Nothing to remember without storage.
  }
}

// First visit only: preselect the country the server sees the connection coming from.
// `fetchCode` resolves to an ISO code or null. Requests wait at most DETECTION_TIMEOUT_MS;
// a late answer is still remembered for the next pages.
export function detectVisitorCountry(fetchCode) {
  if (detection) return detection
  if (!needsDetection()) return Promise.resolve(visitorCountry())
  const lookup = Promise.resolve()
    .then(fetchCode)
    .then(rememberDetected, () => rememberDetected(null))
  detection = Promise.race([
    lookup,
    new Promise(resolve => setTimeout(resolve, DETECTION_TIMEOUT_MS))
  ]).then(() => visitorCountry())
  return detection
}

// Resolves with the visitor country once a pending detection is over.
export function visitorCountryReady() {
  return detection || Promise.resolve(visitorCountry())
}

// Tests only.
export function resetVisitorCountryDetection() {
  detection = null
}
