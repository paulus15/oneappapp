import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, shallowMount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { setLocale } from '@/i18n'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  notify: vi.fn(),
  replace: vi.fn(),
  download: vi.fn(),
  route: null,
  tools: null
}))
vi.mock('@/boot/axios', () => ({ api: { get: mocks.get } }))
vi.mock('@/services/account', () => ({
  apiMessage: error => {
    const errors = error.response?.data?.errors
    return errors
      ? Object.values(errors).flat().join(' ')
      : error.response?.data?.message || error.message || 'Erreur'
  }
}))
vi.mock('@/composables/usePlatform', async () => {
  const { ref } = await import('vue')
  mocks.tools = ref({ analytics_pro: true, growth: true })
  return { usePlatform: () => ({ tools: mocks.tools }) }
})
vi.mock('vue-router', async () => {
  const { reactive } = await import('vue')
  mocks.route = reactive({ path: '/developer/analytics', query: {} })
  return {
    useRoute: () => mocks.route,
    useRouter: () => ({ replace: mocks.replace })
  }
})
vi.mock('quasar', async load => ({
  ...(await load()),
  useQuasar: () => ({ notify: mocks.notify })
}))
vi.mock('@/utils/growth', async load => ({
  ...(await load()),
  downloadBlob: mocks.download
}))

import { analyticsApi } from '@/services/analytics'
import {
  analyticsDelta,
  analyticsKpis,
  analyticsParams,
  exportFilename,
  externalHost,
  formatRate,
  isoDay,
  listingLink,
  presetRange,
  rangeError,
  resolveListingSource,
  listingSourceFor,
  seriesPoints,
  countryRowLabel,
  sourceLabel
} from '@/utils/analytics'
import { countryLabel } from '@/utils/countries'
import { provideListingSource } from '@/composables/useListingSource'
import { resolveToolAccess } from '@/router/guards'
import AnalyticsPage from '@/pages/developer/AnalyticsPage.vue'
import AppCard from '@/components/AppCard.vue'
import DeveloperStatsPage from '@/pages/developer/DeveloperStatsPage.vue'

const ORIGIN = 'https://store.test'

describe('listing source resolver', () => {
  it('uses the store section from the history state, then ?src=', () => {
    expect(
      resolveListingSource({
        state: { listingSource: 'search', back: '/' },
        query: 'home'
      })
    ).toEqual({ source: 'search' })
    expect(resolveListingSource({ state: null, query: 'category' })).toEqual({
      source: 'category'
    })
    expect(
      resolveListingSource({ state: { listingSource: 'developer_page' } })
    ).toEqual({ source: 'developer_page' })
  })

  it('never lets a link claim a deduced source', () => {
    for (const forged of ['campaign', 'external', 'direct', 'bogus'])
      expect(
        resolveListingSource({
          state: { listingSource: forged },
          query: forged
        })
      ).toEqual({ source: 'direct' })
  })

  it('sends only the hostname of another website, on the first page only', () => {
    expect(
      resolveListingSource({
        referrer: 'https://Blog.Example.org/post?id=7#x',
        origin: ORIGIN
      })
    ).toEqual({ source: 'external', referrer_host: 'blog.example.org' })
    // No referrer at all: a direct access (typed address, bookmark…).
    expect(resolveListingSource({ referrer: '', origin: ORIGIN })).toEqual({
      source: 'direct'
    })
    // A store page opened in a new tab: an in-store visit, not a direct one.
    expect(
      resolveListingSource({ referrer: `${ORIGIN}/apps`, origin: ORIGIN })
    ).toEqual({ source: 'other' })
    // Another app (Android intent…): external, without a hostname to keep.
    expect(
      resolveListingSource({ referrer: 'android-app://x', origin: ORIGIN })
    ).toEqual({ source: 'external' })
    // After moving inside the store, the original referrer no longer applies.
    expect(
      resolveListingSource({
        state: { back: '/account' },
        referrer: 'https://blog.example.org/',
        origin: ORIGIN
      })
    ).toEqual({ source: 'other' })
  })

  it('remembers the first source per app and reuses it after a detour', () => {
    sessionStorage.clear()
    const tagged = { state: { back: '/', listingSource: 'category' } }
    expect(listingSourceFor(4, tagged)).toEqual({ source: 'category' })
    expect(listingSourceFor(4, { state: { back: '/apps/9' } })).toEqual({
      source: 'category'
    })
    expect(
      listingSourceFor(4, {
        state: { back: '/login?redirect=/apps/4', listingSource: 'home' }
      })
    ).toEqual({ source: 'category' })
    // A new real source replaces it; other apps are unaffected.
    expect(
      listingSourceFor(4, { state: { back: '/', listingSource: 'home' } })
    ).toEqual({ source: 'home' })
    expect(listingSourceFor(5, { state: { back: '/x' } })).toEqual({
      source: 'other'
    })
    sessionStorage.setItem('pwa-source-6', '{broken')
    expect(listingSourceFor(6, { state: { back: '/x' } })).toEqual({
      source: 'other'
    })
  })

  it('reads the hostname safely', () => {
    expect(externalHost('not a url', ORIGIN)).toBe('')
    expect(externalHost('http://a.example:8080/x', ORIGIN)).toBe('a.example')
  })

  it('builds listing locations with the section in the history state', () => {
    expect(listingLink('/apps/4', 'home')).toEqual({
      path: '/apps/4',
      state: { listingSource: 'home' }
    })
    expect(listingLink('/apps/4', null)).toBe('/apps/4')
    expect(listingLink('/apps/4', 'campaign')).toBe('/apps/4')
    expect(listingLink('/apps/4?x=1', 'home')).toBe('/apps/4?x=1')
  })

  it('makes app cards carry the section provided by their page', () => {
    const Link = {
      props: ['to'],
      template: '<a :data-to="JSON.stringify(to)"><slot /></a>'
    }
    const Section = defineComponent({
      setup() {
        provideListingSource('similar')
        return () => h(AppCard, { app: { to: '/apps/9', name: 'Nine' } })
      }
    })
    const wrapper = mount(Section, {
      global: { stubs: { RouterLink: Link, AppIcon: true, HostingBadge: true } }
    })
    expect(JSON.parse(wrapper.find('a').attributes('data-to'))).toEqual({
      path: '/apps/9',
      state: { listingSource: 'similar' }
    })
    const alone = mount(AppCard, {
      props: { app: { to: '/apps/9', name: 'Nine' } },
      global: { stubs: { RouterLink: Link, AppIcon: true, HostingBadge: true } }
    })
    expect(alone.find('a').attributes('data-to')).toBe('"/apps/9"')
  })
})

describe('analytics helpers', () => {
  beforeEach(() => setLocale('fr'))

  it('labels every source in French', () => {
    expect(
      [
        'home',
        'search',
        'category',
        'collection',
        'developer_page',
        'similar',
        'direct',
        'external',
        'campaign',
        'other',
        'unknown'
      ].map(sourceLabel)
    ).toEqual([
      'Accueil',
      'Recherche',
      'Catégorie',
      'Collection',
      'Page développeur',
      'Applications similaires',
      'Accès direct',
      'Site externe',
      'Campagne',
      'Autre',
      'Autre'
    ])
  })

  it('computes deltas with arrows, and "—" without a previous value', () => {
    expect(analyticsDelta(120, 100)).toMatchObject({
      text: '↑ 20 %',
      tone: 'up'
    })
    expect(analyticsDelta(75, 100)).toMatchObject({
      text: '↓ 25 %',
      tone: 'down'
    })
    expect(analyticsDelta(5, 0).text).toBe('—')
    expect(analyticsDelta(5, null).text).toBe('—')
    expect(analyticsDelta(null, 4).text).toBe('—')
    expect(analyticsDelta(12.5, 10, { points: true })).toMatchObject({
      text: '↑ 2,5 pt',
      tone: 'up'
    })
    expect(analyticsDelta(10, 10).tone).toBe('flat')
  })

  it('names the KPIs exactly and keeps a null conversion as "—"', () => {
    const cards = analyticsKpis({
      views: 1200,
      unique_visitors: 800,
      activations: 90,
      conversion: null,
      sdk_opens: 3,
      declared_installs: 1,
      reviews: 1,
      average_rating: 4.25,
      previous: { views: 1000, conversion: 5 }
    })
    expect(cards.map(card => card.label)).toEqual([
      'Consultations de la fiche',
      'Visiteurs uniques (par jour, cumulés)',
      'Clics sur « Ouvrir »',
      'Taux de clic (Ouvrir / consultations)',
      'Ouvertures mesurées par le SDK',
      'Installations déclarées',
      'Note moyenne (toutes périodes)'
    ])
    expect(cards[0].value).toBe('1 200')
    expect(cards[0].delta.text).toBe('↑ 20 %')
    expect(cards[3].value).toBe('—')
    expect(cards[3].delta.text).toBe('—')
    expect(cards[4].delta).toBe(null)
    expect(cards[6].value).toBe('4,3 ★')
    expect(cards[6].note).toBe('1 avis reçu sur la période')
    expect(formatRate(12.34)).toBe('12,3 %')
  })

  it('uses the server explanation of unique visitors when given', () => {
    const [, unique] = analyticsKpis({}, { uniqueVisitorsNote: 'Note API' })
    expect(unique.note).toBe('Note API')
  })

  it('validates periods with the API rules', () => {
    const today = new Date(2026, 9, 15)
    expect(rangeError('2026-01-01', '2026-01-31', today)).toBe('')
    expect(rangeError('2026-02-01', '2026-01-31', today)).toMatch(/précéder/)
    expect(rangeError('2025-01-01', '2026-01-02', today)).toBe(
      'La période est limitée à 366 jours.'
    )
    expect(rangeError('2025-01-01', '2026-01-01', today)).toBe('')
    expect(rangeError('2026-02-30', '2026-03-01', today)).toMatch(/valides/)
    expect(rangeError('2026-10-16', '2026-10-20', today)).toMatch(/futur/)
    expect(presetRange(7, today)).toEqual({
      from: '2026-10-09',
      to: '2026-10-15'
    })
  })

  it('builds query parameters and file names', () => {
    expect(
      analyticsParams({
        applicationId: null,
        from: '2026-01-01',
        to: '2026-01-31',
        granularity: 'nope'
      })
    ).toEqual({ from: '2026-01-01', to: '2026-01-31', granularity: 'day' })
    const range = { dataset: 'sources', from: '2026-01-01', to: '2026-01-31' }
    expect(
      exportFilename('attachment; filename="pwa-store-analytics-x.csv"', range)
    ).toBe('pwa-store-analytics-x.csv')
    expect(
      exportFilename("attachment; filename*=UTF-8''a%20b.csv", range)
    ).toBe('a b.csv')
    expect(exportFilename('attachment; filename="../../.x"', range)).toBe('x')
    expect(exportFilename(undefined, range)).toBe(
      'pwa-store-analytics-sources-2026-01-01-2026-01-31.csv'
    )
    expect(
      seriesPoints(
        [
          {
            period: '2026-01-05',
            start: '2026-01-07',
            end: '2026-01-11',
            partial: true,
            views: '3'
          },
          { period: '2026-01-12', views: 2 }
        ],
        'views'
      )
    ).toEqual([
      { day: '2026-01-07', value: 3, label: '7–11 janv.', partial: true },
      { day: '2026-01-12', value: 2, label: '12 janv.', partial: false }
    ])
  })

  it('names declared countries and the undeclared bucket', () => {
    expect(countryLabel(null)).toBe('Non déclaré')
    expect(countryRowLabel({ code: null, other: true }, countryLabel)).toBe(
      'Autres pays'
    )
    expect(countryRowLabel({ code: null, other: false }, countryLabel)).toBe(
      'Non déclaré'
    )
    expect(countryLabel('ci')).toMatch(/Côte d.Ivoire/)
  })

  it('calls the documented endpoints', async () => {
    mocks.get.mockResolvedValue({ data: {} })
    await analyticsApi.overview({ from: 'a' })
    expect(mocks.get).toHaveBeenCalledWith('/developer/analytics/overview', {
      params: { from: 'a' }
    })
    await analyticsApi.exportCsv({ from: 'a' }, 'countries')
    expect(mocks.get).toHaveBeenCalledWith('/developer/analytics/export.csv', {
      params: { from: 'a', dataset: 'countries' },
      responseType: 'blob',
      headers: { Accept: 'text/csv' }
    })
  })
})

describe('analytics access', () => {
  it('guards the page behind the analytics_pro flag', async () => {
    const { default: routes } = await import('@/router/routes')
    const developer = routes.find(r => r.path === '/developer')
    const pages = developer.children.filter(
      child => child.meta?.tool === 'analytics_pro'
    )
    expect(pages.map(child => child.path)).toEqual(['analytics'])
    expect(resolveToolAccess(pages[0], { tools: {} })).toBe('/developer/lab')
    expect(
      resolveToolAccess(pages[0], { tools: { analytics_pro: false } })
    ).toBe('/developer/lab')
    expect(
      resolveToolAccess(pages[0], { tools: { analytics_pro: true } })
    ).toBe(true)
  })
})

const overview = (overrides = {}) => ({
  range: { from: '2026-09-16', to: '2026-10-15', granularity: 'day' },
  kpis: {
    views: 240,
    unique_visitors: 180,
    activations: 30,
    conversion: 12.5,
    sdk_opens: 4,
    declared_installs: 2,
    reviews: 3,
    average_rating: 4.5,
    previous: {
      views: 200,
      unique_visitors: 0,
      activations: 40,
      conversion: 10
    }
  },
  unique_visitors_note: 'Explication du serveur.',
  series: [
    {
      period: '2026-09-16',
      start: '2026-09-16',
      end: '2026-09-16',
      partial: false,
      views: 10,
      unique_visitors: 8,
      activations: 1,
      sdk_opens: 0,
      declared_installs: 0
    }
  ],
  sources: [
    { source: 'search', views: 150, activations: 20, conversion: 13.3 },
    { source: 'external', views: 10, activations: 1, conversion: null }
  ],
  countries: [
    { code: 'CI', views: 120, activations: 12, other: false },
    { code: null, views: 6, activations: 0, other: true },
    { code: null, views: 40, activations: 2, other: false }
  ],
  referrers: [
    { host: 'blog.example.org', views: 7, other: false },
    { host: 'autres', views: 3, other: true }
  ],
  campaigns: [
    {
      id: 5,
      name: 'WhatsApp — octobre',
      source: 'whatsapp',
      visits: 8,
      views: 6,
      opens: 1,
      conversion: null
    }
  ],
  top_apps: [
    {
      id: 1,
      name: 'Alpha',
      icon_url: null,
      views: 200,
      activations: 25,
      conversion: 12.5
    }
  ],
  data_since: null,
  ...overrides
})

describe('analytics page', () => {
  let wrapper
  const mountOptions = {
    global: {
      renderStubDefaultSlot: true,
      stubs: { EmptyState: false },
      config: { warnHandler() {} }
    }
  }
  function mockApi(data = overview()) {
    mocks.get.mockImplementation(url => {
      if (url === '/developer/apps')
        return Promise.resolve({ data: [{ id: 1, name: 'Alpha' }] })
      if (url === '/developer/analytics/overview')
        return Promise.resolve({ data: { data } })
      return Promise.reject(new Error(`unexpected ${url}`))
    })
  }
  const overviewCalls = () =>
    mocks.get.mock.calls.filter(
      ([url]) => url === '/developer/analytics/overview'
    )
  async function render(data) {
    mockApi(data)
    wrapper = shallowMount(AnalyticsPage, mountOptions)
    await flushPromises()
    return wrapper
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    await setLocale('fr')
    mocks.route.query = {}
    mocks.tools.value = { analytics_pro: true, growth: true }
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('asks for the last 30 days of all apps by default', async () => {
    await render()
    const today = isoDay(new Date())
    expect(overviewCalls()[0][1]).toEqual({
      params: { ...presetRange(30), granularity: 'day' }
    })
    expect(overviewCalls()[0][1].params.to).toBe(today)
  })

  it('renders the KPIs, their deltas, notes and "—" without comparison', async () => {
    await render()
    const card = key => wrapper.find(`[data-kpi="${key}"]`)
    expect(card('views').text()).toContain('Consultations de la fiche')
    expect(card('views').find('.delta').text()).toContain('↑ 20 %')
    expect(card('views').find('.delta').classes()).toContain('delta-up')
    expect(card('activations').find('.delta').text()).toContain('↓ 25 %')
    expect(card('activations').find('.delta').classes()).toContain('delta-down')
    expect(card('unique_visitors').find('.delta').text()).toContain('—')
    expect(card('unique_visitors').text()).toContain('Explication du serveur.')
    expect(card('conversion').find('.delta').text()).toContain('↑ 2,5 pt')
    expect(card('activations').text()).toContain(
      'Un clic sur « Ouvrir » n’est pas une installation.'
    )
    expect(card('average_rating').text()).toContain(
      'Note moyenne (toutes périodes)'
    )
  })

  it('hides every delta when the previous period is incomplete', async () => {
    await render(
      overview({ kpis: { ...overview().kpis, previous_complete: false } })
    )
    expect(wrapper.findAll('.delta')).toHaveLength(0)
    expect(wrapper.find('.kpi-help').text()).toBe(
      'Comparaison indisponible : la période précédente précède le début de la collecte.'
    )
  })

  it('labels weekly buckets with their span and marks partial ones', async () => {
    const week = (start, end, partial, views) => ({
      period: start,
      start,
      end,
      partial,
      views,
      unique_visitors: 1,
      activations: 0,
      sdk_opens: 0,
      declared_installs: 0
    })
    mocks.route.query = { granularity: 'week' }
    await render(
      overview({
        series: [
          week('2026-09-16', '2026-09-20', true, 4),
          week('2026-09-21', '2026-09-27', false, 9),
          week('2026-10-12', '2026-10-15', true, 2)
        ]
      })
    )
    expect(wrapper.find('.chart-caption').text()).toBe(
      'Un point par semaine, du lundi au dimanche. Périodes incomplètes (coupées par les dates choisies) : 16–20 sept., 12–15 oct.'
    )
    wrapper.vm.seriesTable = true
    await flushPromises()
    const rows = wrapper.findAll('.series-table tbody tr')
    expect(rows.map(row => row.classes().includes('partial'))).toEqual([
      true,
      false,
      true
    ])
    expect(rows[0].find('th').text()).toBe('16–20 sept. (partielle)')
    expect(rows[1].find('th').text()).toBe('21–27 sept.')
  })

  it('shows "—" for a conversion hidden by the API', async () => {
    await render(
      overview({
        kpis: { ...overview().kpis, views: 12, conversion: null }
      })
    )
    const card = wrapper.find('[data-kpi="conversion"]')
    expect(card.find('.kpi-value').text()).toBe('—')
    expect(card.find('.delta').text()).toContain('—')
  })

  it('lists sources, countries ("Non déclaré" last), referrers and campaigns', async () => {
    await render()
    const text = wrapper.text()
    expect(text).toContain('Recherche')
    expect(text).toContain('Site externe')
    const countries = wrapper.findAll('.country-row').map(row => row.text())
    expect(countries[0]).toMatch(/Côte d.Ivoire/)
    expect(countries[1]).toContain('Autres pays')
    expect(countries[2]).toContain('Non déclaré')
    expect(text).toContain('blog.example.org')
    expect(text).toContain(
      'Autres sites (moins de 5 consultations ou au-delà du top 10)'
    )
    // Visitor-provided hosts are never rendered as links.
    expect(wrapper.find('.referrers a').exists()).toBe(false)
    expect(text).not.toContain('autres')
    expect(text).toContain(
      'Pays et sites externes : les lignes de moins de 5 consultations sont regroupées pour protéger la vie privée.'
    )
    const link = wrapper.find('.campaign-link')
    expect(link.attributes('to')).toBe('/developer/growth/campaigns/5')
    expect(text).toContain('Alpha')
  })

  it('names campaigns without a link when Growth is off, and hides empty sections', async () => {
    mocks.tools.value = { analytics_pro: true, growth: false }
    await render()
    expect(wrapper.find('.campaign-link').exists()).toBe(false)
    expect(wrapper.text()).toContain('WhatsApp — octobre')
    wrapper.unmount()
    await render(overview({ campaigns: [], top_apps: [] }))
    expect(wrapper.find('.campaigns').exists()).toBe(false)
    expect(wrapper.find('.top-apps').exists()).toBe(false)
  })

  it('shows the data_since banner only when the period starts earlier', async () => {
    await render(overview({ data_since: '2026-10-01' }))
    expect(wrapper.find('.data-since').text()).toContain(
      'Données détaillées disponibles depuis le 1 octobre 2026'
    )
    wrapper.unmount()
    await render(overview({ data_since: '2026-01-01' }))
    expect(wrapper.find('.data-since').exists()).toBe(false)
  })

  it('shows an empty state when nothing happened', async () => {
    const kpis = {
      ...overview().kpis,
      views: 0,
      activations: 0,
      sdk_opens: 0,
      declared_installs: 0
    }
    await render(overview({ kpis }))
    expect(wrapper.text()).toContain('Aucune donnée sur cette période.')
    expect(wrapper.find('[data-kpi="views"]').exists()).toBe(false)
  })

  it('turns filters into query parameters and keeps them in the address', async () => {
    await render()
    await wrapper.findAll('.period')[2].trigger('click')
    await wrapper.findAll('.granularity')[1].trigger('click')
    wrapper.vm.filters.applicationId = 1
    await flushPromises()
    expect(overviewCalls().at(-1)[1]).toEqual({
      params: { application_id: 1, ...presetRange(90), granularity: 'week' }
    })
    expect(mocks.replace).toHaveBeenLastCalledWith({
      query: { app: '1', period: '90', granularity: 'week' }
    })
    // "Par application" only makes sense for all apps.
    expect(wrapper.find('.top-apps').exists()).toBe(false)
  })

  it('starts from the address and validates a custom range before asking', async () => {
    mocks.route.query = {
      period: 'custom',
      from: '2026-01-01',
      to: '2026-01-31',
      granularity: 'month'
    }
    await render()
    expect(overviewCalls()[0][1].params).toEqual({
      from: '2026-01-01',
      to: '2026-01-31',
      granularity: 'month'
    })
    const calls = overviewCalls().length
    wrapper.vm.draft.from = '2024-01-01'
    wrapper.vm.draft.to = '2026-01-31'
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.range-error').text()).toBe(
      'La période est limitée à 366 jours.'
    )
    expect(overviewCalls()).toHaveLength(calls)
    wrapper.vm.draft.from = '2026-02-01'
    wrapper.vm.draft.to = '2026-02-28'
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(overviewCalls().at(-1)[1].params).toMatchObject({
      from: '2026-02-01',
      to: '2026-02-28'
    })
  })

  it('ignores a late answer for previous filters', async () => {
    const answers = []
    mocks.get.mockImplementation(url =>
      url === '/developer/apps'
        ? Promise.resolve({ data: [] })
        : new Promise(resolve => answers.push(resolve))
    )
    wrapper = shallowMount(AnalyticsPage, mountOptions)
    await flushPromises()
    await wrapper.findAll('.period')[0].trigger('click')
    await flushPromises()
    expect(answers).toHaveLength(2)
    answers[1]({ data: { data: overview({ top_apps: [] }) } })
    await flushPromises()
    answers[0]({
      data: {
        data: overview({ kpis: { ...overview().kpis, views: 999999 } })
      }
    })
    await flushPromises()
    expect(wrapper.find('[data-kpi="views"] .kpi-value').text()).toBe('240')
  })

  it('falls back to all apps with a notice when ?app= is not the developer’s', async () => {
    mocks.route.query = { app: '999' }
    mocks.get.mockImplementation((url, options) => {
      if (url === '/developer/apps') return Promise.resolve({ data: [] })
      return options.params.application_id
        ? Promise.reject({ response: { status: 404, data: {} } })
        : Promise.resolve({ data: { data: overview() } })
    })
    wrapper = shallowMount(AnalyticsPage, mountOptions)
    await flushPromises()
    expect(overviewCalls()[0][1].params.application_id).toBe(999)
    expect(overviewCalls().at(-1)[1].params.application_id).toBeUndefined()
    expect(wrapper.find('.app-notice').text()).toContain(
      'Cette application n’est pas disponible dans vos statistiques'
    )
    expect(wrapper.find('[data-kpi="views"]').exists()).toBe(true)
    expect(mocks.replace).toHaveBeenLastCalledWith({ query: {} })
  })

  it('cleans an invalid address once on arrival', async () => {
    mocks.route.query = {
      period: 'custom',
      from: '2026-05-01',
      to: '2024-01-01',
      granularity: 'year'
    }
    await render()
    expect(mocks.replace).toHaveBeenCalledTimes(1)
    expect(mocks.replace).toHaveBeenCalledWith({ query: {} })
    expect(overviewCalls()[0][1].params).toEqual({
      ...presetRange(30),
      granularity: 'day'
    })
  })

  it('names the share-link columns precisely', async () => {
    await render()
    const headers = wrapper.findAll('.campaigns thead th').map(th => th.text())
    expect(headers).toEqual([
      'Lien',
      'Visites',
      'Consultations',
      'Clics « Ouvrir »',
      'Taux de clic (Ouvrir / visites du lien)'
    ])
  })

  it('shows the error and retries on demand', async () => {
    mocks.get.mockImplementation(url =>
      url === '/developer/apps'
        ? Promise.resolve({ data: [] })
        : Promise.reject({
            response: { status: 422, data: { message: 'Période invalide.' } }
          })
    )
    wrapper = shallowMount(AnalyticsPage, mountOptions)
    await flushPromises()
    expect(wrapper.text()).toContain('Période invalide.')
    mockApi()
    await wrapper.find('.retry').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-kpi="views"]').exists()).toBe(true)
  })

  it('exports a dataset as a CSV download named by the server', async () => {
    await render()
    const blob = new Blob(['a,b'], { type: 'text/csv' })
    mocks.get.mockResolvedValueOnce({
      data: blob,
      headers: {
        'content-disposition':
          'attachment; filename="pwa-store-analytics-sources-2026-09-16-2026-10-15.csv"'
      }
    })
    await wrapper.find('[data-dataset="sources"]').trigger('click')
    await flushPromises()
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/analytics/export.csv',
      {
        params: { ...presetRange(30), granularity: 'day', dataset: 'sources' },
        responseType: 'blob',
        headers: { Accept: 'text/csv' }
      }
    )
    expect(mocks.download).toHaveBeenCalledWith(
      blob,
      'pwa-store-analytics-sources-2026-09-16-2026-10-15.csv'
    )
  })

  it('reads the error message of a refused export', async () => {
    await render()
    mocks.get.mockRejectedValueOnce({
      response: {
        status: 422,
        data: new Blob([JSON.stringify({ message: 'Trop long.' })])
      }
    })
    await wrapper.find('[data-dataset="series"]').trigger('click')
    // Reading a Blob is asynchronous outside the microtask queue.
    await vi.waitFor(() =>
      expect(mocks.notify).toHaveBeenCalledWith({
        type: 'negative',
        message: 'Trop long.'
      })
    )
    expect(mocks.download).not.toHaveBeenCalled()
  })
})

describe('basic statistics wording', () => {
  it('names first "Ouvrir" clicks per account and explains the difference', async () => {
    await setLocale('fr')
    mocks.get.mockResolvedValue({
      data: {
        totals: {
          activations: 3,
          views: 10,
          opens: 1,
          installs: 0,
          reviews: 0,
          new_reviews: 0,
          open_reports: 0,
          average_rating: null
        },
        series: [],
        applications: [],
        rating_distribution: {}
      }
    })
    const wrapper = shallowMount(DeveloperStatsPage, {
      global: {
        directives: { countUp: {} },
        mocks: { $q: { screen: { lt: { sm: false } } } },
        config: { warnHandler() {} }
      }
    })
    await flushPromises()
    const text = wrapper.text()
    expect(text).toContain('Premiers clics sur « Ouvrir » (par compte)')
    expect(text).toContain(
      'Les statistiques avancées en comptent un par compte et par jour.'
    )
    expect(text).not.toContain('Activations')
    wrapper.unmount()
  })
})
