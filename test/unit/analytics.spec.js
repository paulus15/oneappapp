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
  defaultCountryView,
  geoAttributionLink,
  networkCityLabel,
  networkCountryRowLabel,
  sourceLabel,
  totalsCoverage
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
      'Consultations de la fiche (1 par visiteur et par jour)',
      'Visiteurs uniques (par jour, cumulés)',
      'Clics sur « Ouvrir » (1 par compte et par jour)',
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

  it('groups all visits, unique people per period and opens, with deltas', () => {
    const cards = analyticsKpis({
      visits_total: 500,
      unique_visitors_period: 120,
      views: 300,
      unique_visitors: 200,
      opens_total: 60,
      unique_openers_period: 0,
      activations: 40,
      conversion: 13.3,
      previous: {
        visits_total: 400,
        unique_visitors_period: 150,
        opens_total: 0,
        unique_openers_period: 10
      }
    })
    const byKey = Object.fromEntries(cards.map(card => [card.key, card]))
    expect(cards.map(card => [card.group, card.key])).toEqual([
      ['visits', 'visits_total'],
      ['visits', 'unique_visitors_period'],
      ['visits', 'views'],
      ['opens', 'opens_total'],
      ['opens', 'unique_openers_period'],
      ['opens', 'activations'],
      ['opens', 'conversion'],
      ['opens', 'sdk_opens'],
      ['opens', 'declared_installs'],
      ['rating', 'average_rating']
    ])
    expect(byKey.visits_total.label).toBe('Visites (toutes)')
    expect(byKey.visits_total.value).toBe('500')
    expect(byKey.visits_total.delta.text).toBe('↑ 25 %')
    expect(byKey.unique_visitors_period.label).toBe(
      'Visiteurs uniques sur la période'
    )
    expect(byKey.unique_visitors_period.note).toBe(
      'Même compte, ou même appareil (adresse IP + navigateur) pour les visiteurs non connectés : compté une seule fois sur toute la période. Un visiteur qui se connecte en cours de visite peut être compté deux fois.'
    )
    expect(byKey.unique_visitors_period.delta.text).toBe('↓ 20 %')
    expect(byKey.opens_total.label).toBe('Clics « Ouvrir » (tous)')
    expect(byKey.opens_total.delta.text).toBe('—')
    expect(byKey.unique_openers_period.label).toBe(
      'Personnes ayant cliqué « Ouvrir » sur la période'
    )
    // A real 0 is shown, not hidden.
    expect(byKey.unique_openers_period.value).toBe('0')
    expect(byKey.unique_openers_period.delta.text).toBe('↓ 100 %')
    expect(byKey.views.secondary).toBe(true)
    expect(byKey.activations.secondary).toBe(true)
    expect(byKey.visits_total.secondary).toBe(false)
    // No new delta without a complete previous period.
    const incomplete = analyticsKpis({
      visits_total: 5,
      previous_complete: false,
      previous: { visits_total: 2 }
    })
    expect(incomplete.every(card => card.delta === null)).toBe(true)
  })

  it('leaves out the new cards on an older API instead of showing 0', () => {
    const keys = analyticsKpis({ views: 3, unique_visitors: 2 }).map(
      card => card.key
    )
    expect(keys).not.toContain('visits_total')
    expect(keys).not.toContain('unique_visitors_period')
    expect(keys).not.toContain('opens_total')
    expect(keys).not.toContain('unique_openers_period')
    expect(keys).toContain('unique_visitors')
    expect(
      analyticsKpis({ unique_visitors_period: null }).map(card => card.key)
    ).not.toContain('unique_visitors_period')
  })

  it('names countries of connection and picks the view shown first', () => {
    expect(
      networkCountryRowLabel({ code: null, other: false }, countryLabel)
    ).toBe('Inconnu')
    expect(
      networkCountryRowLabel({ code: null, other: true }, countryLabel)
    ).toBe('Autres pays')
    expect(networkCountryRowLabel({ code: 'ci' }, countryLabel)).toMatch(
      /Côte d.Ivoire/
    )
    expect(
      defaultCountryView({
        network_countries: [],
        network_country_source: 'dbip'
      })
    ).toBe('network')
    expect(
      defaultCountryView({
        network_countries: [],
        network_country_source: 'none'
      })
    ).toBe('declared')
    expect(defaultCountryView({ countries: [] })).toBe('declared')
  })

  it('tells how far back all visits and unique people were measured', () => {
    const range = { from: '2026-10-01', to: '2026-10-10' }
    // Previous period: 21 – 30 sept.
    expect(totalsCoverage({ range, totals_since: '2026-09-21' })).toEqual({
      banner: null,
      since: '2026-09-21',
      comparable: true
    })
    expect(totalsCoverage({ range, totals_since: '2026-09-22' })).toEqual({
      banner: null,
      since: '2026-09-22',
      comparable: false
    })
    expect(totalsCoverage({ range, totals_since: '2026-10-05' })).toMatchObject(
      { banner: 'since', comparable: false }
    )
    expect(
      totalsCoverage({ range, totals_since: null, kpis: { visits_total: 0 } })
    ).toMatchObject({ banner: 'none', comparable: false })
    // An older API without the field changes nothing.
    expect(totalsCoverage({ range })).toMatchObject({
      banner: null,
      comparable: true
    })
    const cards = analyticsKpis(
      {
        visits_total: 5,
        opens_total: 2,
        views: 4,
        previous: { visits_total: 1, opens_total: 1, views: 2 }
      },
      { totalsComparable: false }
    )
    const delta = key => cards.find(card => card.key === key).delta
    expect(delta('visits_total')).toBe(null)
    expect(delta('opens_total')).toBe(null)
    expect(delta('views').text).toBe('↑ 100 %')
  })

  it('names cities of connection and keeps only web links for the attribution', () => {
    expect(networkCityLabel({ city: 'Abidjan', other: false })).toBe('Abidjan')
    expect(networkCityLabel({ city: null, other: true })).toBe('Autres villes')
    expect(networkCityLabel({ city: null, other: false })).toBe(
      'Ville inconnue'
    )
    expect(
      geoAttributionLink({
        text: 'IP Geolocation by DB-IP',
        url: 'https://db-ip.com'
      })
    ).toEqual({ text: 'IP Geolocation by DB-IP', url: 'https://db-ip.com/' })
    expect(
      geoAttributionLink({ text: 'DB-IP', url: 'javascript:alert(1)' })
    ).toEqual({ text: 'DB-IP', url: '' })
    expect(geoAttributionLink(null)).toBe(null)
    expect(geoAttributionLink({ text: '', url: 'https://db-ip.com' })).toBe(
      null
    )
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

  const precise = (overrides = {}) =>
    overview({
      kpis: {
        ...overview().kpis,
        visits_total: 400,
        unique_visitors_period: 150,
        opens_total: 50,
        unique_openers_period: 20,
        previous: {
          ...overview().kpis.previous,
          visits_total: 200,
          unique_visitors_period: 150,
          opens_total: 100,
          unique_openers_period: 0
        }
      },
      series: [
        {
          period: '2026-09-16',
          start: '2026-09-16',
          end: '2026-09-16',
          partial: false,
          views: 10,
          unique_visitors: 8,
          visits_total: 14,
          unique_visitors_bucket: 7,
          activations: 1,
          opens_total: 3,
          unique_openers_bucket: 2,
          sdk_opens: 0,
          declared_installs: 0
        }
      ],
      network_countries: [
        {
          code: 'SN',
          other: false,
          visits_total: 90,
          unique_visitors: 40,
          opens_total: 9
        },
        {
          code: null,
          other: true,
          visits_total: 8,
          unique_visitors: 6,
          opens_total: 1
        },
        {
          code: null,
          other: false,
          visits_total: 30,
          unique_visitors: 25,
          opens_total: 2
        }
      ],
      network_country_source: 'dbip',
      network_cities: [
        {
          country: 'SN',
          city: 'Dakar',
          other: false,
          visits_total: 70,
          unique_visitors: 30,
          opens_total: 7
        },
        {
          country: null,
          city: null,
          other: true,
          visits_total: 9,
          unique_visitors: 8,
          opens_total: 1
        },
        {
          country: 'CI',
          city: null,
          other: false,
          visits_total: 12,
          unique_visitors: 10,
          opens_total: 0
        }
      ],
      geo_attribution: {
        text: 'IP Geolocation by DB-IP',
        url: 'https://db-ip.com'
      },
      ...overrides
    })

  it('groups the KPI cards into visits and opens with their deltas', async () => {
    await render(precise())
    const group = key => wrapper.find(`[data-group="${key}"]`)
    expect(group('visits').find('h2').text()).toBe('Visites')
    expect(group('opens').find('h2').text()).toBe('Clics « Ouvrir »')
    expect(
      group('visits')
        .findAll('[data-kpi]')
        .map(card => card.attributes('data-kpi'))
    ).toEqual(['visits_total', 'unique_visitors_period', 'views'])
    expect(
      group('opens')
        .findAll('[data-kpi]')
        .map(card => card.attributes('data-kpi'))
    ).toEqual([
      'opens_total',
      'unique_openers_period',
      'activations',
      'conversion',
      'sdk_opens',
      'declared_installs'
    ])
    const card = key => wrapper.find(`[data-kpi="${key}"]`)
    expect(card('visits_total').text()).toContain('Visites (toutes)')
    expect(card('visits_total').find('.kpi-value').text()).toBe('400')
    expect(card('visits_total').find('.delta').text()).toContain('↑ 100 %')
    expect(card('unique_visitors_period').text()).toContain(
      'Visiteurs uniques sur la période'
    )
    expect(card('unique_visitors_period').find('.delta').classes()).toContain(
      'delta-flat'
    )
    expect(card('opens_total').text()).toContain('Clics « Ouvrir » (tous)')
    expect(card('opens_total').find('.delta').text()).toContain('↓ 50 %')
    expect(card('unique_openers_period').find('.delta').text()).toContain('—')
    expect(card('views').classes()).toContain('secondary')
    expect(card('views').text()).toContain(
      'Consultations de la fiche (1 par visiteur et par jour)'
    )
    // The per-day unique visitors give way to the per-period count.
    expect(card('unique_visitors').exists()).toBe(false)
  })

  it('hides the new cards and keeps the old ones on an older API', async () => {
    await render()
    for (const key of [
      'visits_total',
      'unique_visitors_period',
      'opens_total',
      'unique_openers_period'
    ])
      expect(wrapper.find(`[data-kpi="${key}"]`).exists()).toBe(false)
    expect(wrapper.find('[data-kpi="unique_visitors"]').exists()).toBe(true)
    expect(wrapper.find('[data-kpi="views"]').classes()).toContain('secondary')
    // Old series: only the per-day unique visitors toggle, no country toggle.
    const series = wrapper
      .findAll('.extra')
      .map(button => button.attributes('data-series'))
    expect(series).toEqual([
      'unique_visitors',
      'sdk_opens',
      'declared_installs'
    ])
    expect(wrapper.find('.country-views').exists()).toBe(false)
    expect(wrapper.find('[data-dataset="network_countries"]').exists()).toBe(
      false
    )
  })

  it('hides the new deltas when the previous period is incomplete', async () => {
    await render(
      precise({
        kpis: { ...precise().kpis, previous_complete: false }
      })
    )
    expect(wrapper.find('[data-kpi="visits_total"]').exists()).toBe(true)
    expect(wrapper.findAll('.delta')).toHaveLength(0)
  })

  it('warns when totals start inside the range and drops their deltas', async () => {
    await render(
      precise({
        range: { from: '2026-09-16', to: '2026-10-15', granularity: 'day' },
        totals_since: '2026-10-01'
      })
    )
    expect(wrapper.find('.totals-since').text()).toContain(
      'Visites totales et visiteurs uniques mesurés depuis le 1 octobre 2026 : les jours précédents ne sont pas comptés.'
    )
    for (const key of [
      'visits_total',
      'unique_visitors_period',
      'opens_total',
      'unique_openers_period'
    ])
      expect(wrapper.find(`[data-kpi="${key}"] .delta`).exists()).toBe(false)
    expect(wrapper.find('[data-kpi="views"] .delta').exists()).toBe(true)
    wrapper.unmount()
    // Measured long enough: no banner, deltas back.
    await render(precise({ totals_since: '2026-01-01' }))
    expect(wrapper.find('.totals-since').exists()).toBe(false)
    expect(wrapper.find('[data-kpi="visits_total"] .delta').exists()).toBe(true)
    wrapper.unmount()
    await render(
      precise({
        kpis: { ...precise().kpis, visits_total: 0, opens_total: 0 },
        totals_since: null
      })
    )
    expect(wrapper.find('.totals-since').text()).toContain('pas encore mesurés')
  })

  it('charts all visits, opens and unique people per bucket', async () => {
    await render(precise())
    const series = wrapper
      .findAll('.extra')
      .map(button => button.attributes('data-series'))
    expect(series).toEqual([
      'visits_total',
      'unique_visitors_bucket',
      'opens_total',
      'unique_openers_bucket',
      'sdk_opens',
      'declared_installs'
    ])
    expect(wrapper.findAll('.extra').map(button => button.text())).toEqual([
      'Visites (toutes)',
      'Visiteurs uniques',
      'Clics « Ouvrir » (tous)',
      'Personnes ayant cliqué « Ouvrir »',
      'Ouvertures SDK',
      'Installations déclarées'
    ])
    expect(wrapper.find('.chart-caption').text()).toBe('Un point par jour.')
    await wrapper
      .find('[data-series="unique_visitors_bucket"]')
      .trigger('click')
    await wrapper.find('[data-series="visits_total"]').trigger('click')
    expect(wrapper.vm.chartPoints.unique_visitors_bucket[0].value).toBe(7)
    expect(wrapper.vm.chartPoints.visits_total[0].value).toBe(14)
    expect(
      wrapper
        .findAllComponents({ name: 'TrendChart' })
        .map(c => c.props('title'))
    ).toEqual([
      'Consultations de la fiche',
      'Clics sur « Ouvrir »',
      'Visites (toutes)',
      'Visiteurs uniques'
    ])
    expect(wrapper.find('.chart-caption').text()).toBe(
      'Un point par jour. Visiteurs uniques comptés une fois par période affichée (jour, semaine ou mois).'
    )
    // Both unique series: both notes.
    await wrapper.find('[data-series="unique_openers_bucket"]').trigger('click')
    expect(wrapper.vm.chartPoints.unique_openers_bucket[0].value).toBe(2)
    expect(wrapper.find('.chart-caption').text()).toBe(
      'Un point par jour. Visiteurs uniques comptés une fois par période affichée (jour, semaine ou mois). Personnes ayant cliqué « Ouvrir » comptées une fois par période affichée (jour, semaine ou mois).'
    )
    await wrapper
      .find('[data-series="unique_visitors_bucket"]')
      .trigger('click')
    expect(wrapper.find('.chart-caption').text()).toBe(
      'Un point par jour. Personnes ayant cliqué « Ouvrir » comptées une fois par période affichée (jour, semaine ou mois).'
    )
    wrapper.vm.seriesTable = true
    await flushPromises()
    const headers = wrapper
      .findAll('.series-table thead th')
      .map(th => th.text())
    expect(headers).toContain('Personnes ayant cliqué « Ouvrir »')
    expect(headers).not.toContain('Visiteurs uniques (par jour, cumulés)')
  })

  it('shows the countries of connection first, with unknown and grouped rows', async () => {
    await render(precise())
    expect(
      wrapper.find('[data-view="network"]').attributes('aria-pressed')
    ).toBe('true')
    expect(wrapper.find('[data-view="network"]').text()).toBe(
      'Pays de connexion (estimé)'
    )
    expect(wrapper.find('.network-note').text()).toBe(
      'Estimé d’après l’adresse IP au moment de la visite ; l’adresse IP n’est jamais enregistrée.'
    )
    expect(wrapper.find('.network-none').exists()).toBe(false)
    expect(wrapper.find('.network-multi').text()).toBe(
      'Un visiteur venu de deux pays apparaît dans chacun.'
    )
    expect(
      wrapper.findAll('.network-countries thead th').map(th => th.text())
    ).toEqual([
      'Pays',
      'Visites',
      'Visiteurs uniques',
      'Clics « Ouvrir » (tous)'
    ])
    const rows = wrapper.findAll('.network-country-row').map(row => row.text())
    expect(rows[0]).toMatch(/Sénégal.*90.*40.*9/)
    expect(rows[1]).toContain('Autres pays')
    expect(rows[2]).toContain('Inconnu')
    expect(wrapper.find('.country-row').exists()).toBe(false)
    // Switch to the declared country.
    await wrapper.find('[data-view="declared"]').trigger('click')
    expect(wrapper.find('.network-countries').exists()).toBe(false)
    expect(wrapper.find('.declared-note').text()).toBe(
      'Pays déclaré ou choisi par le visiteur sur le store, pas une géolocalisation.'
    )
    expect(wrapper.findAll('.country-row')).toHaveLength(3)
  })

  it('lists cities of connection with the licence attribution', async () => {
    await render(precise())
    expect(wrapper.findAll('.country-view').map(b => b.text())).toEqual([
      'Pays de connexion (estimé)',
      'Villes de connexion (estimé)',
      'Pays déclaré'
    ])
    const attribution = () => wrapper.find('.geo-attribution a')
    expect(attribution().text()).toBe('IP Geolocation by DB-IP')
    expect(attribution().attributes()).toMatchObject({
      href: 'https://db-ip.com/',
      target: '_blank',
      rel: 'noopener noreferrer'
    })
    await wrapper.find('[data-view="cities"]').trigger('click')
    expect(
      wrapper.findAll('.network-cities thead th').map(th => th.text())
    ).toEqual([
      'Ville',
      'Pays',
      'Visites',
      'Visiteurs uniques',
      'Clics « Ouvrir » (tous)'
    ])
    const rows = wrapper.findAll('.network-city-row').map(row => row.text())
    expect(rows[0]).toMatch(/Dakar.*Sénégal.*70.*30.*7/)
    expect(rows[1]).toContain('Autres villes')
    expect(rows[2]).toMatch(/Ville inconnue.*Côte d.Ivoire/)
    expect(attribution().exists()).toBe(true)
    expect(wrapper.find('[data-dataset="network_cities"]').text()).toBe(
      'Villes de connexion'
    )
    // The attribution belongs to the estimate only.
    await wrapper.find('[data-view="declared"]').trigger('click')
    expect(wrapper.find('.geo-attribution').exists()).toBe(false)
  })

  it('works without cities nor attribution from the server', async () => {
    const data = precise()
    delete data.network_cities
    delete data.geo_attribution
    await render(data)
    expect(wrapper.find('[data-view="cities"]').exists()).toBe(false)
    expect(wrapper.find('[data-dataset="network_cities"]').exists()).toBe(false)
    expect(wrapper.find('.geo-attribution').exists()).toBe(false)
    expect(wrapper.find('.network-countries').exists()).toBe(true)
  })

  it('opens on the declared country when the server makes no estimate', async () => {
    await render(precise({ network_country_source: 'none' }))
    expect(
      wrapper.find('[data-view="declared"]').attributes('aria-pressed')
    ).toBe('true')
    expect(wrapper.find('.country-row').exists()).toBe(true)
    expect(wrapper.find('.network-none').exists()).toBe(false)
    await wrapper.find('[data-view="network"]').trigger('click')
    expect(wrapper.find('.network-none').text()).toContain(
      'Estimation non configurée : lancez « php artisan pwa:geoip-update » sur le serveur.'
    )
  })

  it('exports the countries of connection', async () => {
    await render(precise())
    const item = wrapper.find('[data-dataset="network_countries"]')
    expect(item.text()).toBe('Pays de connexion')
    mocks.get.mockResolvedValueOnce({ data: new Blob(['a']), headers: {} })
    await item.trigger('click')
    await flushPromises()
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/analytics/export.csv',
      {
        params: {
          ...presetRange(30),
          granularity: 'day',
          dataset: 'network_countries'
        },
        responseType: 'blob',
        headers: { Accept: 'text/csv' }
      }
    )
    expect(mocks.download).toHaveBeenCalledWith(
      expect.any(Blob),
      `pwa-store-analytics-network_countries-${presetRange(30).from}-${presetRange(30).to}.csv`
    )
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
