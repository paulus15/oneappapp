import { flushPromises, shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

const { state } = vi.hoisted(() => ({ state: {} }))
vi.mock('@/composables/usePlatform', () => ({ usePlatform: () => state }))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ path: '/developer' })
}))
vi.mock('@/services/account', () => ({
  accountApi: {
    developerRequests: () => Promise.resolve({ data: { summary: null } })
  }
}))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ userName: 'Dev', user: {}, logout: vi.fn() })
}))
vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({ isDark: ref(false), toggleTheme: vi.fn() })
}))
vi.mock('vue-i18n', async load => ({
  ...(await load()),
  useI18n: () => ({ t: key => key })
}))
vi.mock('@/components/NotificationBell.vue', () => ({ default: {} }))
vi.mock('@/components/LanguageSwitcher.vue', () => ({ default: {} }))
vi.mock('@/components/BrandLogo.vue', () => ({ default: {} }))
import DeveloperLayout from '@/layouts/DeveloperLayout.vue'

async function navTargets() {
  const wrapper = shallowMount(DeveloperLayout, {
    global: {
      renderStubDefaultSlot: true,
      stubs: { RouterView: { template: '<div />' } },
      config: { warnHandler() {} }
    }
  })
  await flushPromises()
  const items = wrapper
    .findAll('q-item')
    .map(item => ({ to: item.attributes('to'), text: item.text() }))
  wrapper.unmount()
  return items
}

describe('developer layout navigation', () => {
  it('keeps the Suggestions entry when the Feedback Hub is off', async () => {
    state.tools = ref({ feedback_hub: false })
    const items = await navTargets()
    expect(items).toContainEqual({
      to: '/developer/suggestions',
      text: 'Suggestions'
    })
    expect(items.some(item => item.to === '/developer/feedback')).toBe(false)
  })

  it('shows "Retours utilisateurs" instead of Suggestions when it is on', async () => {
    state.tools = ref({ feedback_hub: true })
    const items = await navTargets()
    expect(items).toContainEqual({
      to: '/developer/feedback',
      text: 'Retours utilisateurs'
    })
    expect(items.some(item => item.to === '/developer/suggestions')).toBe(false)
  })

  it('adds "Tests bêta" after the feedback entry only when the flag is on', async () => {
    state.tools = ref({ feedback_hub: true, beta: false })
    expect(
      (await navTargets()).some(item => item.to === '/developer/beta')
    ).toBe(false)
    state.tools = ref({ feedback_hub: true, beta: true })
    const items = await navTargets()
    const feedback = items.findIndex(item => item.to === '/developer/feedback')
    expect(items[feedback + 1]).toEqual({
      to: '/developer/beta',
      text: 'Tests bêta'
    })
  })

  it('adds "Statistiques avancées" after Statistiques only when the flag is on', async () => {
    state.tools = ref({ analytics_pro: false })
    expect(
      (await navTargets()).some(item => item.to === '/developer/analytics')
    ).toBe(false)
    state.tools = ref({ analytics_pro: true })
    const items = await navTargets()
    const stats = items.findIndex(item => item.to === '/developer/stats')
    expect(items[stats + 1]).toEqual({
      to: '/developer/analytics',
      text: 'Statistiques avancées'
    })
  })

  it('adds "Intégrations" only when the integrations flag is on', async () => {
    state.tools = ref({ integrations: false })
    expect(
      (await navTargets()).some(item => item.to === '/developer/integrations')
    ).toBe(false)
    state.tools = ref({ integrations: true })
    expect(await navTargets()).toContainEqual({
      to: '/developer/integrations',
      text: 'Intégrations'
    })
  })
})
