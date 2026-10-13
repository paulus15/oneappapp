import { beforeEach, describe, expect, it, vi } from 'vitest'

const { auth, onLocaleChosen } = vi.hoisted(() => ({
  auth: { isAuthenticated: false, clearSession: vi.fn() },
  onLocaleChosen: vi.fn()
}))
vi.mock('quasar/wrappers', () => ({ boot: fn => fn }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => auth }))
vi.mock('@/utils/media', () => ({
  API_BASE_URL: 'https://api.pwastore.online/api'
}))
vi.mock('@/i18n', () => ({ onLocaleChosen, requestedLocale: () => 'fr' }))
vi.mock('@/utils/visitorCountry', () => ({ visitorCountry: () => 'CI' }))

const { default: boot, api } = await import('@/boot/axios')
const router = {
  currentRoute: { value: { path: '/', meta: {} } },
  push: vi.fn()
}
boot({ app: { config: { globalProperties: {} } }, router })
let adapter
beforeEach(() => {
  adapter = vi.fn(async config => ({
    data: {},
    status: 200,
    statusText: 'OK',
    headers: {},
    config
  }))
  api.defaults.adapter = adapter
  auth.isAuthenticated = false
  auth.clearSession.mockClear()
  router.push.mockClear()
  router.currentRoute.value = { path: '/', meta: {} }
})

describe('cookie-only API client', () => {
  it('sends credentials and the cookie opt-in header without Bearer', async () => {
    await api.post(
      '/auth/login',
      {},
      { headers: { Authorization: 'Bearer legacy' }, withCredentials: false }
    )
    const config = adapter.mock.calls[0][0]
    expect(config.withCredentials).toBe(true)
    expect(config.headers.get('X-PWA-Auth')).toBe('cookie')
    expect(config.headers.has('Authorization')).toBe(false)
  })

  it('uses cookie credentials for protected document downloads', async () => {
    await api.get('/developer-documents/42', { responseType: 'blob' })
    const config = adapter.mock.calls[0][0]
    expect(config.responseType).toBe('blob')
    expect(config.withCredentials).toBe(true)
    expect(config.headers.get('X-PWA-Auth')).toBe('cookie')
  })

  it.each([
    'https://outside.example/api/account',
    '//outside.example/api/account',
    'http://api.pwastore.online/api/account',
    'https://api.pwastore.online/elsewhere',
    '../outside-api',
    'https://user:password@api.pwastore.online/api/account'
  ])('rejects requests outside the configured HTTPS API: %s', async url => {
    await expect(api.get(url)).rejects.toThrow('configured HTTPS API')
    expect(adapter).not.toHaveBeenCalled()
  })

  it('clears a signed-in user and redirects a protected route after 401', async () => {
    auth.isAuthenticated = true
    router.currentRoute.value = {
      path: '/account',
      fullPath: '/account',
      meta: { requiresAuth: true }
    }
    adapter.mockImplementation(async config => {
      throw { response: { status: 401 }, config }
    })
    await expect(api.get('/auth/me')).rejects.toBeTruthy()
    expect(auth.clearSession).toHaveBeenCalledWith({ keepChallenge: false })
    expect(router.push).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/account' }
    })
  })

  it('keeps an anonymous OTP challenge after an invalid code', async () => {
    adapter.mockImplementation(async config => {
      throw { response: { status: 401 }, config }
    })
    await expect(
      api.post('/auth/otp/verify', { code: '000000' })
    ).rejects.toBeTruthy()
    expect(auth.clearSession).toHaveBeenCalledWith({ keepChallenge: true })
    expect(router.push).not.toHaveBeenCalled()
  })
})
