import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  post: vi.fn(),
  notify: vi.fn(),
  route: null
}))
vi.mock('@/boot/axios', () => ({
  api: { get: mocks.get, put: mocks.put, post: mocks.post }
}))
vi.mock('@/services/account', () => ({
  apiMessage: error => error.message || 'Erreur'
}))
vi.mock('@/composables/usePlatform', async () => {
  const { ref } = await import('vue')
  return { usePlatform: () => ({ tools: ref({ monitor: true }) }) }
})
vi.mock('vue-router', async () => {
  const { reactive } = await import('vue')
  mocks.route = reactive({ path: '/developer/monitor/7', params: { id: '7' } })
  return { useRoute: () => mocks.route }
})
vi.mock('quasar', async load => ({
  ...(await load()),
  useQuasar: () => ({ notify: mocks.notify })
}))
import { monitorApi } from '@/services/monitor'
import {
  incidentState,
  monitorNextCheck,
  monitorTls,
  monitorUptime
} from '@/utils/monitor'
import MonitorPage from '@/pages/developer/MonitorPage.vue'
import MonitorAppPage from '@/pages/developer/MonitorAppPage.vue'
import MonitorBadge from '@/components/MonitorBadge.vue'

const summary = (overrides = {}) => ({
  enabled: true,
  state: 'up',
  last_checked_at: new Date(Date.now() - 5 * 60000).toISOString(),
  next_check_at: null,
  response_ms: 230,
  http_status: 200,
  tls_expires_at: null,
  tls_days_left: 40,
  manifest_ok: true,
  uptime_7d: 99.5,
  checks_7d: 300,
  open_incident: null,
  ...overrides
})
const page = data => ({ data: { data, last_page: 1, total: data.length } })

let wrapper
const mountOptions = {
  global: {
    // Render stub slots so text inside Quasar wrappers stays visible.
    renderStubDefaultSlot: true,
    stubs: { MonitorBadge, EmptyState: false },
    config: { warnHandler() {} }
  }
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.route.params.id = '7'
})
afterEach(() => wrapper?.unmount())

describe('monitor service', () => {
  it('calls the documented endpoints', async () => {
    mocks.get.mockResolvedValue({ data: {} })
    mocks.put.mockResolvedValue({ data: {} })
    mocks.post.mockResolvedValue({ data: {} })
    await monitorApi.apps(2)
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/monitor/apps', {
      params: { page: 2 }
    })
    await monitorApi.show(7)
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/monitor/apps/7')
    await monitorApi.checks(7, 3)
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/monitor/apps/7/checks',
      { params: { page: 3 } }
    )
    await monitorApi.incidents(7, 1)
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/monitor/apps/7/incidents',
      { params: { page: 1 } }
    )
    const settings = {
      enabled: true,
      interval_minutes: 30,
      notify_email: true,
      notify_recovery: false
    }
    await monitorApi.saveSettings(7, settings)
    expect(mocks.put).toHaveBeenCalledWith(
      '/developer/monitor/apps/7/settings',
      settings
    )
    await monitorApi.check(7)
    expect(mocks.post).toHaveBeenCalledWith('/developer/monitor/apps/7/check')
  })

  it('never reports 100 % without history', () => {
    expect(monitorUptime(null)).toBe('Historique insuffisant')
    expect(monitorUptime(undefined)).toBe('Historique insuffisant')
    expect(monitorUptime(100)).toBe('100 %')
  })

  it('labels edge cases honestly', () => {
    const now = Date.parse('2026-10-15T12:00:00Z')
    expect(monitorTls(0).label).toBe('Expire aujourd’hui')
    expect(monitorTls(-1).label).toBe('Expiré')
    expect(monitorNextCheck('2026-10-15T11:59:00Z', now)).toBe('imminente')
    expect(monitorNextCheck('2026-10-15T12:00:00Z', now)).toBe('imminente')
    expect(monitorNextCheck('2026-10-15T12:10:00Z', now)).toContain('10')
    expect(incidentState({ confirmed_at: 'x' }).label).toBe('En cours')
    expect(incidentState({ resolved_at: 'x' }).label).toBe('Résolu')
  })
})

describe('monitor overview', () => {
  async function render() {
    wrapper = shallowMount(MonitorPage, mountOptions)
    await flushPromises()
    return wrapper.text()
  }

  it('shows each state with its label and insufficient history', async () => {
    mocks.get.mockResolvedValue(
      page([
        { id: 1, name: 'Alpha', url: 'https://a.test', monitor: summary() },
        {
          id: 2,
          name: 'Beta',
          url: 'https://b.test',
          monitor: summary({
            state: 'degraded',
            uptime_7d: null,
            tls_days_left: 5
          })
        },
        {
          id: 3,
          name: 'Gamma',
          url: 'https://c.test',
          monitor: summary({
            state: 'down',
            manifest_ok: false,
            open_incident: { id: 9, kind: 'down' }
          })
        },
        {
          id: 4,
          name: 'Delta',
          url: 'https://d.test',
          monitor: summary({
            state: 'unknown',
            last_checked_at: null,
            uptime_7d: null
          })
        }
      ])
    )
    const text = await render()
    expect(mocks.get).toHaveBeenCalledWith('/developer/monitor/apps', {
      params: { page: 1 }
    })
    for (const label of ['En ligne', 'Dégradé', 'Indisponible', 'Inconnu'])
      expect(text).toContain(label)
    expect(text).toContain('Historique insuffisant')
    expect(text).toContain('99,5 %')
    expect(text).toContain('Expire dans 5 j')
    expect(text).toContain('Invalide ou absent')
    expect(text).toContain('Incident en cours')
    expect(text).toContain('Pas encore vérifié')
    expect(text).not.toContain('100 %')
  })

  it('marks drafts as not monitored instead of unknown', async () => {
    mocks.get.mockResolvedValue(
      page([
        {
          id: 5,
          name: 'Brouillon',
          monitorable: false,
          monitor: summary({ state: 'unknown', uptime_7d: null })
        }
      ])
    )
    const text = await render()
    expect(text).toContain(
      'Non surveillée — publiez l’application avec une adresse HTTPS'
    )
    // No monitorable app at all: the "nothing to monitor" message is shown above.
    expect(text).toContain('Aucune application à surveiller.')
    expect(text).not.toContain('Inconnu')
    expect(text).not.toContain('Historique insuffisant')
  })

  it('shows an empty state when there is no app', async () => {
    mocks.get.mockResolvedValue(page([]))
    expect(await render()).toContain('Aucune application à surveiller.')
  })

  it('shows the error and retries on demand', async () => {
    mocks.get.mockRejectedValueOnce(new Error('Service indisponible'))
    const text = await render()
    expect(text).toContain('Impossible de charger la surveillance.')
    expect(text).toContain('Service indisponible')
    mocks.get.mockResolvedValue(
      page([{ id: 1, name: 'Alpha', monitor: summary() }])
    )
    await wrapper.find('q-btn[label="Réessayer"]').trigger('click')
    await flushPromises()
    expect(mocks.get).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Alpha')
    expect(wrapper.text()).not.toContain('Impossible de charger')
  })
})

describe('monitor detail', () => {
  const detail = {
    app: { id: 7, name: 'Alpha', url: 'https://a.test', status: 'published' },
    monitor: summary(),
    settings: {
      enabled: true,
      interval_minutes: 60,
      notify_email: true,
      notify_recovery: true
    },
    intervals: [15, 30, 60, 360],
    uptime: {
      '24h': { ratio: null, checks: 0 },
      '7d': { ratio: 99.5, checks: 300 },
      '30d': { ratio: 98, checks: 1200 }
    },
    daily: [
      { date: '2026-10-13', checks: 0, ok: 0, avg_ms: null },
      { date: '2026-10-14', checks: 24, ok: 24, avg_ms: 210 }
    ]
  }
  async function render(data = detail) {
    mocks.get.mockImplementation(url =>
      Promise.resolve(
        url === '/developer/monitor/apps/7' ? { data: { data } } : page([])
      )
    )
    wrapper = shallowMount(MonitorAppPage, mountOptions)
    await flushPromises()
    return wrapper.text()
  }

  it('renders KPIs, uptime periods and labelled intervals', async () => {
    const text = await render()
    expect(text).toContain('Alpha')
    expect(text).toContain('Historique insuffisant')
    expect(text).toContain('1200 vérifications')
    expect(text).toContain('informatif')
    expect(wrapper.vm.intervalOptions.map(o => o.label)).toEqual([
      'Toutes les 15 minutes',
      'Toutes les 30 minutes',
      'Toutes les heures',
      'Toutes les 6 heures'
    ])
    expect(mocks.get).toHaveBeenCalledWith(
      '/developer/monitor/apps/7/incidents',
      { params: { page: 1 } }
    )
    expect(mocks.get).toHaveBeenCalledWith('/developer/monitor/apps/7/checks', {
      params: { page: 1 }
    })
  })

  it('saves the alert settings with the exact payload', async () => {
    await render()
    mocks.put.mockResolvedValue({
      data: {
        data: {
          enabled: true,
          interval_minutes: 15,
          notify_email: false,
          notify_recovery: false
        }
      }
    })
    wrapper.vm.form.interval_minutes = 15
    wrapper.vm.form.notify_email = false
    await wrapper.vm.saveSettings()
    // Recovery alerts only make sense with e-mail alerts on.
    expect(mocks.put).toHaveBeenCalledWith(
      '/developer/monitor/apps/7/settings',
      {
        enabled: true,
        interval_minutes: 15,
        notify_email: false,
        notify_recovery: false
      }
    )
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'positive' })
    )
  })

  it('explains the manual check throttle', async () => {
    await render()
    mocks.post.mockRejectedValue({
      response: { status: 429, headers: { 'retry-after': '170' } }
    })
    await wrapper.vm.checkNow()
    await flushPromises()
    const message =
      'Une vérification manuelle a déjà été lancée récemment. Réessayez dans 3 min.'
    expect(wrapper.text()).toContain(message)
    expect(mocks.notify).toHaveBeenCalledWith({ type: 'warning', message })
    mocks.post.mockRejectedValue({
      response: { status: 429, headers: { 'retry-after': '30' } }
    })
    await wrapper.vm.checkNow()
    expect(wrapper.vm.checkNotice.text).toContain('moins d’une minute')
    mocks.post.mockRejectedValue({ response: { status: 429, headers: {} } })
    await wrapper.vm.checkNow()
    expect(wrapper.vm.checkNotice.text).toContain('un peu plus tard')
  })

  it('reports an already scheduled check as information', async () => {
    await render()
    mocks.post.mockRejectedValue(
      Object.assign(new Error('Une vérification est déjà programmée.'), {
        response: { status: 409 }
      })
    )
    await wrapper.vm.checkNow()
    expect(wrapper.vm.checkNotice).toEqual({
      tone: 'info',
      text: 'Une vérification est déjà programmée.'
    })
    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'info',
      message: 'Une vérification est déjà programmée.'
    })
  })

  it('hides manual checks and settings for an app that cannot be monitored', async () => {
    const text = await render({
      ...detail,
      app: { ...detail.app, monitorable: false }
    })
    expect(text).toContain('Non surveillée')
    expect(text).toContain('publiez-la avec une adresse HTTPS')
    expect(wrapper.find('q-btn[label="Vérifier maintenant"]').exists()).toBe(
      false
    )
    expect(wrapper.find('q-form').exists()).toBe(false)
  })

  it('ignores a late answer for the previous app', async () => {
    const pending = {}
    mocks.get.mockImplementation(url => {
      const match = url.match(/^\/developer\/monitor\/apps\/(\d+)$/)
      if (!match) return Promise.resolve(page([]))
      return new Promise(resolve => (pending[match[1]] = resolve))
    })
    wrapper = shallowMount(MonitorAppPage, mountOptions)
    await flushPromises()
    wrapper.vm.tab = 'checks'
    mocks.route.params.id = '8'
    await flushPromises()
    expect(wrapper.vm.tab).toBe('incidents')
    const answer = (id, name, minutes) => ({
      data: {
        data: {
          ...detail,
          app: { ...detail.app, id, name },
          settings: { ...detail.settings, interval_minutes: minutes }
        }
      }
    })
    pending['8'](answer(8, 'Beta', 30))
    await flushPromises()
    pending['7'](answer(7, 'Alpha', 360))
    await flushPromises()
    expect(wrapper.vm.detail.app.name).toBe('Beta')
    expect(wrapper.vm.form.interval_minutes).toBe(30)
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.text()).not.toContain('Alpha')
  })

  it('shows a not-found state when the API answers 404', async () => {
    mocks.get.mockRejectedValue({ response: { status: 404 } })
    wrapper = shallowMount(MonitorAppPage, mountOptions)
    await flushPromises()
    expect(wrapper.text()).toContain('Application introuvable.')
  })
})
