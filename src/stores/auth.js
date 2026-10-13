import { ui } from '@/i18n/text'
import { defineStore } from 'pinia'
import { Notify } from 'quasar'
import { api } from '@/boot/axios'
import { setLocale } from '@/i18n'
let hydration
function storedUser() {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return null
  }
}
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: storedUser(),
    token: localStorage.getItem('auth_token') || null,
    loading: false,
    error: null,
    pendingChallenge: (() => {
      try {
        return JSON.parse(sessionStorage.getItem('otp_challenge'))
      } catch {
        return null
      }
    })(),
    hydrated: false
  }),
  getters: {
    isAuthenticated: state => !!state.token,
    isDeveloper: state =>
      !!state.user?.capabilities?.['developer.portal.access'],
    canCreateApp: state => !!state.user?.capabilities?.['developer.app.create'],
    canSubmit: state => !!state.user?.capabilities?.['developer.app.submit'],
    isAdmin: state => state.user?.role === 'admin',
    userName: state => state.user?.name || ui('Visiteur')
  },
  actions: {
    setChallenge(data) {
      this.pendingChallenge = data
      if (data) sessionStorage.setItem('otp_challenge', JSON.stringify(data))
      else sessionStorage.removeItem('otp_challenge')
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
      if (!data.access_token || !data.user)
        throw new Error(ui('Réponse de connexion incomplète.'))
      this.token = data.access_token
      localStorage.setItem('auth_token', this.token)
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
      localStorage.setItem('user', JSON.stringify(user))
    },
    clearSession() {
      this.user = null
      this.token = null
      this.hydrated = true
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      // Searches typed while signed in stay private to that session.
      localStorage.removeItem('oneapp_search_history')
      this.setChallenge(null)
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
      try {
        await api.post('/auth/logout')
      } catch {
        // Offline or server error: this device is signed out anyway, but the session may stay
        // open on the server until it expires. Say so instead of failing silently.
        Notify.create({
          type: 'warning',
          timeout: 8000,
          message: ui(
            'Déconnecté sur cet appareil. La session n’a pas pu être fermée sur le serveur : fermez-la depuis « Sécurité du compte » une fois en ligne.'
          )
        })
      } finally {
        this.clearSession()
      }
    },
    async fetchUser() {
      if (!this.token) {
        this.hydrated = true
        return
      }
      if (hydration) return hydration
      hydration = (async () => {
        try {
          const { data } = await api.get('/auth/me')
          this.setUser(data)
          this.applyAccountLocale()
          this.hydrated = true
          this.error = null
        } catch (e) {
          if (e.response?.status === 401) this.clearSession()
          else {
            this.error = ui('Impossible de vérifier votre session. Réessayez.')
            throw e
          }
        } finally {
          hydration = null
        }
      })()
      return hydration
    }
  }
})
