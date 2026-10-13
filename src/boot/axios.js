import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { API_BASE_URL } from '@/utils/media'
import { onLocaleChosen, requestedLocale } from '@/i18n'
import { detectVisitorCountry, visitorCountry } from '@/utils/visitorCountry'
import { sessionHint } from '@/utils/sessionHint'
import { countryFromTimezone } from '@/utils/timezoneCountry'
import { unauthorizedRedirect } from '@/router/guards'

// Create an axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'X-PWA-Auth': 'cookie',
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
})

// This credentialed client is exclusively for our HTTPS API, including blobs.
api.interceptors.request.use(config => {
  const base = new URL(API_BASE_URL)
  const target = new URL(api.getUri(config), base)
  const prefix = base.pathname.replace(/\/$/, '')
  if (
    base.protocol !== 'https:' ||
    target.origin !== base.origin ||
    !(target.pathname === prefix || target.pathname.startsWith(`${prefix}/`)) ||
    target.username ||
    target.password
  )
    throw new Error(
      'The cookie API client only accepts requests to the configured HTTPS API'
    )
  config.withCredentials = true
  config.headers.set('X-PWA-Auth', 'cookie')
  config.headers.delete('Authorization')
  delete config.auth
  return config
})

// Guesses the country from the browser time zone, among the store's active countries.
const fetchDetectedCountry = () =>
  countryFromTimezone(() =>
    api
      .get('/countries', { skipCountryDetection: true })
      .then(({ data }) => (data || []).map(country => country.code))
  )

// Anonymous visitors without a chosen country get the detected one; a signed-in
// account (or one that was signed in last time) keeps its own country.
function shouldDetectCountry(config) {
  return (
    !config?.skipCountryDetection &&
    !useAuthStore().isAuthenticated &&
    sessionHint() !== true
  )
}

export default boot(({ app, router }) => {
  // Start the first-visit detection right away so the first catalogue request waits less.
  if (shouldDetectCountry()) detectVisitorCountry(fetchDetectedCountry)

  api.interceptors.request.use(
    async config => {
      if (shouldDetectCountry(config))
        await detectVisitorCountry(fetchDetectedCountry)
      if (!useAuthStore().isAuthenticated && visitorCountry()) {
        // Visitors browse the catalogue of the country they chose (or that was detected).
        config.headers['X-Country'] = visitorCountry()
      }
      // Server messages (requirements, blockers) follow the language chosen in the store.
      config.headers['Accept-Language'] = requestedLocale()
      // With the JSON default, axios would serialise FormData to JSON and drop the files:
      // let the browser set multipart/form-data with its boundary instead.
      if (config.data instanceof FormData) config.headers.setContentType(false)
      return config
    },
    error => {
      return Promise.reject(error)
    }
  )

  // Set up response interceptor to handle token expiry / unauthenticated errors
  api.interceptors.response.use(
    response => {
      return response
    },
    error => {
      if (error.response && error.response.status === 401) {
        // An expired token ends the session. A 401 on an anonymous request (wrong
        // password, OTP step) must not wipe the pending OTP challenge.
        const auth = useAuthStore()
        auth.clearSession({ keepChallenge: !auth.isAuthenticated })
        // Only pages that require a session redirect; public pages stay put.
        const target = unauthorizedRedirect(router.currentRoute.value)
        if (target) router.push(target)
      }
      return Promise.reject(error)
    }
  )

  // A signed-in user's language follows them across devices (best effort).
  onLocaleChosen(locale => {
    if (useAuthStore().isAuthenticated)
      api.put('/account/locale', { locale }).catch(() => {})
  })

  // Expose axios under Vue instance (options API support)
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
