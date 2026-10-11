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
})
