import { describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'

// Real usePlatform: when /platform fails, every tool is off and the historical Lab shows.
const mocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/boot/axios', () => ({ api: { get: mocks.get, post: vi.fn() } }))
vi.mock('@/services/account', () => ({ apiMessage: () => 'Erreur' }))
import PwaLabPage from '@/pages/developer/PwaLabPage.vue'

describe('PWA Lab when /platform fails', () => {
  it('falls back to the legacy page', async () => {
    mocks.get.mockImplementation(url =>
      url === '/platform'
        ? Promise.reject(new Error('down'))
        : Promise.resolve({ data: { data: [] } })
    )
    const wrapper = shallowMount(PwaLabPage, {
      global: { renderStubDefaultSlot: true, config: { warnHandler() {} } }
    })
    await flushPromises()
    expect(wrapper.find('lab-pro-workspace-stub').exists()).toBe(false)
    expect(wrapper.find('q-page').exists()).toBe(true)
    expect(mocks.get).toHaveBeenCalledWith('/lab/analyses')
    expect(mocks.get).not.toHaveBeenCalledWith('/developer/lab/apps')
    wrapper.unmount()
  })
})
