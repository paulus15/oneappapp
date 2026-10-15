import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import { i18n, setLocale } from '@/i18n'

const TOKEN = 'AbCdEfGh12345678IjKlMn'
const mocks = vi.hoisted(() => ({
  auth: { isAuthenticated: true, user: null, clearSession: vi.fn() },
  push: vi.fn(),
  replace: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  recordView: vi.fn(),
  notify: vi.fn(),
  route: null
}))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('@/boot/axios', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ push: mocks.push, replace: mocks.replace })
}))
vi.mock('quasar', async importOriginal => ({
  ...(await importOriginal()),
  useQuasar: () => ({ notify: mocks.notify, screen: { width: 390 } })
}))
vi.mock('@/services/catalog', () => ({
  catalogApi: { similar: vi.fn().mockResolvedValue({ data: [] }) }
}))
vi.mock('@/services/community', () => ({
  communityApi: { recordView: mocks.recordView }
}))
import AppDetails from '@/pages/store/AppDetailsPage.vue'

let wrapper, visitAppId
const visits = () =>
  mocks.post.mock.calls.filter(([url]) => url.startsWith('/campaigns/'))
function setRoute(id, query = {}) {
  mocks.route = reactive({
    path: `/apps/${id}`,
    hash: '',
    fullPath: `/apps/${id}`,
    params: { id: String(id) },
    query
  })
}
beforeEach(async () => {
  vi.clearAllMocks()
  sessionStorage.clear()
  await setLocale('fr')
  visitAppId = 17
  mocks.recordView.mockResolvedValue({})
  mocks.get.mockImplementation(url => {
    const id = Number(url.split('/').pop())
    return Promise.resolve({
      data: {
        id,
        name: `App ${id}`,
        status: 'published',
        source_type: 'url',
        versions: []
      }
    })
  })
  mocks.post.mockImplementation(url => {
    if (url.startsWith('/campaigns/'))
      return Promise.resolve({ data: { application_id: visitAppId } })
    return Promise.resolve({
      data: { url: 'https://example.com/', activations_count: 1 }
    })
  })
  vi.spyOn(window, 'open').mockReturnValue({
    opener: null,
    location: { replace: vi.fn() },
    close: vi.fn()
  })
})
afterEach(() => wrapper?.unmount())
async function mountPage() {
  wrapper = shallowMount(AppDetails, {
    global: { plugins: [i18n], config: { warnHandler: () => {} } }
  })
  await flushPromises()
}

describe('share-link attribution on the listing', () => {
  it('counts the visit once, then passes the token to the view and to Ouvrir', async () => {
    setRoute(17, { c: TOKEN, from: 'store' })
    await mountPage()
    expect(visits()).toEqual([[`/campaigns/${TOKEN}/visit`]])
    // The token leaves the address bar; other parameters stay.
    expect(mocks.replace).toHaveBeenCalledWith({
      path: '/apps/17',
      query: { from: 'store' },
      hash: ''
    })
    expect(sessionStorage.getItem('pwa-campaign-17')).toBe(TOKEN)
    expect(mocks.recordView).toHaveBeenCalledWith(17, TOKEN)
    await wrapper.vm.launchApp()
    expect(mocks.post).toHaveBeenCalledWith('/apps/17/activate', {
      campaign: TOKEN
    })
    expect(visits()).toHaveLength(1)
  })

  it('never sends the token for another app', async () => {
    sessionStorage.setItem('pwa-campaign-17', TOKEN)
    setRoute(18)
    await mountPage()
    expect(mocks.recordView).toHaveBeenCalledWith(18, undefined)
    await wrapper.vm.launchApp()
    expect(mocks.post).toHaveBeenCalledWith('/apps/18/activate')
    expect(visits()).toHaveLength(0)
  })

  it('drops a token that the server attributes to another app', async () => {
    visitAppId = 99
    setRoute(17, { c: TOKEN })
    await mountPage()
    expect(visits()).toHaveLength(1)
    expect(sessionStorage.getItem('pwa-campaign-17')).toBe(null)
    expect(mocks.recordView).toHaveBeenCalledWith(17, undefined)
  })

  it('accepts a 204 answer without body (bots)', async () => {
    mocks.post.mockImplementation(url =>
      url.startsWith('/campaigns/')
        ? Promise.resolve({ status: 204, data: '' })
        : Promise.resolve({
            data: { url: 'https://example.com/', activations_count: 1 }
          })
    )
    setRoute(17, { c: TOKEN })
    await mountPage()
    expect(wrapper.vm.app.name).toBe('App 17')
    expect(visits()).toHaveLength(1)
    expect(mocks.recordView).toHaveBeenCalledWith(17, TOKEN)
  })

  it('attributes a quick click on Ouvrir made while the visit is checked', async () => {
    let answer
    mocks.post.mockImplementation(url =>
      url.startsWith('/campaigns/')
        ? new Promise(resolve => (answer = resolve))
        : Promise.resolve({
            data: { url: 'https://example.com/', activations_count: 1 }
          })
    )
    setRoute(17, { c: TOKEN })
    await mountPage()
    const launching = wrapper.vm.launchApp()
    await flushPromises()
    expect(mocks.post).not.toHaveBeenCalledWith(
      '/apps/17/activate',
      expect.anything()
    )
    answer({ data: { application_id: 17 } })
    await launching
    expect(mocks.post).toHaveBeenCalledWith('/apps/17/activate', {
      campaign: TOKEN
    })
    expect(mocks.recordView).toHaveBeenCalledWith(17, TOKEN)
  })

  it('never blocks Ouvrir more than a moment on a slow visit', async () => {
    mocks.post.mockImplementation(url =>
      url.startsWith('/campaigns/')
        ? new Promise(() => {})
        : Promise.resolve({
            data: { url: 'https://example.com/', activations_count: 1 }
          })
    )
    setRoute(17, { c: TOKEN })
    await mountPage()
    vi.useFakeTimers()
    try {
      const launching = wrapper.vm.launchApp()
      await vi.advanceTimersByTimeAsync(1600)
      await launching
    } finally {
      vi.useRealTimers()
    }
    expect(mocks.post).toHaveBeenCalledWith('/apps/17/activate')
  })

  it('captures a new token for the same app without reloading it', async () => {
    const other = 'ZyXwVuTsRqPoNmLkJiHgFe'
    setRoute(17)
    await mountPage()
    mocks.route.query = { c: other }
    await flushPromises()
    expect(visits()).toEqual([[`/campaigns/${other}/visit`]])
    expect(mocks.replace).toHaveBeenCalledWith({
      path: '/apps/17',
      query: {},
      hash: ''
    })
    expect(sessionStorage.getItem('pwa-campaign-17')).toBe(other)
    expect(mocks.get).toHaveBeenCalledTimes(1)
    expect(mocks.recordView).toHaveBeenCalledTimes(1)
  })

  it('drops a visit still pending when moving to another app', async () => {
    let answer
    mocks.post.mockImplementation(url =>
      url.startsWith('/campaigns/')
        ? new Promise(resolve => (answer = resolve))
        : Promise.resolve({
            data: { url: 'https://example.com/', activations_count: 1 }
          })
    )
    setRoute(17, { c: TOKEN })
    await mountPage()
    mocks.route.params.id = '18'
    mocks.route.path = '/apps/18'
    mocks.route.query = {}
    await flushPromises()
    answer({ data: { application_id: 17 } })
    await flushPromises()
    expect(mocks.recordView).toHaveBeenCalledWith(18, undefined)
    expect(sessionStorage.getItem('pwa-campaign-18')).toBe(null)
    await wrapper.vm.launchApp()
    expect(mocks.post).toHaveBeenCalledWith('/apps/18/activate')
  })

  it('ignores an invalid token but still cleans the address', async () => {
    setRoute(17, { c: 'abc<script>' })
    await mountPage()
    expect(visits()).toHaveLength(0)
    expect(mocks.replace).toHaveBeenCalledWith({
      path: '/apps/17',
      query: {},
      hash: ''
    })
    expect(sessionStorage.getItem('pwa-campaign-17')).toBe(null)
    expect(mocks.recordView).toHaveBeenCalledWith(17, undefined)
  })

  it('keeps the page working when the visit is refused', async () => {
    mocks.post.mockImplementation(url =>
      url.startsWith('/campaigns/')
        ? Promise.reject({ response: { status: 404 } })
        : Promise.resolve({
            data: { url: 'https://example.com/', activations_count: 1 }
          })
    )
    setRoute(17, { c: TOKEN })
    await mountPage()
    expect(wrapper.vm.app.name).toBe('App 17')
    expect(mocks.recordView).toHaveBeenCalledWith(17, undefined)
    await wrapper.vm.launchApp()
    expect(mocks.post).toHaveBeenCalledWith('/apps/17/activate')
  })
})
