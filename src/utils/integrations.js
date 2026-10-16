import { currentLocale, i18n } from '@/i18n'
import { ui } from '@/i18n/text'
import { API_BASE_URL } from '@/utils/media'

// PWA Store Integrations: wording and client-side rules. The API stays the authority;
// these rules only give an immediate, clear message before sending.

export const INTEGRATION_LIMITS = Object.freeze({
  tokenName: 80,
  activeTokens: 20,
  webhooks: 10,
  url: 2048,
  // A token expiring within this many days is flagged.
  expiringDays: 14
})

// --- Abilities (least privilege: only apps:read is checked by default) ---
export const ABILITIES = Object.freeze([
  'apps:read',
  'checks:read',
  'checks:write',
  'audits:read',
  'versions:write',
  'versions:read'
])
export const DEFAULT_ABILITIES = Object.freeze(['apps:read'])

const abilityText = {
  'apps:read': () => ({
    label: ui('Lire les applications'),
    description: ui(
      'Liste vos applications et leur statut de publication, sans rien modifier.'
    )
  }),
  'checks:read': () => ({
    label: ui('Lire les vérifications'),
    description: ui(
      'Lit le résultat de la dernière vérification et l’état d’une vérification lancée, sans en lancer.'
    )
  }),
  'checks:write': () => ({
    label: ui('Lancer des vérifications'),
    description: ui(
      'Lance une vérification de disponibilité et lit son résultat (inclut la lecture).'
    )
  }),
  'audits:read': () => ({
    label: ui('Lire les audits'),
    description: ui('Lit le dernier diagnostic PWA d’une application.')
  }),
  'versions:write': () => ({
    label: ui('Soumettre des mises à jour à la modération'),
    description: ui(
      'Envoie une demande de mise à jour. Un modérateur la valide : rien n’est publié automatiquement.'
    )
  }),
  'versions:read': () => ({
    label: ui('Suivre les soumissions'),
    description: ui('Lit l’état d’une demande de mise à jour envoyée.')
  })
}
export const abilityLabel = value => abilityText[value]?.().label || value
export const abilityDescription = value =>
  abilityText[value]?.().description || ''
export const abilityOptions = () =>
  ABILITIES.map(value => ({
    value,
    label: abilityLabel(value),
    description: abilityDescription(value)
  }))

// --- Webhook events ---
export const EVENTS = Object.freeze([
  'audit.completed',
  'submission.approved',
  'submission.rejected',
  'incident.opened',
  'incident.resolved'
])
const eventText = {
  'audit.completed': () => ({
    label: ui('Audit terminé'),
    description: ui('Un diagnostic PWA de votre application est terminé.')
  }),
  'submission.approved': () => ({
    label: ui('Mise à jour approuvée'),
    description: ui('Un modérateur a validé votre mise à jour.')
  }),
  'submission.rejected': () => ({
    label: ui('Mise à jour refusée'),
    description: ui(
      'Un modérateur a refusé votre mise à jour ou demandé des modifications (data.decision vaut alors changes_requested), avec le motif.'
    )
  }),
  'incident.opened': () => ({
    label: ui('Incident détecté'),
    description: ui(
      'PWA Monitor a confirmé un nouvel incident : votre application ne répond plus.'
    )
  }),
  'incident.resolved': () => ({
    label: ui('Incident résolu'),
    description: ui('Votre application répond de nouveau.')
  })
}
export const eventLabel = value =>
  eventText[value]?.().label || (value === 'ping' ? ui('Test') : value)
export const eventDescription = value => eventText[value]?.().description || ''
export const eventOptions = () =>
  EVENTS.map(value => ({
    value,
    label: eventLabel(value),
    description: eventDescription(value)
  }))

// --- Deliveries ---
export const DELIVERY_STATUSES = Object.freeze(['pending', 'success', 'failed'])
const deliveryText = {
  pending: () => ui('En attente'),
  success: () => ui('Réussie'),
  failed: () => ui('Échouée')
}
export const deliveryStatusLabel = value => deliveryText[value]?.() || value
export const deliveryStatusTone = value =>
  ({ success: 'positive', failed: 'negative', pending: 'warning' })[value] ||
  'neutral'
export const deliveryStatusOptions = () => [
  { value: '', label: ui('Toutes') },
  ...DELIVERY_STATUSES.map(value => ({
    value,
    label: deliveryStatusLabel(value)
  }))
]

// --- Expiry presets ---
export const EXPIRY_PRESETS = Object.freeze([30, 90, 180, 365])
export const DEFAULT_EXPIRY = 90
export const expiryOptions = () =>
  EXPIRY_PRESETS.map(days => ({
    value: days,
    label: days === 365 ? ui('1 an') : integrationsPlural('days', days)
  }))

// Keyed plural messages ("1 jour" / "30 jours").
export const integrationsPlural = (key, n, values = {}) =>
  i18n.global.t(
    `integrations.${key}`,
    { ...values, n: (Number(n) || 0).toLocaleString(currentLocale()) },
    Number(n) || 0
  )

// --- Dates ---
function toDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}
export function integrationDate(value, withTime = false) {
  const date = toDate(value)
  if (!date) return ''
  return date.toLocaleDateString(currentLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  })
}

const DAY = 24 * 60 * 60 * 1000
// Whole days left before a date (0 on the last day, negative once passed).
export function daysLeft(value, now = new Date()) {
  const date = toDate(value)
  if (!date) return null
  return Math.floor((date.getTime() - now.getTime()) / DAY)
}

// --- Tokens ---
// The list only ever shows the prefix ("pwas_abcd1234…"), never a full token.
export const maskedToken = prefix => (prefix ? `${prefix}…` : '…')

/** revoked | expired | expiring (< 14 days) | active */
export function tokenState(token, now = new Date()) {
  if (token?.revoked_at) return 'revoked'
  const date = toDate(token?.expires_at)
  if (date && date.getTime() <= now.getTime()) return 'expired'
  const left = daysLeft(token?.expires_at, now)
  if (left !== null && left < INTEGRATION_LIMITS.expiringDays) return 'expiring'
  return 'active'
}
export function tokenStateInfo(state) {
  return (
    {
      revoked: { label: ui('Révoqué'), tone: 'neutral', icon: 'block' },
      expired: { label: ui('Expiré'), tone: 'negative', icon: 'event_busy' },
      expiring: {
        label: ui('Expire bientôt'),
        tone: 'warning',
        icon: 'schedule'
      },
      active: { label: ui('Actif'), tone: 'positive', icon: 'check_circle' }
    }[state] || { label: state, tone: 'neutral', icon: 'help' }
  )
}
export function expiryText(token, now = new Date()) {
  if (!token?.expires_at) return ui('N’expire pas')
  const left = daysLeft(token.expires_at, now)
  if (tokenState({ expires_at: token.expires_at }, now) === 'expired')
    return ui('Expiré le {p0}', { p0: integrationDate(token.expires_at) })
  if (left < INTEGRATION_LIMITS.expiringDays)
    return left < 1
      ? ui('Expire aujourd’hui')
      : ui('Expire dans {p0}', { p0: integrationsPlural('days', left) })
  return ui('Expire le {p0}', { p0: integrationDate(token.expires_at) })
}
export const isTokenUsable = (token, now = new Date()) =>
  ['active', 'expiring'].includes(tokenState(token, now))
export const activeTokenCount = (tokens, now = new Date()) =>
  (tokens || []).filter(token => isTokenUsable(token, now)).length

export const scopeLabel = application =>
  application?.name || ui('Toutes mes applications')

export function newTokenForm() {
  return {
    name: '',
    application_id: null,
    abilities: [...DEFAULT_ABILITIES],
    expires_in_days: DEFAULT_EXPIRY
  }
}
export function tokenFormError(form) {
  const name = String(form?.name || '').trim()
  if (!name) return ui('Donnez un nom à ce jeton.')
  if (name.length > INTEGRATION_LIMITS.tokenName)
    return ui('Le nom ne doit pas dépasser {p0} caractères.', {
      p0: INTEGRATION_LIMITS.tokenName
    })
  if (!form.abilities?.length) return ui('Choisissez au moins une permission.')
  if (form.abilities.some(value => !ABILITIES.includes(value)))
    return ui('Permission inconnue.')
  const days = Number(form.expires_in_days)
  if (!Number.isInteger(days) || days < 1 || days > 365)
    return ui('Choisissez une durée de validité.')
  return ''
}
// Ordered abilities, application only when one is chosen.
export function tokenPayload(form) {
  const payload = {
    name: String(form.name || '').trim(),
    abilities: ABILITIES.filter(value => form.abilities?.includes(value)),
    expires_in_days: Number(form.expires_in_days)
  }
  if (form.application_id) payload.application_id = Number(form.application_id)
  return payload
}
// The plaintext secret must never reach lists or stores.
export function withoutSecret(item, key) {
  if (!item || typeof item !== 'object') return item
  const copy = { ...item }
  delete copy[key]
  return copy
}

// --- Webhooks ---
// Reserved or local names, and IP literals: the server refuses them too.
const LOCAL_HOST = /(^|\.)(localhost|local|internal|test|invalid|example)$/i
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/

/** '' when acceptable, else the message to show. */
export function webhookUrlError(value) {
  const text = String(value || '').trim()
  if (!text) return ui('Indiquez l’adresse qui recevra les événements.')
  if (text.length > INTEGRATION_LIMITS.url)
    return ui('Cette adresse est trop longue.')
  let url
  try {
    url = new URL(text)
  } catch {
    return ui(
      'Adresse invalide. Exemple : https://exemple.com/webhooks/pwastore'
    )
  }
  if (url.protocol !== 'https:')
    return ui('L’adresse doit commencer par https://')
  if (url.username || url.password)
    return ui(
      'L’adresse ne doit pas contenir d’identifiant ni de mot de passe.'
    )
  // new URL() drops the default :443, so any remaining port is another one.
  if (url.port)
    return ui(
      'Utilisez le port HTTPS standard (443) : retirez le port de l’adresse.'
    )
  const host = url.hostname
  if (host.endsWith('.')) return ui('Retirez le point final du nom de domaine.')
  if (
    host.startsWith('[') ||
    IPV4.test(host) ||
    !host.includes('.') ||
    LOCAL_HOST.test(host)
  )
    return ui(
      'Utilisez un nom de domaine public : les adresses IP et les noms locaux ou réservés ne sont pas acceptés.'
    )
  return ''
}
export const isHttpsUrl = value => webhookUrlError(value) === ''

/** failing (disabled after failures) | paused | active */
export function webhookState(hook) {
  if (hook?.disabled_at) return 'failing'
  if (!hook?.active) return 'paused'
  return 'active'
}
export function webhookStateInfo(state) {
  return (
    {
      failing: {
        label: ui('Désactivé après échecs'),
        tone: 'negative',
        icon: 'error'
      },
      paused: { label: ui('En pause'), tone: 'neutral', icon: 'pause_circle' },
      active: { label: ui('Actif'), tone: 'positive', icon: 'check_circle' }
    }[state] || { label: state, tone: 'neutral', icon: 'help' }
  )
}

export function newWebhookForm(hook = null) {
  return {
    url: hook?.url || '',
    application_id: hook?.application?.id ?? null,
    events: hook ? [...(hook.events || [])] : [...EVENTS]
  }
}
export function webhookFormError(form) {
  const urlError = webhookUrlError(form?.url)
  if (urlError) return urlError
  if (!form.events?.length) return ui('Choisissez au moins un événement.')
  if (form.events.some(value => !EVENTS.includes(value)))
    return ui('Événement inconnu.')
  return ''
}
// Creation sends the scope; an edit only sends what may change (url, events).
export function webhookPayload(form, { editing = false } = {}) {
  const payload = {
    url: String(form.url || '').trim(),
    events: EVENTS.filter(value => form.events?.includes(value))
  }
  if (!editing && form.application_id)
    payload.application_id = Number(form.application_id)
  return payload
}

// --- Documentation ---
export const integrationsApiBase = (base = API_BASE_URL) =>
  `${String(base).replace(/\/+$/, '')}/integrations/v1`
