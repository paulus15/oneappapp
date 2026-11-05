import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { i18n, setLocale } from '@/i18n'

const mocks = vi.hoisted(() => ({
  auth: { isAuthenticated: false, user: null, clearSession: vi.fn() },
  push: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  notify: vi.fn()
}))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('@/boot/axios', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '17' }, fullPath: '/apps/17?from=store' }),
  useRouter: () => ({ push: mocks.push })
}))
vi.mock('quasar', async importOriginal => ({
  ...(await importOriginal()),
  useQuasar: () => ({ notify: mocks.notify, screen: { width: 390 } })
}))
vi.mock('@/services/catalog', () => ({
  catalogApi: { similar: vi.fn().mockResolvedValue({ data: [] }) }
}))
vi.mock('@/services/community', () => ({
  communityApi: { recordView: vi.fn().mockResolvedValue({}) }
}))
import AppDetails from '@/pages/store/AppDetailsPage.vue'

let wrapper, opened, target
beforeEach(async () => {
  vi.clearAllMocks()
  await setLocale('fr')
  mocks.auth.isAuthenticated = false
  mocks.get.mockResolvedValue({
    data: {
      id: 17,
      name: 'Demo',
      status: 'published',
      source_type: 'url',
      versions: []
    }
  })
  target = { opener: null, location: { replace: vi.fn() }, close: vi.fn() }
  opened = vi.spyOn(window, 'open').mockReturnValue(target)
})
afterEach(() => wrapper?.unmount())
async function mountPage() {
  wrapper = shallowMount(AppDetails, {
    global: { plugins: [i18n], config: { warnHandler: () => {} } }
  })
  await flushPromises()
}

describe('account-only app activation', () => {
  it('sends visitors to sign-in without requesting activation or opening a window', async () => {
    await mountPage()
    await wrapper.vm.launchApp()
    expect(mocks.push).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/apps/17?from=store' }
    })
    expect(mocks.post).not.toHaveBeenCalled()
    expect(opened).not.toHaveBeenCalled()
  })
  it('loads the public listing for a guest without requesting activation', async () => {
    await mountPage()
    expect(mocks.get).toHaveBeenCalledWith('/apps/17', expect.any(Object))
    expect(wrapper.text()).toContain('Demo')
    expect(mocks.push).not.toHaveBeenCalled()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(opened).not.toHaveBeenCalled()
  })
  it('requires login before downloading a version', async () => {
    await mountPage()
    mocks.get.mockClear()
    await wrapper.vm.downloadVersion(8)
    expect(mocks.push).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/apps/17?from=store' }
    })
    expect(mocks.get).not.toHaveBeenCalled()
    expect(mocks.post).not.toHaveBeenCalled()
  })
  it('requires login for the installation fallback before opening a window', async () => {
    await mountPage()
    await wrapper.vm.openApp()
    expect(mocks.push).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/apps/17?from=store' }
    })
    expect(mocks.post).not.toHaveBeenCalled()
    expect(opened).not.toHaveBeenCalled()
  })
  it('opens the URL returned by the server for an authenticated account', async () => {
    mocks.auth.isAuthenticated = true
    mocks.post.mockResolvedValue({
      data: { url: 'https://example.com/', activations_count: 1 }
    })
    await mountPage()
    await wrapper.vm.launchApp()
    expect(mocks.post).toHaveBeenCalledWith('/apps/17/activate', {
      source: 'direct'
    })
    expect(target.location.replace).toHaveBeenCalledWith('https://example.com/')
  })
  it('closes the temporary tab and returns to sign-in if the session has expired', async () => {
    mocks.auth.isAuthenticated = true
    mocks.post.mockRejectedValue({ response: { status: 401 } })
    await mountPage()
    await wrapper.vm.launchApp()
    expect(target.close).toHaveBeenCalled()
    expect(target.location.replace).not.toHaveBeenCalled()
    expect(mocks.auth.clearSession).toHaveBeenCalled()
    expect(mocks.push).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/apps/17?from=store' }
    })
  })
})
