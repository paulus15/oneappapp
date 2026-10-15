import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'

// The Lab with `lab_pro` off: same page, same requests as before Lab Pro.
const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), tools: null }))
vi.mock('@/boot/axios', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('@/services/account', () => ({
  apiMessage: error => error.response?.data?.message || 'Erreur'
}))
vi.mock('@/composables/usePlatform', async () => {
  const { ref } = await import('vue')
  mocks.tools = ref({ lab_pro: false })
  return {
    loadPlatform: () => Promise.resolve({ tools: mocks.tools.value }),
    usePlatform: () => ({
      platform: ref({ tools: mocks.tools.value }),
      tools: mocks.tools
    })
  }
})
import PwaLabPage from '@/pages/developer/PwaLabPage.vue'

const legacyReport = {
  score: 72,
  installable: true,
  installability: 'Critères réunis.',
  limits: 'Analyse statique sans navigateur.',
  checks: [
    {
      id: 'https',
      category: 'Accès',
      label: 'HTTPS',
      status: 'pass',
      detail: 'Servi en HTTPS.',
      recommendation: null
    },
    {
      id: 'manifest',
      category: 'Installation',
      label: 'Manifeste',
      status: 'warn',
      detail: 'Icône 512 absente.',
      recommendation: 'Ajoutez une icône 512 px.'
    }
  ]
}
const historyItem = {
  id: 3,
  url: 'https://old.example.com/',
  reachable: true,
  score: 60,
  installable: false,
  created_at: '2026-10-01T10:00:00Z'
}

// Scoped-style ids depend on the file that renders the markup: compare the markup only.
const html = () => wrapper.html().replace(/ data-v-[0-9a-f]+=""/g, '')
const mountPage = () =>
  (wrapper = shallowMount(PwaLabPage, {
    global: {
      renderStubDefaultSlot: true,
      stubs: { LabLegacyReport: false },
      config: { warnHandler() {} }
    }
  }))

let wrapper
beforeEach(() => {
  vi.clearAllMocks()
  mocks.tools.value = { lab_pro: false }
  mocks.get.mockImplementation(url =>
    url === '/lab/analyses'
      ? Promise.resolve({ data: { data: [historyItem] } })
      : Promise.reject(new Error(url))
  )
  mocks.post.mockResolvedValue({
    data: { id: 9, url: 'https://app.example.com/', report: legacyReport }
  })
})
afterEach(() => wrapper?.unmount())

describe('PWA Lab with lab_pro off', () => {
  it('renders and requests exactly as the original Lab', async () => {
    mountPage()
    await flushPromises()
    expect(mocks.get.mock.calls).toEqual([['/lab/analyses']])
    expect(html()).toMatchSnapshot('history')

    expect(wrapper.find('lab-pro-workspace-stub').exists()).toBe(false)
    const vm = wrapper.find('q-form')
    vm.element.dispatchEvent(new Event('submit'))
    await flushPromises()
    // Same payload as before Lab Pro: never an application_id.
    expect(mocks.post.mock.calls).toEqual([['/lab/analyses', { url: '' }]])
    expect(html()).toMatchSnapshot('report')
  })

  // Kill switch: Lab Pro turned off after pro-1 analyses were made.
  it('legacy page + pro-1 report renders without error', async () => {
    const proReport = {
      engine: 'pro-1',
      score: 64,
      installable: false,
      limits: 'Analyse HTTP.',
      installability: {
        chrome: { status: 'no', missing: ['icons'] },
        safari_ios: { status: 'unknown', missing: [] }
      },
      installability_note: 'Icônes manquantes.',
      checks: [
        {
          id: 'contrast',
          category: 'Accessibilité',
          category_key: 'accessibility',
          label: 'Contraste',
          status: 'not_measured',
          severity: 'info',
          detail: 'Nécessite un navigateur.',
          recommendation: null
        },
        {
          id: 'https',
          category: 'Accès',
          category_key: 'access',
          label: 'HTTPS',
          status: 'pass',
          severity: 'info',
          detail: 'Servi en HTTPS.',
          recommendation: null
        }
      ]
    }
    mocks.get.mockImplementation(url =>
      url === '/lab/analyses'
        ? Promise.resolve({ data: { data: [{ ...historyItem, id: 9 }] } })
        : Promise.resolve({
            data: { id: 9, url: 'https://p.example/', report: proReport }
          })
    )
    const errors = []
    mountPage()
    wrapper.vm.$.appContext.config.errorHandler = e => errors.push(e)
    await flushPromises()
    await wrapper.vm.$.setupState.open(9)
    await flushPromises()
    expect(errors).toEqual([])
    const text = wrapper.text()
    expect(text).toContain('Contraste')
    expect(text).toContain('Icônes manquantes.')
    expect(text).not.toContain('[object Object]')
  })
})
