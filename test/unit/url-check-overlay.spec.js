import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({ post: vi.fn() }))
vi.mock('@/boot/axios', () => ({ api: { post: mocks.post } }))
vi.mock('@/services/account', () => ({ apiMessage: error => error.message }))
import UrlCheckOverlay from '@/components/UrlCheckOverlay.vue'

const report = (ok, statuses) => ({
  data: {
    ok,
    steps: Object.entries(statuses).map(([key, status]) => ({
      key,
      status,
      message: ''
    }))
  }
})

let wrapper
beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  wrapper = shallowMount(UrlCheckOverlay)
})
afterEach(() => {
  wrapper.unmount()
  vi.useRealTimers()
})

describe('PWA link check before saving a draft', () => {
  it('saves the draft only when no blocking step fails', async () => {
    mocks.post.mockResolvedValue(
      report(true, {
        format: 'pass',
        domain: 'pass',
        https: 'pass',
        manifest: 'warn'
      })
    )
    const save = vi.fn().mockResolvedValue({})
    const run = wrapper.vm.run('https://agenda.example', save)
    await vi.runAllTimersAsync()
    expect(await run).toBe(true)
    expect(mocks.post).toHaveBeenCalledWith('/apps/url-preflight', {
      url: 'https://agenda.example'
    })
    expect(save).toHaveBeenCalledOnce()
  })

  it('never saves when a step fails, and stays open to explain why', async () => {
    mocks.post.mockResolvedValue(
      report(false, {
        format: 'pass',
        domain: 'pass',
        https: 'fail',
        manifest: 'skipped'
      })
    )
    const save = vi.fn()
    const run = wrapper.vm.run('https://broken.example', save)
    await vi.runAllTimersAsync()
    expect(save).not.toHaveBeenCalled()
    const steps = wrapper.vm.$.setupState.steps
    expect(steps.find(s => s.key === 'https').status).toBe('fail')
    expect(steps.find(s => s.key === 'save').status).toBe('skipped')
    wrapper.vm.$.setupState.close(false)
    expect(await run).toBe(false)
  })
})
