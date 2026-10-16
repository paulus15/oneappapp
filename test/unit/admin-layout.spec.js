import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ overview: vi.fn(), stats: vi.fn() }))
vi.mock('@/services/admin', () => ({ adminApi: mocks }))
vi.mock('@/services/account', () => ({ apiMessage: e => e.message }))
vi.mock('@/components/NotificationBell.vue', () => ({ default: {} }))
vi.mock('@/components/LanguageSwitcher.vue', () => ({ default: {} }))
vi.mock('@/components/BrandLogo.vue', () => ({ default: {} }))
vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({ isDark: ref(false), toggleTheme: vi.fn() })
}))
const state = reactive({
  user: { id: 1, admin_permissions: ['settings.manage'] },
  userName: 'Admin',
  logout: vi.fn()
})
const tools = ref({})
const currentRoute = ref({ path: '/admin' })
vi.mock('@/stores/auth', () => ({ useAuthStore: () => state }))
vi.mock('@/composables/usePlatform', () => ({ usePlatform: () => ({ tools }) }))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn(), currentRoute })
}))
vi.mock('quasar', () => ({
  useQuasar: () => ({ screen: { lt: { md: true } } })
}))
import AdminLayout from '@/layouts/AdminLayout.vue'
import AdminDashboard from '@/pages/admin/AdminDashboardPage.vue'
import AdminNav from '@/components/AdminNav.vue'
import routes from '@/router/routes'
import {
  adminLinks,
  groupedAdminLinks,
  visibleAdminLinks
} from '@/router/adminLinks'
import {
  ADMIN_LAYOUT_KEY,
  loadAdminOverview,
  resetAdminOverview,
  useAdminOverview
} from '@/composables/useAdminOverview'

const mountOptions = {
  global: {
    renderStubDefaultSlot: true,
    stubs: { RouterView: { template: '<div />' } },
    config: { warnHandler() {} }
  }
}
beforeEach(() => {
  resetAdminOverview()
  mocks.overview.mockReset().mockResolvedValue({ data: { data: { todo: {} } } })
  mocks.stats.mockReset().mockResolvedValue({ data: null })
  state.user = { id: 1, admin_permissions: ['settings.manage'] }
  tools.value = {}
})

describe('dedicated administration layout', () => {
  it('places every admin page, including detail routes, in the same guarded layout', () => {
    const branch = routes.find(route =>
      route.children?.some(child => child.path === 'admin')
    )
    expect(String(branch.component)).toContain('AdminLayout.vue')
    const children = routes.flatMap(route => route.children || [])
    const admin = children.filter(route => route.path.startsWith('admin'))
    expect(admin.length).toBeGreaterThan(15)
    for (const route of admin) {
      expect(branch.children).toContain(route)
      expect(route.meta).toMatchObject({ requiresAuth: true, adminOnly: true })
    }
    for (const link of adminLinks) {
      const route = admin.find(route => `/${route.path}` === link.to)
      expect(route).toBeDefined()
      expect(route.meta.permission).toBe(link.permission)
    }
  })

  it('only shows permitted links, including AI settings even while tools are off', () => {
    expect(visibleAdminLinks(['settings.manage']).map(link => link.to)).toEqual(
      ['/admin', '/admin/settings', '/admin/ai']
    )
    expect(visibleAdminLinks(null).map(link => link.to)).toEqual(['/admin'])
    expect(
      visibleAdminLinks(['apps.moderate'], { beta: true }).some(
        link => link.to === '/admin/beta'
      )
    ).toBe(true)
    expect(
      visibleAdminLinks(['apps.moderate'], { beta: false }).some(
        link => link.to === '/admin/beta'
      )
    ).toBe(false)
    expect(groupedAdminLinks([]).map(group => group.key)).toEqual(['pilot'])
  })

  it('suppresses page tabs when the dedicated sidebar is present', () => {
    const wrapper = shallowMount(AdminNav, {
      global: { provide: { [ADMIN_LAYOUT_KEY]: true } }
    })
    expect(wrapper.find('nav').exists()).toBe(false)
    wrapper.unmount()
  })

  it('closes the mobile drawer after following a navigation link', async () => {
    currentRoute.value = { path: '/admin' }
    const wrapper = shallowMount(AdminLayout, mountOptions)
    await flushPromises()
    await wrapper.find('.admin-menu-toggle').trigger('click')
    expect(wrapper.find('.admin-menu-toggle').attributes('aria-expanded')).toBe(
      'true'
    )
    currentRoute.value = { path: '/admin/ai' }
    await flushPromises()
    expect(wrapper.find('.admin-menu-toggle').attributes('aria-expanded')).toBe(
      'false'
    )
    wrapper.unmount()
  })

  it('invalidates private counters on identity changes and leaving the admin layout', async () => {
    const wrapper = shallowMount(AdminLayout, mountOptions)
    await flushPromises()
    const { overview } = useAdminOverview()
    expect(overview.value).toEqual({ todo: {} })
    mocks.overview.mockImplementationOnce(() => new Promise(() => {}))
    state.user = { id: 2, admin_permissions: [] }
    await flushPromises()
    expect(overview.value).toBeNull()
    expect(mocks.overview).toHaveBeenCalledTimes(2)
    wrapper.unmount()
    expect(useAdminOverview().loading.value).toBe(false)
  })

  it('does not present restricted operational data as healthy zero values', async () => {
    mocks.overview.mockResolvedValueOnce({
      data: {
        data: {
          todo: {},
          tools: {},
          queue: null,
          assistant: {
            configured: false,
            enabled: false,
            model: null,
            requests_today: null,
            tokens_month: null,
            budget_left: null
          }
        }
      }
    })
    const wrapper = shallowMount(AdminDashboard, mountOptions)
    await flushPromises()
    expect(wrapper.find('.queue-card').exists()).toBe(false)
    expect(wrapper.find('.ai-requests').exists()).toBe(false)
    expect(wrapper.find('.assistant-state').text()).toContain(
      'clé API et choisissez un modèle DeepSeek'
    )
    wrapper.unmount()
  })

  it('shows authorized queue and AI usage with a configuration shortcut', async () => {
    mocks.overview.mockResolvedValueOnce({
      data: {
        data: {
          todo: {},
          tools: { assistant: true },
          queue: { pending_jobs: 3, failed_jobs: 0, oldest_pending_minutes: 1 },
          assistant: {
            configured: true,
            enabled: true,
            model: 'deepseek-chat',
            requests_today: 4,
            tokens_month: 120,
            budget_left: 500
          }
        }
      }
    })
    const wrapper = shallowMount(AdminDashboard, mountOptions)
    await flushPromises()
    expect(wrapper.find('.queue-pending').text()).toBe('3')
    expect(wrapper.find('.ai-requests').text()).toBe('4')
    expect(wrapper.find('.assistant-card').text()).toContain('deepseek-chat')
    expect(wrapper.find('[to="/admin/ai"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('ignores an in-flight response from a previous admin session', async () => {
    let complete
    mocks.overview.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          complete = resolve
        })
    )
    const pending = loadAdminOverview()
    resetAdminOverview()
    complete({ data: { data: { todo: { reports_open: 42 } } } })
    await pending
    expect(useAdminOverview().overview.value).toBeNull()
  })
})
