// A visitor's chosen country, kept in this browser only. Signed-in users follow their profile instead.
const KEY = 'pwa-country'

export function visitorCountry() {
  try {
    const code = localStorage.getItem(KEY)
    return /^[A-Z]{2}$/.test(code || '') ? code : null
  } catch {
    return null
  }
}

export function setVisitorCountry(code) {
  try {
    if (code) localStorage.setItem(KEY, code)
    else localStorage.removeItem(KEY)
  } catch {
    // Without storage the choice lasts until the page is reloaded.
  }
}
