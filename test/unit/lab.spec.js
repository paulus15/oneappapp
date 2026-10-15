import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, shallowMount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  tools: null,
  route: { params: { id: '9' } }
}))
vi.mock('@/boot/axios', () => ({ api: { get: mocks.get, post: mocks.post } }))
vi.mock('@/services/account', () => ({
  apiMessage: error =>
    error.response?.data?.message || error.message || 'Erreur'
}))
vi.mock('@/composables/usePlatform', async () => {
  const { ref } = await import('vue')
  mocks.tools = ref({ lab_pro: true })
  return {
    loadPlatform: () => Promise.resolve({ tools: mocks.tools.value }),
    usePlatform: () => ({
      platform: ref({ tools: mocks.tools.value }),
      tools: mocks.tools
    })
  }
})
vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ resolve: path => ({ href: path }) })
}))
import { labApi } from '@/services/lab'
import {
  DEFAULT_ISSUE_FILTERS,
  analysisErrorMessage,
  categoryLabel,
  compareErrorMessage,
  filterChecks,
  formatBytes,
  formatMs,
  isProReport,
  metricDelta,
  safeDocUrl,
  severityLabel,
  statusLabel,
  SEVERITY_LABELS,
  STATUS_LABELS,
  CATEGORY_LABELS,
  INSTALL_LABELS,
  MISSING_LABELS,
  METRICS,
  ANALYSIS_STEPS
} from '@/utils/lab'
import { resolveToolAccess } from '@/router/guards'
import routes from '@/router/routes'
import PwaLabPage from '@/pages/developer/PwaLabPage.vue'
import LabProWorkspace from '@/components/lab/LabProWorkspace.vue'
import LabProReport from '@/components/lab/LabProReport.vue'
import LabIssueItem from '@/components/lab/LabIssueItem.vue'
import LabCompare from '@/components/lab/LabCompare.vue'
import LabPrintPage from '@/pages/developer/LabPrintPage.vue'

const check = (overrides = {}) => ({
  id: 'sw',
  category: 'Service worker',
  category_key: 'service_worker',
  label: 'Service worker enregistré',
  status: 'fail',
  severity: 'high',
  detail: 'Aucun service worker trouvé.',
  impact: 'Pas de mode hors ligne.',
  recommendation: 'Enregistrez un service worker.',
  example: "navigator.serviceWorker.register('/sw.js')",
  doc_url: 'https://web.dev/articles/service-worker-lifecycle',
  measured_by: 'http',
  ...overrides
})
const checks = [
  check(),
  check({
    id: 'csp',
    category: 'En-têtes de sécurité',
    category_key: 'security_headers',
    label: 'Content-Security-Policy',
    status: 'warn',
    severity: 'medium',
    detail: 'En-tête absent.',
    example: '<script>alert(1)</script>',
    doc_url: 'https://evil.example.com/csp'
  }),
  check({
    id: 'https',
    category: 'Accès',
    category_key: 'access',
    label: 'HTTPS',
    status: 'pass',
    severity: 'info',
    detail: 'Servi en HTTPS.',
    impact: null,
    recommendation: null,
    example: null,
    doc_url: null
  }),
  check({
    id: 'contrast',
    category: 'Accessibilité',
    category_key: 'accessibility',
    label: 'Contraste des couleurs',
    status: 'not_measured',
    severity: 'low',
    detail: 'Nécessite le rendu de la page.',
    example: null,
    doc_url: null,
    measured_by: 'browser'
  })
]
const proReport = (overrides = {}) => ({
  score: 64,
  installable: false,
  limits: 'Analyse HTTP sans exécution de script.',
  installability_note: 'Critères vérifiés sans navigateur.',
  engine: 'pro-1',
  checks,
  summary: {
    by_severity: { critical: 0, high: 1, medium: 1, low: 0, info: 0 },
    by_category: {
      service_worker: { pass: 0, warn: 0, fail: 1, info: 0, not_measured: 0 },
      security_headers: {
        pass: 0,
        warn: 1,
        fail: 0,
        info: 0,
        not_measured: 0
      },
      access: { pass: 1, warn: 0, fail: 0, info: 0, not_measured: 0 },
      accessibility: { pass: 0, warn: 0, fail: 0, info: 0, not_measured: 1 }
    }
  },
  metrics: {
    response_ms: 412,
    html_bytes: 20480,
    scripts: 6,
    stylesheets: 2,
    render_blocking_scripts: 1,
    third_party_hosts: 3,
    compressed: true,
    page_cache_control: null
  },
  installability: {
    chrome: { status: 'no', missing: ['icons', 'future_code'] },
    edge: { status: 'no', missing: ['icons'] },
    samsung: { status: 'unknown', missing: [] },
    firefox_android: { status: 'yes', missing: [] },
    safari_ios: { status: 'no', missing: ['display', 'home_screen_icon'] }
  },
  permissions: {
    detected: ['geolocation'],
    declared: ['camera'],
    undeclared: ['geolocation'],
    unused_declared: ['camera']
  },
  ...overrides
})
const proAnalysis = (overrides = {}) => ({
  id: 9,
  url: 'https://app.example.com/',
  final_url: 'https://app.example.com/home',
  reachable: true,
  score: 64,
  installable: false,
  application_id: null,
  engine: 'pro-1',
  created_at: '2026-10-14T10:00:00Z',
  report: proReport(),
  ...overrides
})
const legacyAnalysis = {
  id: 3,
  url: 'https://old.example.com/',
  reachable: true,
  score: 60,
  engine: null,
  created_at: '2026-10-01T10:00:00Z',
  report: {
    score: 60,
    installable: true,
    installability: 'Critères réunis.',
    limits: 'Analyse statique.',
    checks: [
      {
        id: 'https',
        category: 'Accès',
        label: 'HTTPS',
        status: 'pass',
        detail: 'Servi en HTTPS.',
        recommendation: null
      }
    ]
  }
}
const historyRow = (overrides = {}) => ({
  id: 9,
  url: 'https://app.example.com/',
  reachable: true,
  score: 64,
  installable: false,
  created_at: '2026-10-14T10:00:00Z',
  application_id: null,
  engine: 'pro-1',
  ...overrides
})
const page = data => ({ data: { data, last_page: 1, total: data.length } })
const httpError = (status, extra = {}) =>
  Object.assign(new Error(`HTTP ${status}`), {
    response: { status, data: {}, headers: {}, ...extra }
  })

let wrapper
const globalOptions = {
  renderStubDefaultSlot: true,
  stubs: { EmptyState: false },
  config: { warnHandler() {} }
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.tools.value = { lab_pro: true }
  mocks.route.params = { id: '9' }
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.useRealTimers()
})

describe('lab service and helpers', () => {
  it('calls the documented endpoints', async () => {
    mocks.get.mockResolvedValue({ data: {} })
    mocks.post.mockResolvedValue({ data: {} })
    await labApi.analyze({ url: 'https://a.example/' })
    expect(mocks.post).toHaveBeenLastCalledWith('/lab/analyses', {
      url: 'https://a.example/'
    })
    await labApi.analyze({ url: 'https://a.example/', applicationId: 4 })
    expect(mocks.post).toHaveBeenLastCalledWith('/lab/analyses', {
      url: 'https://a.example/',
      application_id: 4
    })
    await labApi.list({ url: 'https://a.example/', applicationId: 4, page: 2 })
    expect(mocks.get).toHaveBeenLastCalledWith('/lab/analyses', {
      params: { url: 'https://a.example/', application_id: 4, page: 2 }
    })
    await labApi.show(9)
    expect(mocks.get).toHaveBeenLastCalledWith('/lab/analyses/9')
    await labApi.apps()
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/lab/apps')
    await labApi.compare(9)
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/lab/analyses/9/compare',
      { params: { with: 'previous' } }
    )
    await labApi.compare(9, 4)
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/lab/analyses/9/compare',
      { params: { with: 4 } }
    )
  })

  it('words severities, statuses, categories and metrics in French', () => {
    expect(SEVERITY_LABELS).toEqual({
      critical: 'Critique',
      high: 'Élevée',
      medium: 'Moyenne',
      low: 'Faible',
      info: 'Info'
    })
    expect(Object.values(STATUS_LABELS)).toEqual([
      'Réussi',
      'À améliorer',
      'Échec',
      'Info',
      'Non mesuré'
    ])
    expect(severityLabel('high')).toBe('Élevée')
    expect(statusLabel('not_measured')).toBe('Non mesuré')
    expect(categoryLabel('security_headers')).toBe('En-têtes de sécurité')
    expect(categoryLabel('unknown_key', 'Autre')).toBe('Autre')
    expect(formatMs(412.4)).toBe('412 ms')
    expect(formatBytes(20480)).toMatch(/^20 Ko$/)
    expect(formatBytes(1536)).toMatch(/^1,5 Ko$/)
    expect(formatBytes(null)).toBe('—')
  })

  it('tells pro reports from legacy ones', () => {
    expect(isProReport(proAnalysis())).toBe(true)
    expect(isProReport(legacyAnalysis)).toBe(false)
    expect(isProReport(historyRow())).toBe(true)
    expect(isProReport(historyRow({ engine: null }))).toBe(false)
    expect(isProReport(null)).toBe(false)
  })

  it('filters checks: passed hidden by default, browser-only checks apart', () => {
    const result = filterChecks(checks, DEFAULT_ISSUE_FILTERS)
    expect(result.issues.map(c => c.id)).toEqual(['sw', 'csp'])
    expect(result.notMeasured.map(c => c.id)).toEqual(['contrast'])
    const all = filterChecks(checks, {
      ...DEFAULT_ISSUE_FILTERS,
      status: 'all'
    })
    expect(all.issues.map(c => c.id)).toEqual(['sw', 'csp', 'https'])
    expect(
      filterChecks(checks, {
        ...DEFAULT_ISSUE_FILTERS,
        severity: 'medium'
      }).issues.map(c => c.id)
    ).toEqual(['csp'])
    expect(
      filterChecks(checks, {
        ...DEFAULT_ISSUE_FILTERS,
        category: 'service_worker'
      }).issues.map(c => c.id)
    ).toEqual(['sw'])
    // Accents and case are ignored by the search.
    expect(
      filterChecks(checks, {
        ...DEFAULT_ISSUE_FILTERS,
        q: 'EN-TÊTE ABSENT'
      }).issues.map(c => c.id)
    ).toEqual(['csp'])
  })

  it('only keeps documentation links to known sites over HTTPS', () => {
    for (const ok of [
      'https://developer.mozilla.org/fr/docs/Web/Manifest',
      'https://web.dev/articles/x',
      'https://developer.chrome.com/docs/x',
      'https://www.w3.org/TR/appmanifest/',
      'https://cheatsheetseries.owasp.org/x'
    ])
      expect(safeDocUrl(ok)).toBe(ok)
    for (const bad of [
      'http://web.dev/x',
      'javascript:alert(1)',
      'https://web.dev.evil.com/x',
      'https://evilweb.dev/x',
      'https://user:pass@web.dev/x',
      'not a url',
      null
    ])
      expect(safeDocUrl(bad)).toBe(null)
  })

  it('words metric deltas without relying on colour', () => {
    expect(metricDelta('response_ms', 800, 400)).toMatchObject({
      direction: 'down',
      tone: 'good',
      arrow: '↓',
      text: 'Amélioration',
      from: '800 ms',
      to: '400 ms'
    })
    expect(metricDelta('scripts', 3, 5)).toMatchObject({
      direction: 'up',
      tone: 'bad',
      arrow: '↑',
      text: 'Dégradation'
    })
    expect(metricDelta('compressed', false, true)).toMatchObject({
      tone: 'good',
      from: 'Non',
      to: 'Oui'
    })
    expect(metricDelta('scripts', 2, 2)).toMatchObject({
      tone: 'neutral',
      text: 'Inchangé'
    })
    expect(metricDelta('page_cache_control', null, 'no-cache')).toMatchObject({
      tone: 'neutral',
      text: 'Modifié',
      from: '—'
    })
  })

  it('explains rate limits and comparison errors', () => {
    expect(
      analysisErrorMessage(httpError(429, { headers: { 'retry-after': '42' } }))
    ).toBe('Trop d’analyses en peu de temps. Réessayez dans 42 s.')
    expect(analysisErrorMessage(httpError(429))).toContain('Cinq analyses')
    expect(
      analysisErrorMessage(
        httpError(422, { data: { message: 'Adresse refusée.' } })
      )
    ).toBe('Adresse refusée.')
    expect(compareErrorMessage(httpError(404))).toBe(
      'Aucune analyse précédente de cette adresse'
    )
    expect(compareErrorMessage(httpError(404), 3)).toBe('Analyse introuvable')
    // A suspended developer gets the server's own words.
    expect(
      analysisErrorMessage(
        httpError(403, { data: { message: 'Compte développeur suspendu.' } })
      )
    ).toBe('Compte développeur suspendu.')
    expect(compareErrorMessage(httpError(422))).toBe(
      'Comparaison disponible uniquement entre analyses Pro'
    )
  })

  it('keeps the print route behind the lab_pro tool', () => {
    const print = routes.find(r => r.path === '/developer/lab/:id(\\d+)/print')
    expect(print.meta).toEqual({
      requiresAuth: true,
      developerOnly: true,
      tool: 'lab_pro'
    })
    expect(resolveToolAccess(print, { tools: { lab_pro: false } })).toBe(
      '/developer/lab'
    )
    expect(resolveToolAccess(print, { tools: { lab_pro: true } })).toBe(true)
  })
})

describe('pro report', () => {
  const render = (analysis = proAnalysis(), props = {}) =>
    (wrapper = mount(LabProReport, {
      props: { analysis, ...props },
      global: globalOptions
    }))
  const issueIds = () =>
    wrapper
      .findAll('.issues-section .lab-issue')
      .map(n => n.attributes('data-check'))

  it('shows the summary counts, the no-global-score statement and the limits', () => {
    render()
    const text = wrapper.text()
    expect(text).toContain(
      'Aucun score de sécurité global : chaque point est à évaluer selon votre contexte.'
    )
    expect(text).toContain('Analyse HTTP sans exécution de script.')
    expect(text).toContain('Score technique (indicatif)')
    expect(wrapper.find('[data-severity="high"] .chip-count').text()).toBe('1')
    expect(wrapper.find('[data-severity="critical"] .chip-count').text()).toBe(
      '0'
    )
    const access = wrapper.find('[data-category="access"]')
    expect(access.text()).toContain('Accès')
    expect(access.text()).toContain('1 réussi')
    expect(wrapper.find('[data-category="accessibility"]').text()).toContain(
      '1 non mesuré'
    )
    expect(wrapper.find('[data-metric="response_ms"]').text()).toContain(
      '412 ms'
    )
    expect(wrapper.find('[data-metric="page_cache_control"] dd').text()).toBe(
      '—'
    )
    // Chips count every non-passed check of the severity, browser-only ones included,
    // so each number matches what the chip filters.
    expect(wrapper.find('[data-severity="low"] .chip-count').text()).toBe('1')
    expect(wrapper.text()).toContain('points non mesurés')
    // Informations are not "à traiter"; empty categories are hidden.
    expect(wrapper.find('[data-category="service_worker"]').text()).toContain(
      '1 à traiter'
    )
    expect(wrapper.find('[data-category="seo"]').exists()).toBe(false)
  })

  it('filters the issues from the severity chips and category cards', async () => {
    render()
    expect(issueIds()).toEqual(['sw', 'csp'])
    const chip = wrapper.find('button[data-severity="medium"]')
    await chip.trigger('click')
    expect(chip.attributes('aria-pressed')).toBe('true')
    expect(issueIds()).toEqual(['csp'])
    await chip.trigger('click')
    expect(issueIds()).toEqual(['sw', 'csp'])
    await wrapper
      .find('button[data-category="service_worker"]')
      .trigger('click')
    expect(issueIds()).toEqual(['sw'])
    await wrapper.find('button[data-category="access"]').trigger('click')
    // Access only has a passed check: hidden by default, so the empty filter state shows.
    expect(issueIds()).toEqual([])
    expect(wrapper.text()).toContain('Aucun point ne correspond à ces filtres.')
  })

  it('groups the browser-only checks apart and explains why', () => {
    render()
    const section = wrapper.find('.browser-section')
    expect(section.text()).toContain('Nécessite un navigateur')
    expect(section.text()).toContain('sans exécuter de script')
    expect(section.find('[data-check="contrast"]').exists()).toBe(true)
    expect(issueIds()).not.toContain('contrast')
  })

  it('shows the installability matrix in words', () => {
    render()
    const chrome = wrapper.find('[data-browser="chrome"]')
    expect(chrome.text()).toContain('Chrome')
    expect(chrome.text()).toContain('Non')
    // Known codes are worded; an unknown code stays visible.
    expect(chrome.text()).toContain(
      'Aucune icône d’au moins 144 px utilisable (PNG, SVG ou WebP, purpose « any »)'
    )
    expect(chrome.text()).toContain('Critère non reconnu : future_code')
    expect(wrapper.find('.install-note').text()).toBe(
      'Critères vérifiés sans navigateur.'
    )
    expect(wrapper.find('[data-browser="samsung"]').text()).toContain('Inconnu')
    const safari = wrapper.find('[data-browser="safari_ios"]').text()
    expect(safari).toContain('apple-mobile-web-app-capable attendu')
    expect(safari).toContain('Ni apple-touch-icon ni icône dans le manifeste')
    expect(wrapper.find('[data-browser="firefox_android"]').text()).toContain(
      'Oui'
    )
  })

  it('explains an unknown status on an unreachable page', () => {
    const unknown = { status: 'unknown', missing: [] }
    render(
      proAnalysis({
        reachable: false,
        report: proReport({
          installability: {
            chrome: unknown,
            edge: unknown,
            samsung: unknown,
            firefox_android: unknown,
            safari_ios: unknown
          }
        })
      })
    )
    for (const row of wrapper.findAll('[data-browser]'))
      expect(row.text()).toContain('Inconnu (page inaccessible)')
  })

  it('shows the permissions only when the app declares them', () => {
    render()
    expect(wrapper.find('[data-permissions="undeclared"]').text()).toContain(
      'geolocation'
    )
    expect(
      wrapper.find('[data-permissions="unused_declared"]').text()
    ).toContain('Déclarées non détectées')
    wrapper.unmount()
    render(
      proAnalysis({
        report: proReport({
          permissions: {
            detected: ['geolocation'],
            declared: null,
            undeclared: [],
            unused_declared: []
          }
        })
      })
    )
    expect(wrapper.find('.permissions-panel').exists()).toBe(false)
  })
})

describe('issue item', () => {
  const render = (props = {}) =>
    (wrapper = mount(LabIssueItem, {
      props: { check: check(), ...props },
      global: globalOptions
    }))

  it('expands with the finding, impact, fix, example and a safe doc link', async () => {
    render()
    const toggle = wrapper.find('.issue-toggle')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    const text = wrapper.text()
    for (const label of ['Constat', 'Impact', 'Comment corriger ?', 'Exemple'])
      expect(text).toContain(label)
    expect(wrapper.find('pre code').text()).toBe(
      "navigator.serviceWorker.register('/sw.js')"
    )
    const link = wrapper.find('a.issue-doc')
    expect(link.attributes('href')).toBe(
      'https://web.dev/articles/service-worker-lifecycle'
    )
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    expect(wrapper.find('.copy-example').exists()).toBe(true)
  })

  it('renders an example as text, even with HTML inside', () => {
    render({
      check: check({ example: '<script>alert(1)</script><b>x</b>' }),
      forceOpen: true
    })
    const code = wrapper.find('pre code')
    expect(code.element.children.length).toBe(0)
    expect(code.text()).toBe('<script>alert(1)</script><b>x</b>')
    expect(wrapper.find('script').exists()).toBe(false)
  })

  it('drops documentation links outside the allowlist', () => {
    render({
      check: check({ doc_url: 'https://evil.example.com/' }),
      forceOpen: true
    })
    expect(wrapper.find('a.issue-doc').exists()).toBe(false)
  })

  it('asks to check browser-measured items and voices the severity', () => {
    render({ check: check({ measured_by: 'browser' }), forceOpen: true })
    expect(wrapper.find('.issue-note').text()).toBe(
      'À vérifier dans un navigateur.'
    )
    expect(wrapper.find('.issue-toggle .sr-only').text()).toBe('Sévérité :')
    expect(wrapper.find('.issue-severity').attributes('aria-label')).toBe(
      undefined
    )
  })

  it('keeps the assistant button off unless the hook is enabled', async () => {
    render({ forceOpen: true })
    expect(wrapper.find('.issue-assistant').exists()).toBe(false)
    await wrapper.setProps({ assistant: true })
    expect(wrapper.find('.issue-assistant').exists()).toBe(true)
  })
})

describe('compare view', () => {
  const render = props =>
    (wrapper = mount(LabCompare, {
      props,
      attachTo: document.body,
      global: globalOptions
    }))

  it('lists fixed, new, persisting and changed checks with metric deltas', async () => {
    render({
      data: {
        base: { id: 3, created_at: '2026-10-01T10:00:00Z', score: 50 },
        target: { id: 9, created_at: '2026-10-14T10:00:00Z', score: 64 },
        fixed: [check({ id: 'https', label: 'HTTPS' })],
        new: [check({ id: 'csp', label: 'Content-Security-Policy' })],
        persisting: [],
        changed: [{ id: 'icons', label: 'Icônes', from: 'fail', to: 'warn' }],
        removed: [check({ id: 'old', label: 'Ancien contrôle' })],
        metrics: {
          response_ms: { from: 900, to: 400 },
          scripts: { from: 4, to: 7 }
        }
      }
    })
    expect(wrapper.find('[data-group="fixed"]').text()).toContain('Corrigés')
    expect(wrapper.find('[data-group="fixed"]').text()).toContain('HTTPS')
    expect(wrapper.find('[data-group="new"]').text()).toContain(
      'Content-Security-Policy'
    )
    expect(wrapper.find('[data-group="persisting"]').text()).toContain('Aucun')
    expect(wrapper.find('[data-group="changed"]').text()).toContain(
      'Échec → À améliorer'
    )
    const removed = wrapper.find('[data-group="removed"]')
    expect(removed.text()).toContain('Disparus (non revérifiés)')
    expect(removed.text()).toContain('Ancien contrôle')
    expect(removed.text()).toContain('pas une correction confirmée')
    await flushPromises()
    expect(document.activeElement?.id).toBe('lab-compare-title')
    const response = wrapper.find('[data-metric="response_ms"]')
    expect(response.classes()).toContain('tone-good')
    expect(response.text()).toContain('↓')
    expect(response.text()).toContain('Amélioration')
    const scripts = wrapper.find('[data-metric="scripts"]')
    expect(scripts.classes()).toContain('tone-bad')
    expect(scripts.text()).toContain('Dégradation')
  })

  it('shows the 404 and 422 messages', () => {
    render({
      error: compareErrorMessage(httpError(404)),
      errorStatus: 404
    })
    expect(wrapper.text()).toContain(
      'Aucune analyse précédente de cette adresse'
    )
    wrapper.unmount()
    render({
      error: compareErrorMessage(httpError(422)),
      errorStatus: 422
    })
    expect(wrapper.text()).toContain(
      'Comparaison disponible uniquement entre analyses Pro'
    )
  })
})

describe('Lab page with lab_pro on', () => {
  function mockApi({
    rows = [historyRow(), historyRow({ id: 3, engine: null })],
    analyses = { 9: proAnalysis(), 3: legacyAnalysis },
    compare
  } = {}) {
    mocks.get.mockImplementation((url, options) => {
      if (url === '/developer/lab/apps')
        return Promise.resolve({
          data: {
            data: [{ id: 4, name: 'Alpha', url: 'https://alpha.example/' }]
          }
        })
      if (url === '/lab/analyses') return Promise.resolve(page(rows))
      const show = url.match(/^\/lab\/analyses\/(\d+)$/)
      if (show) return Promise.resolve({ data: analyses[show[1]] })
      if (url.endsWith('/compare')) return compare(url, options)
      return Promise.reject(new Error(`unexpected ${url}`))
    })
  }
  const render = async options => {
    mockApi(options)
    wrapper = mount(LabProWorkspace, {
      global: {
        ...globalOptions,
        stubs: { ...globalOptions.stubs, DeveloperToolsNav: true }
      }
    })
    await flushPromises()
  }
  const history = () => wrapper.findComponent({ name: 'LabHistory' })

  it('PwaLabPage opens Lab Pro without the legacy history request', async () => {
    mockApi()
    wrapper = shallowMount(PwaLabPage, { global: globalOptions })
    await flushPromises()
    expect(wrapper.find('lab-pro-workspace-stub').exists()).toBe(true)
    expect(wrapper.find('q-page').exists()).toBe(false)
  })

  it('fills the address from the app selector and sends application_id', async () => {
    await render()
    mocks.post.mockResolvedValue({ data: proAnalysis({ application_id: 4 }) })
    // Quasar components are not registered in unit tests: drive the selector's handler.
    const state = wrapper.vm.$.setupState
    state.applicationId = 4
    state.pickApp(4)
    await flushPromises()
    expect(state.url).toBe('https://alpha.example/')
    await wrapper.vm.$.setupState.run()
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledWith('/lab/analyses', {
      url: 'https://alpha.example/',
      application_id: 4
    })
    expect(wrapper.findComponent(LabProReport).exists()).toBe(true)
  })

  it('shows progress text while analysing and the server 422 message', async () => {
    await render()
    let reject
    mocks.post.mockReturnValue(new Promise((_, r) => (reject = r)))
    wrapper.vm.$.setupState.url = 'https://x.example/'
    const running = wrapper.vm.$.setupState.run()
    await flushPromises()
    expect(wrapper.find('.lab-progress').text()).toContain(
      'Connexion à l’adresse…'
    )
    expect(wrapper.find('.lab-progress').text()).toContain('25 secondes')
    reject(httpError(422, { data: { message: 'Adresse injoignable.' } }))
    await running
    await flushPromises()
    expect(wrapper.find('.lab-error').text()).toBe('Adresse injoignable.')
    expect(ANALYSIS_STEPS.length).toBeGreaterThan(1)
  })

  it('counts down a 429 Retry-After', async () => {
    await render()
    vi.useFakeTimers()
    mocks.post.mockRejectedValue(
      httpError(429, { headers: { 'retry-after': '3' } })
    )
    wrapper.vm.$.setupState.url = 'https://x.example/'
    await wrapper.vm.$.setupState.run()
    await flushPromises()
    expect(wrapper.find('.lab-error').text()).toContain('Réessayez dans 3 s.')
    vi.advanceTimersByTime(1000)
    await flushPromises()
    expect(wrapper.find('.lab-error').text()).toContain('Réessayez dans 2 s.')
    vi.advanceTimersByTime(2000)
    await flushPromises()
    expect(wrapper.find('.lab-error').exists()).toBe(false)
  })

  it('renders a legacy analysis of the history with the legacy view', async () => {
    await render()
    await wrapper.find('[data-id="3"] .history-open').trigger('click')
    await flushPromises()
    expect(wrapper.find('.lab-legacy-report').exists()).toBe(true)
    expect(wrapper.find('.lab-pro-report').exists()).toBe(false)
    expect(wrapper.text()).toContain('Critères réunis.')
    await wrapper.find('[data-id="9"] .history-open').trigger('click')
    await flushPromises()
    expect(wrapper.find('.lab-pro-report').exists()).toBe(true)
    expect(wrapper.find('.export-pdf').attributes('href')).toBe(
      '/developer/lab/9/print'
    )
    expect(wrapper.text()).toContain('Enregistrer en PDF')
  })

  it('ignores a late answer of an earlier analysis opening', async () => {
    await render()
    let resolveFirst
    mocks.get.mockImplementation(url => {
      if (url === '/lab/analyses/9') return new Promise(r => (resolveFirst = r))
      if (url === '/lab/analyses/3')
        return Promise.resolve({ data: legacyAnalysis })
      return Promise.resolve(page([]))
    })
    const state = wrapper.vm.$.setupState
    const first = state.open(9)
    await state.open(3)
    resolveFirst({ data: proAnalysis() })
    await first
    await flushPromises()
    expect(state.current.id).toBe(3)
  })

  it('compares with the previous analysis, with 404 and 422 answers', async () => {
    const answers = [
      Promise.resolve({
        data: {
          data: {
            base: { id: 3, created_at: '2026-10-01T10:00:00Z', score: 50 },
            target: { id: 9, created_at: '2026-10-14T10:00:00Z', score: 64 },
            fixed: [],
            new: [],
            persisting: [],
            changed: [],
            metrics: {}
          }
        }
      }),
      Promise.reject(httpError(404)),
      Promise.reject(httpError(422))
    ]
    answers.slice(1).forEach(p => p.catch(() => {}))
    let n = 0
    await render({ compare: () => answers[n++] })
    await wrapper.find('[data-id="9"] .compare-previous').trigger('click')
    await flushPromises()
    expect(mocks.get).toHaveBeenCalledWith(
      '/developer/lab/analyses/9/compare',
      { params: { with: 'previous' } }
    )
    expect(wrapper.find('.lab-compare').text()).toContain('Corrigés')
    await wrapper.find('[data-id="9"] .compare-previous').trigger('click')
    await flushPromises()
    expect(wrapper.find('.lab-compare').text()).toContain(
      'Aucune analyse précédente de cette adresse'
    )
    await wrapper.find('[data-id="9"] .compare-previous').trigger('click')
    await flushPromises()
    expect(wrapper.find('.lab-compare').text()).toContain(
      'Comparaison disponible uniquement entre analyses Pro'
    )
  })

  it('compares two selected analyses, newest as target', async () => {
    await render({
      rows: [
        historyRow(),
        historyRow({ id: 5 }),
        historyRow({ id: 3, engine: null })
      ],
      compare: () => Promise.reject(httpError(422))
    })
    const historyState = history().vm.$.setupState
    // Legacy rows cannot be selected, and say why.
    const legacy = wrapper.find('[data-id="3"]')
    expect(legacy.find('q-checkbox').attributes('disable')).toBe('true')
    expect(legacy.text()).toContain('Non comparable (analyse classique)')
    historyState.toggle(historyRow({ id: 3, engine: null }))
    historyState.toggle(historyRow({ id: 5 }))
    historyState.toggle(historyRow())
    await flushPromises()
    expect(historyState.selection).toEqual([5, 9])
    await wrapper.find('.compare-selected').trigger('click')
    await flushPromises()
    expect(mocks.get).toHaveBeenCalledWith(
      '/developer/lab/analyses/9/compare',
      { params: { with: 5 } }
    )
  })

  it('filters the history on the exact address, on Enter only', async () => {
    await render()
    const listCalls = () =>
      mocks.get.mock.calls.filter(([url]) => url === '/lab/analyses')
    expect(listCalls()).toHaveLength(1)
    const state = history().vm.$.setupState
    state.urlInput = 'https://app.example.com/'
    await flushPromises()
    expect(listCalls()).toHaveLength(1)
    state.applyUrl()
    await flushPromises()
    expect(listCalls().at(-1)).toEqual([
      '/lab/analyses',
      { params: { url: 'https://app.example.com/', page: 1 } }
    ])
    expect(history().text()).toContain('64/100 (indicatif)')
  })

  it('keeps an analysis running while a history item is opened', async () => {
    await render()
    let resolveRun
    mocks.post.mockReturnValue(new Promise(r => (resolveRun = r)))
    const state = wrapper.vm.$.setupState
    state.url = 'https://new.example/'
    const running = state.run()
    await flushPromises()
    await state.open(3)
    await flushPromises()
    // Both the progress (with a note) and the opened report are visible.
    expect(wrapper.find('.lab-progress').text()).toContain('L’analyse continue')
    expect(wrapper.find('.lab-legacy-report').exists()).toBe(true)
    resolveRun({ data: proAnalysis({ id: 12, url: 'https://new.example/' }) })
    await running
    await flushPromises()
    expect(state.busy).toBe(false)
    expect(state.current.id).toBe(3)
    expect(wrapper.find('.lab-finished').text()).toContain(
      'L’analyse de https://new.example/ est terminée.'
    )
    await wrapper.find('.show-finished').trigger('click')
    expect(state.current.id).toBe(12)
    expect(wrapper.find('.lab-finished').exists()).toBe(false)
  })

  it('hides the previous report when an opening fails', async () => {
    await render()
    const state = wrapper.vm.$.setupState
    await state.open(9)
    await flushPromises()
    expect(wrapper.find('.lab-pro-report').exists()).toBe(true)
    mocks.get.mockRejectedValueOnce(
      httpError(500, { data: { message: 'Boom' } })
    )
    await state.open(3)
    await flushPromises()
    expect(wrapper.text()).toContain('Cette analyse n’a pas pu être chargée.')
    expect(wrapper.find('.lab-pro-report').exists()).toBe(false)
  })

  it('shows the empty history', async () => {
    await render({ rows: [] })
    expect(history().text()).toContain('Aucune analyse.')
  })
})

describe('print view', () => {
  it('renders every issue expanded and opens the print dialog', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    mocks.get.mockResolvedValue({ data: proAnalysis() })
    wrapper = mount(LabPrintPage, { global: globalOptions })
    await flushPromises()
    expect(mocks.get).toHaveBeenCalledWith('/lab/analyses/9')
    expect(wrapper.text()).toContain('https://app.example.com/')
    expect(wrapper.text()).toContain('Analyse du')
    const issues = wrapper.findAll('.lab-issue')
    expect(issues.map(n => n.attributes('data-check'))).toEqual([
      'sw',
      'csp',
      'contrast'
    ])
    for (const issue of issues)
      expect(issue.find('.issue-toggle').attributes('aria-expanded')).toBe(
        'true'
      )
    expect(wrapper.find('.issue-filters').exists()).toBe(false)
    expect(wrapper.find('.passed-section').text()).toContain('HTTPS')
    // On paper: no copy button, the documentation address is printed.
    expect(wrapper.find('.copy-example').exists()).toBe(false)
    expect(wrapper.find('.doc-url').text()).toBe(
      'https://web.dev/articles/service-worker-lifecycle'
    )
    expect(document.title).toBe('Labo PWA — app.example.com — 2026-10-14')
    expect(print).toHaveBeenCalledTimes(1)
  })

  it('does not print when the analysis cannot be loaded', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    mocks.get.mockRejectedValue(
      httpError(404, { data: { message: 'Introuvable.' } })
    )
    wrapper = mount(LabPrintPage, { global: globalOptions })
    await flushPromises()
    expect(wrapper.text()).toContain('Introuvable.')
    expect(print).not.toHaveBeenCalled()
  })
})

describe('lab translations', () => {
  const english = JSON.parse(readFileSync('src/i18n/ui.en.json', 'utf8'))
  const files = [
    'src/utils/lab.js',
    'src/components/lab/LabProWorkspace.vue',
    'src/components/lab/LabProReport.vue',
    'src/components/lab/LabIssueItem.vue',
    'src/components/lab/LabHistory.vue',
    'src/components/lab/LabCompare.vue',
    'src/components/lab/LabLegacyReport.vue',
    'src/pages/developer/LabPrintPage.vue'
  ]
  const literals = files.flatMap(file =>
    [
      ...readFileSync(file, 'utf8').matchAll(/\bui\(\s*'((?:[^'\\]|\\.)*)'/gs)
    ].map(m => m[1].replace(/\s+/g, ' ').trim())
  )

  it('translates every ui() string and label of Lab Pro', () => {
    const labels = [
      ...Object.values(SEVERITY_LABELS),
      ...Object.values(STATUS_LABELS),
      ...Object.values(CATEGORY_LABELS),
      ...Object.values(INSTALL_LABELS),
      ...Object.values(MISSING_LABELS),
      ...METRICS.map(m => m.label),
      ...ANALYSIS_STEPS.map(s => s.text)
    ]
    const missing = [...new Set([...literals, ...labels])].filter(
      text => !english[text]
    )
    expect(missing).toEqual([])
  })
})
