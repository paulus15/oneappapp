import { currentLocale, i18n } from '@/i18n'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'

// PWA Lab Pro: wording, filters and formatting of the "pro-1" reports. Analyses made
// before Lab Pro keep their historical report and view.
export const PRO_ENGINE = 'pro-1'
export const LAB_PAGE_SIZE = 20
export const SEARCH_DEBOUNCE_MS = 400

// A full analysis carries report.engine; history rows only carry engine.
export const isProReport = analysis =>
  analysis?.report?.engine === PRO_ENGINE ||
  (!analysis?.report && analysis?.engine === PRO_ENGINE)

export const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info']
export const STATUSES = ['fail', 'warn', 'info', 'pass', 'not_measured']
export const CATEGORY_KEYS = [
  'access',
  'manifest',
  'icons',
  'service_worker',
  'installability',
  'offline',
  'performance',
  'accessibility',
  'seo',
  'security_headers',
  'external_resources',
  'permissions',
  'best_practices'
]
export const BROWSERS = [
  'chrome',
  'edge',
  'samsung',
  'firefox_android',
  'safari_ios'
]

export const SEVERITY_LABELS = {
  critical: 'Critique',
  high: 'Élevée',
  medium: 'Moyenne',
  low: 'Faible',
  info: 'Info'
}
export const STATUS_LABELS = {
  pass: 'Réussi',
  warn: 'À améliorer',
  fail: 'Échec',
  info: 'Info',
  not_measured: 'Non mesuré'
}
export const CATEGORY_LABELS = {
  access: 'Accès',
  manifest: 'Manifeste',
  icons: 'Icônes',
  service_worker: 'Service worker',
  installability: 'Installation',
  offline: 'Hors ligne',
  performance: 'Performance',
  accessibility: 'Accessibilité',
  seo: 'Référencement',
  security_headers: 'En-têtes de sécurité',
  external_resources: 'Ressources externes',
  permissions: 'Autorisations',
  best_practices: 'Bonnes pratiques'
}
export const BROWSER_LABELS = {
  chrome: 'Chrome',
  edge: 'Edge',
  samsung: 'Samsung Internet',
  firefox_android: 'Firefox Android',
  safari_ios: 'Safari iOS'
}
export const INSTALL_LABELS = { yes: 'Oui', no: 'Non', unknown: 'Inconnu' }
// installability.<browser>.missing holds stable codes from the API. Known codes get a
// French label; an unknown code is still shown as is, never hidden.
export const MISSING_LABELS = {
  manifest: 'Aucun manifeste lisible (absent, inaccessible ou JSON invalide)',
  name: 'Ni name ni short_name dans le manifeste',
  start_url: 'start_url absente',
  display:
    'Mode d’affichage non applicatif (standalone, fullscreen ou minimal-ui attendu)',
  icons:
    'Aucune icône d’au moins 144 px utilisable (PNG, SVG ou WebP, purpose « any »)',
  prefer_related_applications:
    'Le manifeste demande de préférer une application native',
  service_worker: 'Aucun enregistrement de service worker visible dans la page',
  home_screen_icon: 'Ni apple-touch-icon ni icône dans le manifeste'
}
// Safari iOS has its own display rule.
const MISSING_BROWSER_LABELS = {
  safari_ios: {
    display:
      'Mode d’affichage non applicatif (standalone, fullscreen ou apple-mobile-web-app-capable attendu)'
  }
}
export const missingLabel = (code, browser) => {
  const label = MISSING_BROWSER_LABELS[browser]?.[code] || MISSING_LABELS[code]
  return label
    ? ui(label)
    : ui('Critère non reconnu : {code}', { code: String(code) })
}
// An unreachable page answers "unknown" for every browser: say why.
export const installLabel = (value, { unreachable = false } = {}) =>
  unreachable && (value || 'unknown') === 'unknown'
    ? ui('Inconnu (page inaccessible)')
    : ui(INSTALL_LABELS[value] || 'Inconnu')

const SEVERITY_COLORS = {
  critical: 'negative',
  high: 'deep-orange-8',
  medium: 'orange-8',
  low: 'primary',
  info: 'grey-7'
}
const STATUS_ICONS = {
  pass: { icon: 'check_circle', color: 'positive' },
  warn: { icon: 'error_outline', color: 'warning' },
  fail: { icon: 'cancel', color: 'negative' },
  info: { icon: 'info', color: 'grey-7' },
  not_measured: { icon: 'help_outline', color: 'grey-7' }
}
const INSTALL_ICONS = {
  yes: { icon: 'check_circle', color: 'positive' },
  no: { icon: 'cancel', color: 'negative' },
  unknown: { icon: 'help_outline', color: 'grey-7' }
}

export const severityLabel = value =>
  SEVERITY_LABELS[value] ? ui(SEVERITY_LABELS[value]) : value || '—'
export const statusLabel = value =>
  STATUS_LABELS[value] ? ui(STATUS_LABELS[value]) : value || '—'
// The API sends a French label next to the key: the key wins when it is known.
export const categoryLabel = (key, fallback = '') =>
  CATEGORY_LABELS[key] ? ui(CATEGORY_LABELS[key]) : fallback || key || '—'
export const browserLabel = value => BROWSER_LABELS[value] || value
export const severityColor = value => SEVERITY_COLORS[value] || 'grey-7'
export const statusIcon = value => STATUS_ICONS[value] || STATUS_ICONS.info
export const installIcon = value =>
  INSTALL_ICONS[value] || INSTALL_ICONS.unknown

/* Filters ----------------------------------------------------------------- */

// status "issues" = everything but the passed checks (default view).
export const DEFAULT_ISSUE_FILTERS = Object.freeze({
  severity: '',
  category: '',
  status: 'issues',
  q: ''
})

const fold = text =>
  String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const severityRank = value => {
  const rank = SEVERITIES.indexOf(value)
  return rank === -1 ? SEVERITIES.length : rank
}
const statusRank = value => {
  const rank = STATUSES.indexOf(value)
  return rank === -1 ? STATUSES.length : rank
}
// Most severe first, then failures before warnings; the API order breaks ties.
export const sortChecks = checks =>
  checks
    .map((check, index) => ({ check, index }))
    .sort(
      (a, b) =>
        severityRank(a.check.severity) - severityRank(b.check.severity) ||
        statusRank(a.check.status) - statusRank(b.check.status) ||
        a.index - b.index
    )
    .map(({ check }) => check)

const matches = (check, { severity, category, q }) => {
  if (severity && check.severity !== severity) return false
  if (category && check.category_key !== category) return false
  const query = fold(q).trim()
  if (!query) return true
  return [check.label, check.detail, check.recommendation, check.impact]
    .map(fold)
    .some(text => text.includes(query))
}

// Measured checks shown in the issue list, and the checks that need a real browser.
export function filterChecks(checks = [], filters = DEFAULT_ISSUE_FILTERS) {
  const all = Array.isArray(checks) ? checks : []
  const measured = all.filter(check => check.status !== 'not_measured')
  const issues = measured.filter(check => {
    if (!matches(check, filters)) return false
    if (filters.status === 'all') return true
    if (!filters.status || filters.status === 'issues')
      return check.status !== 'pass'
    return check.status === filters.status
  })
  const notMeasured = all.filter(
    check => check.status === 'not_measured' && matches(check, filters)
  )
  return { issues: sortChecks(issues), notMeasured: sortChecks(notMeasured) }
}

export const hasActiveIssueFilters = filters =>
  Object.keys(DEFAULT_ISSUE_FILTERS).some(
    key => (filters[key] || '') !== DEFAULT_ISSUE_FILTERS[key]
  )

export const statusFilterOptions = () => [
  { value: 'issues', label: ui('Tous sauf réussis') },
  { value: 'all', label: ui('Tous les statuts') },
  ...['fail', 'warn', 'info', 'pass'].map(value => ({
    value,
    label: statusLabel(value)
  }))
]
export const severityFilterOptions = () => [
  { value: '', label: ui('Toutes les sévérités') },
  ...SEVERITIES.map(value => ({ value, label: severityLabel(value) }))
]
export const categoryFilterOptions = (checks = []) => {
  const present = new Set(checks.map(check => check.category_key))
  return [
    { value: '', label: ui('Toutes les catégories') },
    ...CATEGORY_KEYS.filter(key => present.has(key)).map(value => ({
      value,
      label: categoryLabel(value)
    }))
  ]
}

/* Documentation links ------------------------------------------------------ */

export const DOC_HOSTS = [
  'developer.mozilla.org',
  'web.dev',
  'developer.chrome.com',
  'w3.org',
  'owasp.org'
]
// Only HTTPS links to known documentation sites (or their sub-domains) are shown.
export function safeDocUrl(value) {
  if (typeof value !== 'string' || !value) return null
  let parsed
  try {
    parsed = new URL(value)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
    return null
  const host = parsed.hostname.toLowerCase()
  return DOC_HOSTS.some(
    allowed => host === allowed || host.endsWith(`.${allowed}`)
  )
    ? parsed.href
    : null
}

/* Metrics ------------------------------------------------------------------ */

const number = value => Number(value).toLocaleString(currentLocale())
export function formatBytes(value) {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  const kb = Number(value) / 1024
  return `${kb.toLocaleString(currentLocale(), {
    maximumFractionDigits: kb < 10 ? 1 : 0
  })} ${ui('Ko')}`
}
export const formatMs = value =>
  value == null || !Number.isFinite(Number(value))
    ? '—'
    : `${Math.round(Number(value)).toLocaleString(currentLocale())} ms`
const formatCount = value =>
  value == null || !Number.isFinite(Number(value)) ? '—' : number(value)
const formatYesNo = value =>
  value === true ? ui('Oui') : value === false ? ui('Non') : '—'
const formatText = value =>
  value == null || value === '' ? '—' : String(value)

// better: which way is an improvement (null: no judgement).
export const METRICS = [
  {
    key: 'response_ms',
    label: 'Temps de réponse',
    format: formatMs,
    better: 'lower'
  },
  {
    key: 'html_bytes',
    label: 'Poids du HTML',
    format: formatBytes,
    better: 'lower'
  },
  { key: 'scripts', label: 'Scripts', format: formatCount, better: 'lower' },
  {
    key: 'stylesheets',
    label: 'Feuilles de style',
    format: formatCount,
    better: 'lower'
  },
  {
    key: 'render_blocking_scripts',
    label: 'Scripts bloquant l’affichage',
    format: formatCount,
    better: 'lower'
  },
  {
    key: 'third_party_hosts',
    label: 'Domaines tiers',
    format: formatCount,
    better: 'lower'
  },
  {
    key: 'compressed',
    label: 'Compression',
    format: formatYesNo,
    better: 'higher'
  },
  {
    key: 'page_cache_control',
    label: 'Cache-Control de la page',
    format: formatText,
    better: null
  }
]
const METRIC_BY_KEY = Object.fromEntries(METRICS.map(m => [m.key, m]))

export const metricLabel = key =>
  METRIC_BY_KEY[key] ? ui(METRIC_BY_KEY[key].label) : key
export const formatMetric = (key, value) =>
  METRIC_BY_KEY[key] ? METRIC_BY_KEY[key].format(value) : formatText(value)

export const metricRows = (metrics = {}) =>
  METRICS.filter(metric => Object.hasOwn(metrics || {}, metric.key)).map(
    metric => ({
      key: metric.key,
      label: ui(metric.label),
      value: metric.format(metrics[metric.key])
    })
  )

const comparable = value =>
  typeof value === 'boolean' ? Number(value) : Number(value)

// One metric of a comparison: arrow, wording and whether the change is good, so the
// meaning never relies on the colour alone.
export function metricDelta(key, from, to) {
  const metric = METRIC_BY_KEY[key]
  const base = {
    key,
    label: metricLabel(key),
    from: formatMetric(key, from),
    to: formatMetric(key, to)
  }
  const numeric =
    from != null &&
    to != null &&
    typeof from !== 'string' &&
    typeof to !== 'string' &&
    Number.isFinite(comparable(from)) &&
    Number.isFinite(comparable(to))
  if (!numeric) {
    const same = String(from ?? '') === String(to ?? '')
    return {
      ...base,
      direction: same ? 'same' : 'changed',
      tone: 'neutral',
      arrow: same ? '=' : '→',
      text: same ? ui('Inchangé') : ui('Modifié')
    }
  }
  const diff = comparable(to) - comparable(from)
  if (diff === 0)
    return {
      ...base,
      direction: 'same',
      tone: 'neutral',
      arrow: '=',
      text: ui('Inchangé')
    }
  const direction = diff > 0 ? 'up' : 'down'
  const better = metric?.better
  const tone = !better
    ? 'neutral'
    : (better === 'lower') === (direction === 'down')
      ? 'good'
      : 'bad'
  return {
    ...base,
    direction,
    tone,
    arrow: direction === 'up' ? '↑' : '↓',
    text:
      tone === 'good'
        ? ui('Amélioration')
        : tone === 'bad'
          ? ui('Dégradation')
          : direction === 'up'
            ? ui('En hausse')
            : ui('En baisse')
  }
}

export const metricDeltas = (metrics = {}) =>
  Object.entries(metrics || {})
    .sort(
      ([a], [b]) =>
        (METRICS.findIndex(m => m.key === a) + 1 || 99) -
        (METRICS.findIndex(m => m.key === b) + 1 || 99)
    )
    .map(([key, value]) => metricDelta(key, value?.from, value?.to))

/* Requests ----------------------------------------------------------------- */

// Retry-After (seconds) of a 429, when the server sends it.
export function retryAfterSeconds(error) {
  const seconds = Number(error?.response?.headers?.['retry-after'])
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null
}

export function analysisErrorMessage(error) {
  if (error?.response?.status === 429) {
    const seconds = retryAfterSeconds(error)
    return seconds
      ? ui('Trop d’analyses en peu de temps. Réessayez dans {n} s.', {
          n: seconds
        })
      : ui('Cinq analyses par minute au maximum. Patientez un instant.')
  }
  return apiMessage(error)
}

// 404: no previous analysis (with=previous) or the chosen analysis does not exist.
export function compareErrorMessage(error, withValue = 'previous') {
  const status = error?.response?.status
  if (status === 404)
    return withValue === 'previous'
      ? ui('Aucune analyse précédente de cette adresse')
      : ui('Analyse introuvable')
  if (status === 422)
    return ui('Comparaison disponible uniquement entre analyses Pro')
  return apiMessage(error)
}

// Progress wording while the server analyses (up to ~25 s).
export const ANALYSIS_STEPS = [
  { after: 0, text: 'Connexion à l’adresse…' },
  { after: 4, text: 'Lecture de la page et du manifeste…' },
  { after: 9, text: 'Vérification des icônes et du service worker…' },
  { after: 14, text: 'Contrôle des en-têtes et des ressources externes…' },
  { after: 20, text: 'Préparation du rapport…' }
]
export const analysisStep = seconds =>
  ui(
    [...ANALYSIS_STEPS].reverse().find(step => seconds >= step.after)?.text ||
      ANALYSIS_STEPS[0].text
  )

export const labDate = value =>
  value ? new Date(value).toLocaleString(currentLocale()) : '—'

// Keyed plural messages ("1 point à traiter" / "3 points à traiter").
export const labPlural = (key, n) =>
  i18n.global.t(
    `lab.${key}`,
    { n: (Number(n) || 0).toLocaleString(currentLocale()) },
    Number(n) || 0
  )
