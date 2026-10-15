import { currentLocale, i18n } from '@/i18n'
import { ui } from '@/i18n/text'
import { SUGGESTION_STATUS_COLORS } from '@/services/suggestions'
import { SUGGESTION_STATUSES } from '@/utils/suggestions'

// PWA Feedback Hub: wording of the developer's triage. The author keeps the labels of
// SUGGESTION_STATUS_LABELS ("Lue", "Prévue"…); the developer sees work-oriented ones.
export const FEEDBACK_STATUSES = SUGGESTION_STATUSES
export const FEEDBACK_PRIORITIES = ['low', 'normal', 'high', 'urgent']
export const FEEDBACK_TOPICS = [
  'bug',
  'feature',
  'ux',
  'performance',
  'content',
  'other'
]
export const FEEDBACK_PERIODS = [30, 90, 365]
// Same default as the API.
export const DEFAULT_PERIOD = 90
export const FEEDBACK_PAGE_SIZE = 20
// Same cap as the API (BulkFeedbackRequest::MAX).
export const BULK_MAX = 50
export const SEARCH_DEBOUNCE_MS = 400
export const VERSION_MAX = 40
export const REPLY_MAX = 2000

const STATUS = {
  new: 'Nouveau',
  read: 'À étudier',
  planned: 'Planifié',
  in_progress: 'En cours',
  done: 'Résolu',
  declined: 'Refusé'
}
const PRIORITY = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  urgent: 'Urgente'
}
const TOPIC = {
  bug: 'Bug',
  feature: 'Fonctionnalité',
  ux: 'Ergonomie',
  performance: 'Performance',
  content: 'Contenu',
  other: 'Autre'
}
const PRIORITY_COLORS = {
  low: 'grey-7',
  normal: 'primary',
  high: 'orange-8',
  urgent: 'negative'
}

export const feedbackStatusLabel = value =>
  STATUS[value] ? ui(STATUS[value]) : value || '—'
export const feedbackPriorityLabel = value =>
  PRIORITY[value] ? ui(PRIORITY[value]) : ui('Non trié')
export const feedbackTopicLabel = value =>
  TOPIC[value] ? ui(TOPIC[value]) : ui('Non trié')
export const feedbackStatusColor = value =>
  SUGGESTION_STATUS_COLORS[value] || 'grey-7'
export const feedbackPriorityColor = value => PRIORITY_COLORS[value] || 'grey-7'

export const statusOptions = () =>
  FEEDBACK_STATUSES.map(value => ({ value, label: feedbackStatusLabel(value) }))
// "none" stands for "not triaged yet" (null on the API).
export const priorityOptions = ({ none = true } = {}) => [
  ...FEEDBACK_PRIORITIES.map(value => ({
    value,
    label: feedbackPriorityLabel(value)
  })),
  ...(none ? [{ value: 'none', label: ui('Non trié') }] : [])
]
export const topicOptions = ({ none = true } = {}) => [
  ...FEEDBACK_TOPICS.map(value => ({
    value,
    label: feedbackTopicLabel(value)
  })),
  ...(none ? [{ value: 'none', label: ui('Non trié') }] : [])
]
export const duplicateOptions = () => [
  { value: 'hide', label: ui('Masquer les doublons') },
  { value: 'only', label: ui('Doublons seulement') },
  { value: 'all', label: ui('Tout afficher') }
]
export const sortOptions = () => [
  { value: 'newest', label: ui('Plus récents') },
  { value: 'oldest', label: ui('Plus anciens') },
  { value: 'priority', label: ui('Priorité') },
  { value: 'group', label: ui('Les plus signalés') }
]
export const bulkFieldOptions = () => [
  { value: 'status', label: ui('Statut') },
  { value: 'priority', label: ui('Priorité') },
  { value: 'topic', label: ui('Thème') }
]
export function bulkValueOptions(field) {
  if (field === 'status') return statusOptions()
  if (field === 'priority') return priorityOptions()
  if (field === 'topic') return topicOptions()
  return []
}

export const DEFAULT_FILTERS = Object.freeze({
  status: null,
  priority: null,
  topic: null,
  q: '',
  duplicates: 'hide',
  sort: 'newest'
})

export const hasActiveFilters = filters =>
  !!(
    filters.status ||
    filters.priority ||
    filters.topic ||
    String(filters.q || '').trim() ||
    filters.duplicates !== DEFAULT_FILTERS.duplicates
  )

// Query parameters of GET /developer/feedback/suggestions; empty filters are left out.
export function feedbackListParams(filters = {}, { applicationId, page } = {}) {
  const params = {}
  if (applicationId) params.application_id = applicationId
  for (const key of ['status', 'priority', 'topic'])
    if (filters[key]) params[key] = filters[key]
  const q = String(filters.q || '').trim()
  if (q) params.q = q.slice(0, 100)
  params.duplicates = filters.duplicates || DEFAULT_FILTERS.duplicates
  params.sort = filters.sort || DEFAULT_FILTERS.sort
  params.page = page || 1
  return params
}

/**
 * Bulk payload: the ids (at most 50) and exactly one field. "none" clears a priority or
 * a topic (null on the API); a status is always required.
 */
export function bulkPayload(ids, field, value) {
  if (!['status', 'priority', 'topic'].includes(field)) return null
  if (!ids?.length || ids.length > BULK_MAX) return null
  if (field === 'status' && !FEEDBACK_STATUSES.includes(value)) return null
  if (value === undefined || value === '') return null
  return {
    ids: [...ids],
    [field]: value === 'none' ? null : value
  }
}

/**
 * Bulk result, e.g. "48 retours modifiés (+3 doublons mis à jour). 2 avaient déjà cette
 * valeur." selected_updated counts the selected feedbacks that changed; updated also counts
 * the duplicates that followed their primary.
 */
export function bulkResultMessage(sent, result = {}) {
  const updated = Number(result.updated) || 0
  const selected = Number(result.selected_updated ?? result.updated) || 0
  if (!selected)
    return ui('Aucun retour modifié : ils avaient déjà cette valeur.')
  const propagated = Math.max(0, updated - selected)
  const unchanged = Math.max(0, sent - selected)
  return [
    `${pluralText('updated', selected)}${propagated ? ` ${pluralText('propagated', propagated)}` : ''}.`,
    unchanged ? pluralText('unchanged', unchanged) : ''
  ]
    .filter(Boolean)
    .join(' ')
}

// Label of a bulk change, e.g. "Statut : Planifié".
export function bulkChangeLabel(field, value) {
  const name = bulkFieldOptions().find(item => item.value === field)?.label
  const label =
    field === 'status'
      ? feedbackStatusLabel(value)
      : field === 'priority'
        ? feedbackPriorityLabel(value)
        : feedbackTopicLabel(value)
  return `${name} : ${label}`
}

/**
 * Average time from reception to resolution, e.g. "2 j 4 h". "—" when the API has no
 * meaningful average (too few resolved feedbacks on the period).
 */
export function formatResolution(hours) {
  if (hours === null || hours === undefined || hours === '') return '—'
  const value = Number(hours)
  if (!Number.isFinite(value) || value < 0) return '—'
  const minutes = Math.round(value * 60)
  if (minutes < 60) return ui('{n} min', { n: Math.max(1, minutes) })
  const totalHours = Math.round(value)
  const days = Math.floor(totalHours / 24),
    rest = totalHours % 24
  if (!days) return ui('{n} h', { n: totalHours })
  return rest
    ? ui('{d} j {h} h', { d: days, h: rest })
    : ui('{n} j', { n: days })
}

export function resolutionHint(hours) {
  return formatResolution(hours) === '—'
    ? ui(
        'Pas encore assez de retours résolus sur la période pour calculer une moyenne fiable (3 au minimum).'
      )
    : ui('De la réception au passage en « Résolu », sur la période.')
}

export function feedbackDate(value, withTime = false) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(currentLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  })
}

export const authorLabel = item => item?.author?.name || ui('Compte supprimé')

// Keyed plural messages ("1 doublon" / "3 doublons").
export const pluralText = (key, n) =>
  i18n.global.t(
    `feedback.${key}`,
    { n: (Number(n) || 0).toLocaleString(currentLocale()) },
    Number(n) || 0
  )

const ROLE = {
  developer: 'Développeur',
  platform: 'Équipe PWA Store',
  system: 'Automatique'
}
export const actorRoleLabel = role => (ROLE[role] ? ui(ROLE[role]) : '')

// "Kofi (Développeur)", "Équipe PWA Store", "Automatique" (system: no person).
export function historyActor(event) {
  const role = actorRoleLabel(event?.actor_role)
  if (event?.actor_role === 'system') return role
  const name = event?.actor?.name
  return name && role ? `${name} (${role})` : name || role
}

const shown = (label, value) =>
  value === null || value === undefined || value === '' ? '—' : label(value)

/** One readable line per history event, e.g. "Statut : À étudier → Planifié". */
export function historyText(event) {
  const { field, from, to } = event || {}
  switch (field) {
    case 'status':
      return `${ui('Statut')} : ${shown(feedbackStatusLabel, from)} → ${shown(feedbackStatusLabel, to)}`
    case 'priority':
      return `${ui('Priorité')} : ${shown(feedbackPriorityLabel, from)} → ${shown(feedbackPriorityLabel, to)}`
    case 'topic':
      return `${ui('Thème')} : ${shown(feedbackTopicLabel, from)} → ${shown(feedbackTopicLabel, to)}`
    case 'version':
      return `${ui('Version')} : ${shown(String, from)} → ${shown(String, to)}`
    case 'duplicate_of':
      return to === null || to === undefined || to === ''
        ? ui('N’est plus marqué comme doublon (était lié au retour n° {id})', {
            id: from ?? '—'
          })
        : ui('Marqué comme doublon du retour n° {id}', { id: to })
    case 'reply':
      return to === 'removed'
        ? ui('Réponse privée supprimée')
        : ui('Réponse privée envoyée à l’auteur')
    default:
      return field ? `${field} : ${from ?? '—'} → ${to ?? '—'}` : ''
  }
}

// The automatic "read" is the server marking a new feedback as opened by the developer.
export const historyNote = event =>
  event?.actor_role === 'system' &&
  event.field === 'status' &&
  event.from === 'new' &&
  event.to === 'read'
    ? ui('À l’ouverture du retour')
    : ''

export const similarityLabel = score =>
  ui('Ressemblance : {p} %', {
    p: Math.round(Math.min(1, Math.max(0, Number(score) || 0)) * 100)
  })

const orNull = value =>
  value === undefined || value === '' || value === 'none' ? null : value

/** Only the triage fields the developer changed, as PATCH expects them. */
export function triageChanges(detail, form) {
  const changes = {}
  if (form.status && form.status !== detail?.status)
    changes.status = form.status
  for (const key of ['priority', 'topic'])
    if (orNull(form[key]) !== orNull(detail?.[key]))
      changes[key] = orNull(form[key])
  const version =
    String(form.version ?? '')
      .trim()
      .slice(0, VERSION_MAX) || null
  if (version !== (detail?.version || null)) changes.version = version
  return changes
}
