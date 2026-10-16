import { currentLocale, i18n } from '@/i18n'
import { ui } from '@/i18n/text'

/* Listing source (where a visitor came from) ------------------------------ */

// Every value the API accepts on POST /apps/{id}/view and /activate.
export const LISTING_SOURCES = Object.freeze([
  'home',
  'search',
  'category',
  'collection',
  'developer_page',
  'similar',
  'direct',
  'external',
  'campaign',
  'other'
])
// What a store link may claim. "direct" and "external" are deduced on arrival; "campaign"
// is decided by the API from a valid share-link token.
const LINK_SOURCES = new Set([
  'home',
  'search',
  'category',
  'collection',
  'developer_page',
  'similar',
  'other'
])
// Key of the source in the history entry (router state), so addresses stay clean.
export const SOURCE_STATE_KEY = 'listingSource'
// Fallback query parameter (?src=home), removed from the address bar on arrival.
export const SOURCE_QUERY_KEY = 'src'

export const isLinkSource = value => LINK_SOURCES.has(value)

/** Router location of an app listing that remembers which store section led to it. */
export function listingLink(to, source) {
  if (!isLinkSource(source) || typeof to !== 'string' || /[?#]/.test(to))
    return to
  return { path: to, state: { [SOURCE_STATE_KEY]: source } }
}

/** Hostname of a referrer from another site, '' for the store itself or anything odd. */
export function externalHost(referrer, origin) {
  try {
    const url = new URL(String(referrer || ''))
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return ''
    return url.origin === origin ? '' : url.hostname.toLowerCase()
  } catch {
    return ''
  }
}

/**
 * Source of a listing view, in order: the store section that linked here (history
 * state, then ?src=), any other in-store page (moved inside the store, or a store page
 * opened in a new tab), another website or app (hostname only) and, with no referrer
 * at all, a direct access (typed address, bookmark…). `state` is history.state:
 * vue-router sets `back` once the visitor moved inside the store. A PWA Growth token is
 * sent alongside, never as the source: the API gives the token precedence.
 */
export function resolveListingSource({
  state = null,
  query = null,
  referrer = '',
  origin = ''
} = {}) {
  const tagged = state?.[SOURCE_STATE_KEY]
  if (isLinkSource(tagged)) return { source: tagged }
  if (isLinkSource(query)) return { source: query }
  if (state?.back) return { source: 'other' }
  const value = String(referrer || '').trim()
  if (!value) return { source: 'direct' }
  let url = null
  try {
    url = new URL(value)
  } catch {
    return { source: 'other' }
  }
  if (url.origin === origin) return { source: 'other' }
  const host = externalHost(value, origin)
  return host
    ? { source: 'external', referrer_host: host }
    : { source: 'external' }
}

/* Arrival kept per app for the tab's lifetime, like campaign tokens: coming back from
 * the sign-in page (or any in-store detour) keeps the source of the first arrival. */
const sourceKey = appId => `pwa-source-${appId}`

export function rememberListingSource(appId, context) {
  if (!appId || !LISTING_SOURCES.includes(context?.source)) return
  try {
    sessionStorage.setItem(
      sourceKey(appId),
      JSON.stringify({
        source: context.source,
        ...(context.referrer_host
          ? { referrer_host: context.referrer_host }
          : {})
      })
    )
  } catch {
    // Storage blocked: the next view simply resolves its source again.
  }
}

export function storedListingSource(appId) {
  if (!appId) return null
  try {
    const value = JSON.parse(sessionStorage.getItem(sourceKey(appId)) || 'null')
    if (!LISTING_SOURCES.includes(value?.source)) return null
    return value.source === 'external' &&
      typeof value.referrer_host === 'string'
      ? { source: 'external', referrer_host: value.referrer_host }
      : { source: value.source }
  } catch {
    return null
  }
}

/**
 * Source to send for an app: the fresh resolution, unless it only says "other" or the
 * visitor is back from the sign-in page; then the source remembered for this app wins.
 */
export function listingSourceFor(appId, arrival) {
  const resolved = resolveListingSource(arrival || {})
  const back = String(arrival?.state?.back || '')
  const fromLogin = back === '/login' || back.startsWith('/login?')
  if (resolved.source === 'other' || fromLogin)
    return storedListingSource(appId) || resolved
  rememberListingSource(appId, resolved)
  return resolved
}

/** What the browser knows about the arrival, read once when the listing opens. */
export function arrivalSnapshot(query = {}) {
  const value = query?.[SOURCE_QUERY_KEY]
  return {
    state: typeof window !== 'undefined' ? window.history?.state : null,
    query: typeof value === 'string' ? value : null,
    referrer: typeof document !== 'undefined' ? document.referrer : '',
    origin: typeof window !== 'undefined' ? window.location.origin : ''
  }
}

const SOURCE_LABELS = {
  home: () => ui('Accueil'),
  search: () => ui('Recherche'),
  category: () => ui('Catégorie'),
  collection: () => ui('Collection'),
  developer_page: () => ui('Page développeur'),
  similar: () => ui('Applications similaires'),
  direct: () => ui('Accès direct'),
  external: () => ui('Site externe'),
  campaign: () => ui('Campagne'),
  other: () => ui('Autre')
}
export const sourceLabel = source =>
  (SOURCE_LABELS[source] || SOURCE_LABELS.other)()

/* Numbers ------------------------------------------------------------------ */

const isNumber = value =>
  value !== null &&
  value !== undefined &&
  value !== '' &&
  Number.isFinite(Number(value))

export const formatCount = value =>
  isNumber(value) ? Number(value).toLocaleString(currentLocale()) : '0'

// null: the API hides the rate under 20 views, a rate on so few views would mislead.
export const formatRate = value =>
  isNumber(value)
    ? `${Number(value).toLocaleString(currentLocale(), { maximumFractionDigits: 1 })} %`
    : '—'

/**
 * Change against the previous period of the same length. Counts compare in percent,
 * the click rate in percentage points. "—" when there is nothing to compare with.
 */
export function analyticsDelta(current, previous, { points = false } = {}) {
  if (!isNumber(current) || !isNumber(previous) || Number(previous) === 0)
    return {
      text: '—',
      tone: 'none',
      label: ui('Pas de comparaison possible avec la période précédente')
    }
  const change = points
    ? Number(current) - Number(previous)
    : ((Number(current) - Number(previous)) / Number(previous)) * 100
  const rounded = Math.round(change * 10) / 10
  const amount = Math.abs(rounded).toLocaleString(currentLocale(), {
    maximumFractionDigits: 1
  })
  const unit = points ? ' pt' : ' %'
  if (rounded === 0)
    return {
      text: `= 0${unit}`,
      tone: 'flat',
      label: ui('Stable par rapport à la période précédente')
    }
  const up = rounded > 0
  return {
    text: `${up ? '↑' : '↓'} ${amount}${unit}`,
    tone: up ? 'up' : 'down',
    label: up
      ? ui('En hausse de {p0} par rapport à la période précédente', {
          p0: `${amount}${unit}`
        })
      : ui('En baisse de {p0} par rapport à la période précédente', {
          p0: `${amount}${unit}`
        })
  }
}

// Measures collected only since `totals_since` (see totalsCoverage).
const TOTAL_KEYS = new Set([
  'visits_total',
  'unique_visitors_period',
  'opens_total',
  'unique_openers_period'
])

/**
 * How far back all visits, all opens and unique people per period were measured.
 * `banner`: 'since' (the range starts before `totals_since`), 'none' (nothing measured
 * yet while the totals are 0) or null. `comparable`: false when the previous period of
 * the same length starts before `totals_since`, its days counting 0 for lack of data.
 * An API without `totals_since` changes nothing.
 */
export function totalsCoverage(data) {
  if (!data || !('totals_since' in data))
    return { banner: null, since: '', comparable: true }
  const since = String(data.totals_since || '').slice(0, 10)
  const from = String(data.range?.from || '').slice(0, 10)
  const to = String(data.range?.to || '').slice(0, 10)
  if (!since) {
    const k = data.kpis || {}
    const empty = !Number(k.visits_total) && !Number(k.opens_total)
    return { banner: empty ? 'none' : null, since: '', comparable: false }
  }
  const days = rangeDays(from, to)
  const previousFrom = Number.isNaN(days)
    ? ''
    : new Date(utc(from) - days * 86400000).toISOString().slice(0, 10)
  return {
    banner: from && from < since ? 'since' : null,
    since,
    comparable: Boolean(previousFrom) && previousFrom >= since
  }
}

/** KPI groups, in reading order: visits, then "Ouvrir" clicks, then reviews. */
export const KPI_GROUPS = Object.freeze(['visits', 'opens', 'rating'])

/**
 * KPI cards, in reading order, with the exact wording of each measure. Each card names
 * its group (visits | opens | rating); a secondary card is a finer, per-day figure.
 * The all-visits and per-period unique counts only exist on recent APIs: without them
 * their cards are left out (never shown as 0) and the per-day unique visitors stay.
 */
export function analyticsKpis(
  kpis = {},
  { uniqueVisitorsNote = '', totalsComparable = true } = {}
) {
  const previous = kpis.previous || {}
  // The previous period started before collection: comparing would invent a rise.
  const comparable = kpis.previous_complete !== false
  const has = key => isNumber(kpis[key])
  const card = (group, key, label, note, options = {}) => ({
    group,
    key,
    label,
    note,
    secondary: options.secondary === true,
    value: options.rate ? formatRate(kpis[key]) : formatCount(kpis[key]),
    delta:
      options.compare === false ||
      !comparable ||
      (TOTAL_KEYS.has(key) && !totalsComparable)
        ? null
        : analyticsDelta(kpis[key], previous[key], { points: options.rate })
  })
  const periodVisitors = has('unique_visitors_period')
  return [
    has('visits_total') &&
      card(
        'visits',
        'visits_total',
        ui('Visites (toutes)'),
        ui(
          'Chaque affichage de la fiche compte, même plusieurs fois par jour pour le même visiteur.'
        )
      ),
    periodVisitors &&
      card(
        'visits',
        'unique_visitors_period',
        ui('Visiteurs uniques sur la période'),
        ui(
          'Même compte, ou même appareil (adresse IP + navigateur) pour les visiteurs non connectés : compté une seule fois sur toute la période. Un visiteur qui se connecte en cours de visite peut être compté deux fois.'
        )
      ),
    card(
      'visits',
      'views',
      ui('Consultations de la fiche (1 par visiteur et par jour)'),
      ui('Affichages de la fiche, une fois par jour, visiteur et provenance.'),
      { secondary: true }
    ),
    // Superseded by the per-period count when the API gives it.
    !periodVisitors &&
      card(
        'visits',
        'unique_visitors',
        ui('Visiteurs uniques (par jour, cumulés)'),
        // The API explains the measure in the interface language; a fallback otherwise.
        uniqueVisitorsNote ||
          ui(
            'Chaque visiteur compte une fois par jour : sur plusieurs jours, la même personne compte plusieurs fois.'
          )
      ),
    has('opens_total') &&
      card(
        'opens',
        'opens_total',
        ui('Clics « Ouvrir » (tous)'),
        ui(
          'Chaque clic compte, même répété. Un clic sur « Ouvrir » n’est pas une installation.'
        )
      ),
    has('unique_openers_period') &&
      card(
        'opens',
        'unique_openers_period',
        ui('Personnes ayant cliqué « Ouvrir » sur la période'),
        ui(
          'Même compte, ou même appareil (adresse IP + navigateur) pour les visiteurs non connectés : compté une seule fois sur toute la période. Un visiteur qui se connecte en cours de visite peut être compté deux fois.'
        )
      ),
    card(
      'opens',
      'activations',
      ui('Clics sur « Ouvrir » (1 par compte et par jour)'),
      ui(
        'Comptés un par compte et par jour. Un clic sur « Ouvrir » n’est pas une installation.'
      ),
      { secondary: has('opens_total') }
    ),
    card(
      'opens',
      'conversion',
      ui('Taux de clic (Ouvrir / consultations)'),
      ui(
        'Clics « Ouvrir » (1 par compte et par jour) divisés par les consultations de la fiche. Affiché à partir de 20 consultations sur la période.'
      ),
      { rate: true }
    ),
    card(
      'opens',
      'sdk_opens',
      ui('Ouvertures mesurées par le SDK'),
      ui('Uniquement pour les applications qui intègrent le SDK PWA Store.'),
      { compare: false }
    ),
    card(
      'opens',
      'declared_installs',
      ui('Installations déclarées'),
      ui(
        'Déclarées par l’utilisateur ou son navigateur : une installation réelle ne peut pas toujours être mesurée.'
      ),
      { compare: false }
    ),
    {
      group: 'rating',
      key: 'average_rating',
      label: ui('Note moyenne (toutes périodes)'),
      note: i18n.global.t(
        'analytics.reviews',
        { n: formatCount(kpis.reviews) },
        Number(kpis.reviews) || 0
      ),
      secondary: false,
      value: isNumber(kpis.average_rating)
        ? `${Number(kpis.average_rating).toLocaleString(currentLocale(), { maximumFractionDigits: 1 })} ★`
        : '—',
      delta: null
    }
  ].filter(Boolean)
}

/** True when the period has no activity at all (nothing to chart). */
export function isEmptyOverview(data) {
  const k = data?.kpis || {}
  return [
    'views',
    'visits_total',
    'activations',
    'opens_total',
    'sdk_opens',
    'declared_installs'
  ].every(key => !Number(k[key]))
}

/* Period --------------------------------------------------------------------- */

export const PERIOD_PRESETS = Object.freeze([7, 30, 90, 365])
export const MAX_RANGE_DAYS = 366
export const GRANULARITIES = Object.freeze(['day', 'week', 'month'])

const DATE = /^\d{4}-\d{2}-\d{2}$/
const pad = n => String(n).padStart(2, '0')
/** Local calendar day as YYYY-MM-DD (the store counts days in the visitor's calendar). */
export const isoDay = date =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
const utc = day => {
  if (!DATE.test(String(day || ''))) return NaN
  const [y, m, d] = day.split('-').map(Number)
  const time = Date.UTC(y, m - 1, d)
  const check = new Date(time)
  return check.getUTCDate() === d && check.getUTCMonth() === m - 1 ? time : NaN
}

/** Number of days from `from` to `to`, both included; NaN when a date is invalid. */
export const rangeDays = (from, to) =>
  Math.round((utc(to) - utc(from)) / 86400000) + 1

/** The last `days` days up to today included. */
export function presetRange(days, today = new Date()) {
  const start = new Date(today)
  start.setDate(start.getDate() - (days - 1))
  return { from: isoDay(start), to: isoDay(today) }
}

/** Same rules as the API (422 otherwise): two valid dates, in order, not starting in the
 * future, at most 366 days. */
export function rangeError(from, to, today = new Date()) {
  if (Number.isNaN(utc(from)) || Number.isNaN(utc(to)))
    return ui('Choisissez une date de début et une date de fin valides.')
  if (utc(from) > utc(isoDay(today)))
    return ui('La date de début ne peut pas être dans le futur.')
  if (utc(from) > utc(to))
    return ui('La date de début doit précéder la date de fin.')
  if (rangeDays(from, to) > MAX_RANGE_DAYS)
    return ui('La période est limitée à {n} jours.', { n: MAX_RANGE_DAYS })
  return ''
}

/** Query parameters of the overview and of the CSV export. */
export function analyticsParams({ applicationId, from, to, granularity }) {
  return {
    ...(applicationId ? { application_id: applicationId } : {}),
    from,
    to,
    granularity: GRANULARITIES.includes(granularity) ? granularity : 'day'
  }
}

/** "5 – 11 janv." for a bucket, a single day when it spans one day. */
export function bucketLabel(row) {
  const start = String(row?.start || row?.period || '').slice(0, 10)
  const end = String(row?.end || start).slice(0, 10)
  const format = new Intl.DateTimeFormat(currentLocale(), {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  })
  const from = utc(start),
    to = utc(end)
  if (Number.isNaN(from)) return ''
  if (Number.isNaN(to) || from === to) return format.format(new Date(from))
  // "16 – 20 sept." rather than "16 sept. – 20 sept." where the browser can.
  return typeof format.formatRange === 'function'
    ? format.formatRange(new Date(from), new Date(to))
    : `${format.format(new Date(from))} – ${format.format(new Date(to))}`
}

/** TrendChart points of one series: bucket start, its span and whether it is partial. */
export const seriesPoints = (series, key) =>
  (Array.isArray(series) ? series : []).map(row => ({
    day: String(row.start || row.period || '').slice(0, 10),
    value: Number(row[key]) || 0,
    label: bucketLabel(row),
    partial: row.partial === true
  }))

/** Country row: a declared code, small countries grouped, or no country declared. */
export const countryRowLabel = (row, name) =>
  row?.code
    ? name(row.code)
    : row?.other
      ? ui('Autres pays')
      : ui('Non déclaré')

/** Country of connection row (estimated from the IP address): small ones grouped, or
 * unknown when the server could not estimate it. */
export const networkCountryRowLabel = (row, name) =>
  row?.code ? name(row.code) : row?.other ? ui('Autres pays') : ui('Inconnu')

/** City of connection row: a city, small ones grouped, or a city that is not known. */
export const networkCityLabel = row =>
  row?.city
    ? String(row.city)
    : row?.other
      ? ui('Autres villes')
      : ui('Ville inconnue')

/** Licence attribution of the IP-to-location database: its text, and its link only when
 * it is a plain web address. */
export function geoAttributionLink(value) {
  const text = typeof value?.text === 'string' ? value.text.trim() : ''
  if (!text) return null
  let url = ''
  try {
    const parsed = new URL(String(value.url || ''))
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:')
      url = parsed.href
  } catch {
    url = ''
  }
  return { text, url }
}

/** Country view shown first: the estimate when the server makes one, else the declared. */
export const defaultCountryView = data =>
  Array.isArray(data?.network_countries) &&
  data?.network_country_source !== 'none'
    ? 'network'
    : 'declared'

export function formatDay(day) {
  const time = utc(day)
  return Number.isNaN(time)
    ? ''
    : new Date(time).toLocaleDateString(currentLocale(), {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      })
}

/* CSV export ---------------------------------------------------------------- */

export const EXPORT_DATASETS = Object.freeze([
  'series',
  'sources',
  'countries',
  'network_countries',
  'network_cities',
  'apps'
])

/** File name from Content-Disposition, else one built from the dataset and period. */
export function exportFilename(disposition, { dataset, from, to }) {
  const header = String(disposition || '')
  const encoded = header.match(/filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i)
  const plain = header.match(/filename\s*=\s*"?([^";]+)"?/i)
  let name = ''
  try {
    name = encoded
      ? decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ''))
      : plain?.[1]?.trim() || ''
  } catch {
    name = plain?.[1]?.trim() || ''
  }
  // Never a path, never a hidden file.
  name = name
    .replace(/\p{Cc}/gu, '')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/^\.+/, '')
  return name || `pwa-store-analytics-${dataset}-${from}-${to}.csv`
}

const blobText = blob =>
  typeof blob.text === 'function'
    ? blob.text()
    : new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsText(blob)
      })

/** Message of an error answered as a Blob (responseType: 'blob'). */
export async function blobErrorData(error) {
  const data = error?.response?.data
  if (typeof Blob === 'undefined' || !(data instanceof Blob)) return error
  try {
    const parsed = JSON.parse(await blobText(data))
    return { ...error, response: { ...error.response, data: parsed } }
  } catch {
    return { ...error, response: { ...error.response, data: {} } }
  }
}
