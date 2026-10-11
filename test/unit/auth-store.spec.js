import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const post = vi.fn()
vi.mock('@/boot/axios', () => ({ api: { post, get: vi.fn() } }))

const { useAuthStore } = await import('@/stores/auth')

const session = {
  access_token: 'token-1',
  token_type: 'Bearer',
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
    expect(localStorage.getItem('auth_token')).toBe('token-1')
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
})
