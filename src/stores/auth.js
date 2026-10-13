import { ui } from '@/i18n/text'
import { defineStore } from 'pinia'
import { Notify } from 'quasar'
import { api } from '@/boot/axios'
import { setLocale } from '@/i18n'
import { sessionHint, setSessionHint } from '@/utils/sessionHint'
const hydrations = new WeakMap()

// Blocked or unavailable storage (private mode, policies) must never break sign-in or sign-out.
function quietly(action) {
  try {
    action()
  } catch {
    // Nothing is kept without storage; the session itself lives in the HttpOnly cookie.
  }
}

function clearLegacyAuthStorage() {
  quietly(() => {
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of [
        'auth_token',
        'access_token',
        'token',
        'user',
        'auth'
      ]) {
        storage.removeItem(key)
      }
    }
  })
}

function storeChallenge(challenge) {
  quietly(() => {
    if (challenge)
      sessionStorage.setItem('otp_challenge', JSON.stringify(challenge))
    else sessionStorage.removeItem('otp_challenge')
  })
}

function safeChallenge(data) {
  if (!data) return null
  const fields = [
    'requires_otp',
    'challenge_id',
    'purpose',
    'destination',
    'retry_after',
    'code_sent',
    'message'
  ]
  return Object.fromEntries(
    fields.filter(key => key in data).map(key => [key, data[key]])
  )
}

function initialState() {
  clearLegacyAuthStorage()
  let pendingChallenge = null
  try {
    pendingChallenge = safeChallenge(
      JSON.parse(sessionStorage.getItem('otp_challenge'))
    )
  } catch {
    // Ignore malformed legacy data.
  }
  storeChallenge(pendingChallenge)
  return {
    user: null,
    loading: false,
    error: null,
    pendingChallenge,
    hydrated: false,
    sessionRevision: 0
  }
}
export const useAuthStore = defineStore('auth', {
  state: initialState,
  getters: {
    isAuthenticated: state => !!state.user,
    isDeveloper: state =>
      !!state.user?.capabilities?.['developer.portal.access'],
    canCreateApp: state => !!state.user?.capabilities?.['developer.app.create'],
    canSubmit: state => !!state.user?.capabilities?.['developer.app.submit'],
    isAdmin: state => state.user?.role === 'admin',
    userName: state => state.user?.name || ui('Visiteur')
  },
  actions: {
    setChallenge(data) {
      this.pendingChallenge = safeChallenge(data)
      storeChallenge(this.pendingChallenge)
    },
    acceptAuthResult(data) {
      if (data.deactivated) {
        this.clearSession()
        return
      }
      if (data.requires_otp) {
        this.setChallenge(data)
        return
      }
      if (!data.user) throw new Error(ui('Réponse de connexion incomplète.'))
      clearLegacyAuthStorage()
      this.sessionRevision++
      this.setUser(data.user)
      this.applyAccountLocale()
      this.setChallenge(null)
      this.hydrated = true
    },
    // The language saved on the account wins over the browser's after sign-in.
    applyAccountLocale() {
      if (this.user?.locale) setLocale(this.user.locale, { fromAccount: true })
    },
    verifyOtp(code) {
      return this.authenticate('/auth/otp/verify', {
        challenge_id: this.pendingChallenge?.challenge_id,
        code
      })
    },
    async resendOtp() {
      const { data } = await api.post('/auth/otp/resend', {
        challenge_id: this.pendingChallenge?.challenge_id
      })
      // Keep fields such as the masked destination if the server omits them.
      this.setChallenge({ ...this.pendingChallenge, ...data })
      return data
    },
    async forgotPassword(email) {
      const { data } = await api.post('/auth/password/forgot', { email })
      this.setChallenge(data)
      return data
    },
    resetPassword(code, password, password_confirmation) {
      return this.authenticate('/auth/password/reset', {
        challenge_id: this.pendingChallenge?.challenge_id,
        code,
        password,
        password_confirmation
      })
    },
    setUser(user) {
      this.user = user
      // Account data lives in memory; the server authenticates the HttpOnly cookie.
      // Only a "signed in" flag is kept, so the next visit knows to restore the session.
      if (user) setSessionHint(true)
    },
    clearSession({ keepChallenge = false } = {}) {
      this.user = null
      this.sessionRevision++
      this.hydrated = true
      setSessionHint(false)
      clearLegacyAuthStorage()
      // Searches typed while signed in, and apps marked as installed on this device,
      // stay private to that session (a shared device must not show them to the next person).
      quietly(() => {
        localStorage.removeItem('oneapp_search_history')
        Object.keys(localStorage)
          .filter(key => key.startsWith('pwa-installed-'))
          .forEach(key => localStorage.removeItem(key))
      })
      if (!keepChallenge) this.setChallenge(null)
    },
    async authenticate(path, data) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post(path, data)
        if (
          ['/auth/login', '/auth/register', '/auth/password/reset'].includes(
            path
          )
        )
          this.clearSession()
        this.acceptAuthResult(response.data)
        return response.data
      } catch (e) {
        this.error =
          Object.values(e.response?.data?.errors || {})
            .flat()
            .join(' ') ||
          e.response?.data?.message ||
          ui('Connexion au service impossible.')
        throw e
      } finally {
        this.loading = false
      }
    },
    login(email, password, remember = false) {
      return this.authenticate('/auth/login', { email, password, remember })
    },
    register(
      name,
      email,
      password,
      password_confirmation,
      country_id,
      two_factor_enabled = false
    ) {
      return this.authenticate('/auth/register', {
        name,
        email,
        password,
        password_confirmation,
        country_id,
        two_factor_enabled,
        two_factor_channel: 'email'
      })
    },
    async logout() {
      // Invalidate an in-flight /auth/me before it can restore a stale user.
      this.sessionRevision++
      try {
        await api.post('/auth/logout')
      } catch (error) {
        if (error.response?.status !== 401) {
          // JavaScript cannot delete an HttpOnly cookie; do not claim success.
          Notify.create({
            type: 'warning',
            timeout: 8000,
            message: ui(
              'La déconnexion a échoué. Votre session peut encore être active. Réessayez une fois la connexion rétablie.'
            )
          })
          return false
        }
      }
      this.clearSession()
      return true
    },
    // On start-up: ask the server only if this browser may be signed in (or we cannot tell).
    restoreSession() {
      if (sessionHint() === false && !this.isAuthenticated) {
        this.hydrated = true
        return Promise.resolve()
      }
      return this.fetchUser()
    },
    async fetchUser() {
      if (hydrations.has(this)) return hydrations.get(this)
      const revision = this.sessionRevision
      const hydration = (async () => {
        try {
          const { data } = await api.get('/auth/me')
          if (revision !== this.sessionRevision) return
          if (!data?.id) throw new Error('Invalid session response')
          this.setUser(data)
          this.applyAccountLocale()
          this.hydrated = true
          this.error = null
        } catch (e) {
          if (revision !== this.sessionRevision) return
          if (e.response?.status === 401)
            this.clearSession({ keepChallenge: !this.isAuthenticated })
          else {
            this.error = ui('Impossible de vérifier votre session. Réessayez.')
            throw e
          }
        } finally {
          hydrations.delete(this)
        }
      })()
      hydrations.set(this, hydration)
      return hydration
    }
  }
})
