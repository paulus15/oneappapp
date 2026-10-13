import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  detectVisitorCountry,
  resetVisitorCountryDetection,
  setVisitorCountry,
  visitorCountry,
  visitorCountryReady,
  visitorCountrySource
} from '@/utils/visitorCountry'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  resetVisitorCountryDetection()
})
afterEach(() => vi.useRealTimers())

describe('visitor country preselection', () => {
  it('preselects the detected country on a first visit', async () => {
    const fetchCode = vi.fn(async () => 'ci')
    expect(await detectVisitorCountry(fetchCode)).toBe('CI')
    expect(visitorCountry()).toBe('CI')
    expect(visitorCountrySource()).toBe('auto')
    expect(await visitorCountryReady()).toBe('CI')
  })

  it('asks the server only once, even for parallel requests', async () => {
    const fetchCode = vi.fn(async () => 'CI')
    await Promise.all([
      detectVisitorCountry(fetchCode),
      detectVisitorCountry(fetchCode)
    ])
    resetVisitorCountryDetection()
    await detectVisitorCountry(fetchCode)
    expect(fetchCode).toHaveBeenCalledTimes(1)
  })

  it('never overrides a manual choice, even a cleared one', async () => {
    const fetchCode = vi.fn(async () => 'CI')
    setVisitorCountry('FR')
    expect(await detectVisitorCountry(fetchCode)).toBe('FR')
    setVisitorCountry(null)
    resetVisitorCountryDetection()
    expect(await detectVisitorCountry(fetchCode)).toBeNull()
    expect(fetchCode).not.toHaveBeenCalled()
    expect(visitorCountrySource()).toBe('manual')
  })

  it('lets a manual choice made during detection win', async () => {
    let answer
    const pending = detectVisitorCountry(
      () => new Promise(resolve => (answer = resolve))
    )
    await Promise.resolve()
    setVisitorCountry('SN')
    answer('CI')
    expect(await pending).toBe('SN')
  })

  it('keeps the current fallback when the server cannot tell', async () => {
    expect(await detectVisitorCountry(async () => null)).toBeNull()
    expect(visitorCountry()).toBeNull()
    resetVisitorCountryDetection()
    const fetchCode = vi.fn(async () => 'CI')
    await detectVisitorCountry(fetchCode)
    // Not asked again during the same browsing session.
    expect(fetchCode).not.toHaveBeenCalled()
  })

  it('survives a failing request or an invalid answer', async () => {
    expect(
      await detectVisitorCountry(async () => {
        throw new Error('offline')
      })
    ).toBeNull()
    sessionStorage.clear()
    resetVisitorCountryDetection()
    expect(await detectVisitorCountry(async () => 'C1')).toBeNull()
  })

  it('does not hold requests longer than the timeout, but keeps a late answer', async () => {
    vi.useFakeTimers()
    let answer
    const pending = detectVisitorCountry(
      () => new Promise(resolve => (answer = resolve))
    )
    await vi.advanceTimersByTimeAsync(2500)
    expect(await pending).toBeNull()
    answer('CI')
    await vi.advanceTimersByTimeAsync(0)
    expect(visitorCountry()).toBe('CI')
  })

  it('does nothing when storage is unavailable', async () => {
    vi.spyOn(Object.getPrototypeOf(localStorage), 'getItem').mockImplementation(
      () => {
        throw new Error('denied')
      }
    )
    const fetchCode = vi.fn(async () => 'CI')
    expect(await detectVisitorCountry(fetchCode)).toBeNull()
    expect(fetchCode).not.toHaveBeenCalled()
  })
})
