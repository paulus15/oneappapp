import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const post = vi.fn()
const get = vi.fn()
vi.mock('@/boot/axios', () => ({ api: { post, get } }))
vi.mock('quasar', () => ({ Notify: { create: vi.fn() } }))

const { useAuthStore } = await import('@/stores/auth')

const session = {
  user: {
    id: 1,
    name: 'Awa',
    role: 'user',
    capabilities: { 'developer.app.submit': false },
    publication_blockers: ['Déposez une pièce d’identité valide.']
  }
}

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    post.mockReset()
    get.mockReset()
    setActivePinia(createPinia())
  })

  it('keeps the OTP challenge instead of opening a session', async () => {
    post.mockResolvedValue({
      data: { requires_otp: true, challenge_id: 'c1', purpose: 'login' }
    })
    const auth = useAuthStore()
    await auth.login('awa@example.test', 'secret-password')
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.pendingChallenge.challenge_id).toBe('c1')
    expect(JSON.parse(sessionStorage.getItem('otp_challenge')).purpose).toBe(
      'login'
    )
  })

  it('opens the session once the code is verified', async () => {
    const auth = useAuthStore()
    auth.setChallenge({ challenge_id: 'c1' })
    post.mockResolvedValue({ data: session })
    await auth.verifyOtp('123456')
    expect(post).toHaveBeenCalledWith('/auth/otp/verify', {
      challenge_id: 'c1',
      code: '123456'
    })
    expect(auth.isAuthenticated).toBe(true)
    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(auth.$state).not.toHaveProperty('token')
    expect(auth.canSubmit).toBe(false)
  })

  it('surfaces the server validation message', async () => {
    post.mockRejectedValue({
      response: { data: { errors: { code: ['Code incorrect.'] } } }
    })
    const auth = useAuthStore()
    auth.setChallenge({ challenge_id: 'c1' })
    await expect(auth.verifyOtp('000000')).rejects.toBeTruthy()
    expect(auth.error).toBe('Code incorrect.')
    expect(auth.isAuthenticated).toBe(false)
  })

  it('sends the remember choice with the login', async () => {
    post.mockResolvedValue({ data: session })
    await useAuthStore().login('awa@example.test', 'secret-password', true)
    expect(post).toHaveBeenCalledWith('/auth/login', {
      email: 'awa@example.test',
      password: 'secret-password',
      remember: true
    })
  })

  it('resets the password with the pending challenge and opens a session', async () => {
    const auth = useAuthStore()
    post.mockResolvedValueOnce({
      data: {
        requires_otp: true,
        challenge_id: 'r1',
        purpose: 'password_reset',
        destination: 'a***@example.test'
      }
    })
    await auth.forgotPassword('awa@example.test')
    expect(auth.pendingChallenge.purpose).toBe('password_reset')
    post.mockResolvedValueOnce({ data: session })
    await auth.resetPassword('123456', 'new-password-1', 'new-password-1')
    expect(post).toHaveBeenLastCalledWith('/auth/password/reset', {
      challenge_id: 'r1',
      code: '123456',
      password: 'new-password-1',
      password_confirmation: 'new-password-1'
    })
    expect(auth.isAuthenticated).toBe(true)
  })

  it('keeps the masked destination when a resend omits it', async () => {
    const auth = useAuthStore()
    auth.setChallenge({ challenge_id: 'c1', destination: 'a***@example.test' })
    post.mockResolvedValue({ data: { challenge_id: 'c1', retry_after: 60 } })
    await auth.resendOtp()
    expect(auth.pendingChallenge.destination).toBe('a***@example.test')
  })

  it('closes the session once the account is deactivated', async () => {
    const auth = useAuthStore()
    auth.acceptAuthResult(session)
    auth.setChallenge({ challenge_id: 'd1', purpose: 'deactivate_account' })
    post.mockResolvedValue({ data: { deactivated: true, message: 'ok' } })
    await auth.verifyOtp('123456')
    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('removes legacy credentials without trusting a persisted user', () => {
    for (const storage of [localStorage, sessionStorage]) {
      storage.setItem('auth_token', 'old-secret')
      storage.setItem('access_token', 'old-secret')
      storage.setItem('token', 'old-secret')
      storage.setItem('auth', JSON.stringify({ token: 'old-secret' }))
      storage.setItem('user', JSON.stringify(session.user))
    }
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of ['auth_token', 'access_token', 'token', 'auth', 'user'])
        expect(storage.getItem(key)).toBeNull()
    }
  })

  it('restores the session from the server without a JavaScript token', async () => {
    get.mockResolvedValue({ data: session.user })
    const auth = useAuthStore()
    await Promise.all([auth.fetchUser(), auth.fetchUser()])
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/auth/me')
    expect(auth.user).toEqual(session.user)
    expect(auth.hydrated).toBe(true)
    expect(auth.isAuthenticated).toBe(true)
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('clears an expired session on 401', async () => {
    const auth = useAuthStore()
    auth.acceptAuthResult(session)
    get.mockRejectedValue({ response: { status: 401 } })
    await auth.fetchUser()
    expect(auth.user).toBeNull()
    expect(auth.hydrated).toBe(true)
  })

  it('preserves an anonymous OTP challenge during startup restoration', async () => {
    const auth = useAuthStore()
    auth.setChallenge({ challenge_id: 'c1', purpose: 'login' })
    get.mockRejectedValue({ response: { status: 401 } })
    await auth.fetchUser()
    expect(auth.pendingChallenge.challenge_id).toBe('c1')
    expect(auth.isAuthenticated).toBe(false)
  })

  it('does not persist an unexpected access token in the OTP payload', () => {
    const auth = useAuthStore()
    auth.setChallenge({
      requires_otp: true,
      challenge_id: 'c1',
      access_token: 'secret'
    })
    expect(JSON.stringify(auth.$state)).not.toContain('secret')
    expect(sessionStorage.getItem('otp_challenge')).not.toContain('secret')
  })

  it('keeps the user until logout completes, then clears the session', async () => {
    let finish
    post.mockImplementation(
      () =>
        new Promise(resolve => {
          finish = resolve
        })
    )
    const auth = useAuthStore()
    auth.acceptAuthResult(session)
    const logout = auth.logout()
    expect(auth.isAuthenticated).toBe(true)
    expect(post).toHaveBeenCalledWith('/auth/logout')
    finish({ data: {} })
    expect(await logout).toBe(true)
    expect(auth.isAuthenticated).toBe(false)
  })

  it('does not claim logout succeeded when the cookie could not be revoked', async () => {
    const auth = useAuthStore()
    auth.acceptAuthResult(session)
    post.mockRejectedValue(new Error('offline'))
    expect(await auth.logout()).toBe(false)
    expect(auth.isAuthenticated).toBe(true)
  })

  it('does not restore an in-flight session after logout', async () => {
    let finish
    get.mockImplementation(
      () =>
        new Promise(resolve => {
          finish = resolve
        })
    )
    const auth = useAuthStore()
    const pending = auth.fetchUser()
    post.mockResolvedValue({ data: {} })
    await auth.logout()
    finish({ data: session.user })
    await pending
    expect(auth.isAuthenticated).toBe(false)
  })

  it('allows retrying hydration after a network failure', async () => {
    const auth = useAuthStore()
    get
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: session.user })
    await expect(auth.fetchUser()).rejects.toThrow('offline')
    expect(auth.hydrated).toBe(false)
    await auth.fetchUser()
    expect(auth.isAuthenticated).toBe(true)
  })
})

describe('session hint (skip /auth/me for anonymous visitors)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    post.mockReset()
    get.mockReset()
    setActivePinia(createPinia())
  })

  it('does not call /auth/me for a visitor who was signed out', async () => {
    localStorage.setItem('pwa-session', '0')
    const auth = useAuthStore()
    await auth.restoreSession()
    expect(get).not.toHaveBeenCalled()
    expect(auth.hydrated).toBe(true)
    expect(auth.isAuthenticated).toBe(false)
  })

  it('restores the user on reload when the browser was signed in', async () => {
    localStorage.setItem('pwa-session', '1')
    get.mockResolvedValue({ data: session.user })
    const auth = useAuthStore()
    await auth.restoreSession()
    expect(get).toHaveBeenCalledWith('/auth/me')
    expect(auth.isAuthenticated).toBe(true)
  })

  it('checks once with the server when the state is unknown', async () => {
    get.mockRejectedValue({ response: { status: 401 } })
    const auth = useAuthStore()
    await auth.restoreSession()
    expect(get).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('pwa-session')).toBe('0')
  })

  it('marks the browser signed in after login and 2FA, never storing a secret', async () => {
    const auth = useAuthStore()
    post.mockResolvedValueOnce({
      data: { requires_otp: true, challenge_id: 'c1', purpose: 'login' }
    })
    await auth.login('awa@example.test', 'secret-password')
    expect(localStorage.getItem('pwa-session')).toBe('0')
    post.mockResolvedValueOnce({ data: session })
    await auth.verifyOtp('123456')
    expect(localStorage.getItem('pwa-session')).toBe('1')
    const stored = Array.from({ length: localStorage.length }, (_, i) =>
      localStorage.getItem(localStorage.key(i))
    )
    expect(stored).toEqual(['1'])
  })

  it('marks the browser signed in after registration and /auth/me', async () => {
    post.mockResolvedValue({ data: session })
    await useAuthStore().register('Awa', 'a@b.test', 'pw', 'pw', 1)
    expect(localStorage.getItem('pwa-session')).toBe('1')
    localStorage.clear()
    setActivePinia(createPinia())
    get.mockResolvedValue({ data: session.user })
    await useAuthStore().fetchUser()
    expect(localStorage.getItem('pwa-session')).toBe('1')
  })

  it('clears the hint on logout and on 401', async () => {
    const auth = useAuthStore()
    auth.acceptAuthResult(session)
    post.mockResolvedValue({ data: {} })
    await auth.logout()
    expect(localStorage.getItem('pwa-session')).toBe('0')

    auth.acceptAuthResult(session)
    get.mockRejectedValue({ response: { status: 401 } })
    await auth.fetchUser()
    expect(localStorage.getItem('pwa-session')).toBe('0')
  })

  it('keeps the hint after a network failure so the next load retries', async () => {
    localStorage.setItem('pwa-session', '1')
    get.mockRejectedValue(new Error('offline'))
    await expect(useAuthStore().restoreSession()).rejects.toThrow('offline')
    expect(localStorage.getItem('pwa-session')).toBe('1')
  })
})
