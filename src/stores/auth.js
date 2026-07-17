import { defineStore } from 'pinia'
import { api } from '@/boot/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('auth_token') || null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: state => !!state.token,
    isDeveloper: state =>
      state.user?.role === 'developer' || state.user?.role === 'admin',
    isAdmin: state => state.user?.role === 'admin',
    userName: state => state.user?.name || 'Visiteur'
  },

  actions: {
    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/auth/login', { email, password })
        this.token = response.data.access_token
        this.user = response.data.user

        localStorage.setItem('auth_token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))

        return true
      } catch (err) {
        this.error = err.response?.data?.message || 'Erreur de connexion'
        throw err
      } finally {
        this.loading = false
      }
    },

    async register(name, email, password, password_confirmation, role) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/auth/register', {
          name,
          email,
          password,
          password_confirmation,
          role
        })
        this.token = response.data.access_token
        this.user = response.data.user

        localStorage.setItem('auth_token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))

        return true
      } catch (err) {
        this.error = err.response?.data?.message || "Erreur d'inscription"
        throw err
      } finally {
        this.loading = false
      }
    },

    async logout() {
      this.loading = true
      try {
        await api.post('/auth/logout')
      } catch (err) {
        console.error('Logout error on server', err)
      } finally {
        this.token = null
        this.user = null
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        this.loading = false
      }
    },

    async fetchUser() {
      if (!this.token) return
      try {
        const response = await api.get('/auth/me')
        this.user = response.data
        localStorage.setItem('user', JSON.stringify(this.user))
      } catch {
        this.logout()
      }
    }
  }
})
