// Whether this browser was signed in last time, so anonymous visitors skip GET /auth/me.
// Not a credential: the session itself stays in the HttpOnly cookie, which JavaScript cannot read.
// '1' = signed in, '0' = signed out; absent = unknown (first visit, storage cleared by the browser).
const KEY = 'pwa-session'

// true, false, or null when unknown: an unknown state is checked once with the server.
export function sessionHint() {
  try {
    const value = localStorage.getItem(KEY)
    return value === '1' ? true : value === '0' ? false : null
  } catch {
    return null
  }
}

export function setSessionHint(signedIn) {
  try {
    localStorage.setItem(KEY, signedIn ? '1' : '0')
  } catch {
    // Without storage, every visit checks the session with the server, as before.
  }
}
