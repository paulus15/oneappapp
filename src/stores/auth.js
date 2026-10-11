import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
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
    canSubmit: state => !!state.user?.capabilities?.['developer.app.submit'],
    isAdmin: state => state.user?.role === 'admin',
    userName: state => state.user?.name || 'Visiteur'
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
        throw new Error('Réponse de connexion incomplète.')
      this.token = data.access_token
      localStorage.setItem('auth_token', this.token)
      this.setUser(data.user)
      this.setChallenge(null)
      this.hydrated = true
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
          'Connexion au service impossible.'
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
          this.hydrated = true
          this.error = null
        } catch (e) {
          if (e.response?.status === 401) this.clearSession()
          else {
            this.error = 'Impossible de vérifier votre session. Réessayez.'
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
