import { beforeEach, describe, expect, it, vi } from 'vitest'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/boot/axios', () => ({ api: { get } }))

beforeEach(() => {
  vi.resetModules()
  get.mockReset()
})

describe('platform tools', () => {
  it('shares loading between consumers and enables only explicit boolean flags', async () => {
    let resolve
    get.mockImplementation(
      () =>
        new Promise(done => {
          resolve = done
        })
    )
    const { usePlatform, loadPlatform } =
      await import('@/composables/usePlatform')
    const first = usePlatform()
    const second = usePlatform()
    expect(
      Object.values(first.tools.value).every(value => value === false)
    ).toBe(true)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get).toHaveBeenCalledWith('/platform', {
      skipCountryDetection: true
    })
    const loaded = loadPlatform()
    resolve({
      data: {
        build_hosting: false,
        tools: { monitor: true, growth: 'true', feedback_hub: true }
      }
    })
    await loaded
    expect(first.platform).toBe(second.platform)
    expect(first.tools.value).toMatchObject({
      monitor: true,
      growth: false,
      feedback_hub: true,
      assistant: false
    })
    await loadPlatform()
    expect(get).toHaveBeenCalledTimes(1)
  })

  it('fails closed and allows an explicit retry without parallel requests', async () => {
    get.mockRejectedValueOnce(new Error('offline'))
    const { usePlatform, loadPlatform } =
      await import('@/composables/usePlatform')
    const state = usePlatform()
    await loadPlatform()
    expect(state.platform.value.build_hosting).toBe(false)
    expect(
      Object.values(state.tools.value).every(value => value === false)
    ).toBe(true)
    get.mockResolvedValue({ data: { tools: { growth: true } } })
    await Promise.all([state.refresh(), state.refresh()])
    expect(get).toHaveBeenCalledTimes(2)
    expect(state.tools.value.growth).toBe(true)
  })
})
