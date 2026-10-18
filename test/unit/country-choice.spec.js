import { beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'
import CountryChoice from '@/components/CountryChoice.vue'

vi.mock('@/components/CountrySelect.vue', () => ({
  default: { template: '<div />' }
}))

const mocks = vi.hoisted(() => ({ auth: null, ready: vi.fn() }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: key => key }) }))
vi.mock('@/i18n/text', () => ({ ui: text => text }))
vi.mock('@/utils/countries', () => ({
  activeCountries: async () => [],
  countryName: () => '',
  flagEmoji: () => ''
}))
vi.mock('@/utils/visitorCountry', () => ({
  visitorCountry: () => null,
  visitorCountryReady: () => mocks.ready(),
  setVisitorCountry: vi.fn()
}))

beforeEach(() => {
  mocks.auth = reactive({ isAuthenticated: false })
  mocks.ready.mockResolvedValue(null)
})

const mount = props =>
  shallowMount(CountryChoice, {
    props,
    global: {
      stubs: {
        QDialog: { props: ['modelValue', 'persistent'], template: '<div />' },
        QIcon: true
      }
    }
  })

it('opens a persistent home country dialog for a guest without a country', async () => {
  const wrapper = mount({ promptWhenMissing: true })
  await flushPromises()
  expect(wrapper.vm.$.setupState.open).toBe(true)
  mocks.auth.isAuthenticated = true
  await flushPromises()
  expect(wrapper.vm.$.setupState.open).toBe(false)
  wrapper.unmount()
})

it.each([
  { props: {}, signedIn: false, country: null },
  { props: { promptWhenMissing: true }, signedIn: true, country: null },
  { props: { promptWhenMissing: true }, signedIn: false, country: 'CI' }
])(
  'does not prompt other selectors, members or visitors with a country: %j',
  async ({ props, signedIn, country }) => {
    mocks.auth.isAuthenticated = signedIn
    mocks.ready.mockResolvedValue(country)
    const wrapper = mount(props)
    await flushPromises()
    expect(wrapper.vm.$.setupState.open).toBe(false)
    wrapper.unmount()
  }
)
