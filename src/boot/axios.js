import { boot } from 'quasar/wrappers'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { API_BASE_URL } from '@/utils/media'

// Create an axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
})

export default boot(({ app, router }) => {
  // Set up request interceptor to inject Sanctum auth token if it exists in local storage
  api.interceptors.request.use(
    config => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
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
        // Clear token and redirect to login page
        useAuthStore().clearSession()
        if (router.currentRoute.value.path !== '/login') {
          router.push({
            path: '/login',
            query: { redirect: router.currentRoute.value.fullPath }
          })
        }
      }
      return Promise.reject(error)
    }
  )

  // Expose axios under Vue instance (options API support)
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
