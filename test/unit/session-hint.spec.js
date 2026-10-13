import { afterEach, describe, expect, it, vi } from 'vitest'
import { sessionHint, setSessionHint } from '@/utils/sessionHint'

describe('session hint storage', () => {
  afterEach(() => localStorage.clear())

  it('is unknown, then signed in, then signed out', () => {
    expect(sessionHint()).toBeNull()
    setSessionHint(true)
    expect(sessionHint()).toBe(true)
    setSessionHint(false)
    expect(sessionHint()).toBe(false)
  })

  it('treats unavailable storage as unknown without throwing', () => {
    const boom = () => {
      throw new Error('denied')
    }
    vi.spyOn(Object.getPrototypeOf(localStorage), 'getItem').mockImplementation(
      boom
    )
    vi.spyOn(Object.getPrototypeOf(localStorage), 'setItem').mockImplementation(
      boom
    )
    expect(() => setSessionHint(true)).not.toThrow()
    expect(sessionHint()).toBeNull()
  })
})
