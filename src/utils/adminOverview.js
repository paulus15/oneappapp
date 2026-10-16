import { ui } from '@/i18n/text'
import { currentLocale } from '@/i18n'

// "À traiter" counters of GET /admin/overview. `to` is the page that handles them
// (null: no admin page, the counter is informative). A null value means the admin
// lacks the permission: the card is hidden.
export const TODO_ITEMS = [
  {
    key: 'publication_requests_pending',
    get label() {
      return ui('Demandes de publication à examiner')
    },
    icon: 'fact_check',
    to: '/admin/requests'
  },
  {
    key: 'developer_profiles_pending',
    get label() {
      return ui('Profils développeurs à vérifier')
    },
    icon: 'verified_user',
    to: '/admin/developers'
  },
  {
    key: 'reports_open',
    get label() {
      return ui('Signalements ouverts')
    },
    icon: 'flag',
    to: '/admin/reports'
  },
  {
    key: 'reviews_to_moderate',
    get label() {
      return ui('Avis à modérer')
    },
    icon: 'reviews',
    to: '/admin/reviews'
  },
  {
    key: 'platform_feedback_new',
    get label() {
      return ui('Nouveaux retours sur la plateforme')
    },
    icon: 'forum',
    to: '/admin/feedback'
  },
  {
    key: 'beta_campaigns_pending',
    get label() {
      return ui('Campagnes bêta à valider')
    },
    icon: 'biotech',
    to: '/admin/beta'
  },
  {
    key: 'monitor_incidents_open',
    get label() {
      return ui('Incidents PWA Monitor en cours')
    },
    icon: 'monitor_heart',
    to: null
  },
  {
    key: 'webhooks_disabled',
    get label() {
      return ui('Webhooks désactivés après échecs')
    },
    icon: 'webhook',
    to: null
  }
]

const count = value =>
  value === null || value === undefined || !Number.isFinite(Number(value))
    ? null
    : Math.max(0, Number(value))

export function todoCards(todo) {
  if (!todo || typeof todo !== 'object') return []
  return TODO_ITEMS.map(item => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    to: item.to,
    count: count(todo[item.key])
  })).filter(card => card.count !== null)
}

// Badge next to a sidebar link: only a positive, permitted counter.
export function todoBadge(todo, key) {
  if (!key || !todo) return null
  const value = count(todo[key])
  return value ? value : null
}

export const TOOL_LABELS = {
  get monitor() {
    return ui('PWA Monitor')
  },
  get growth() {
    return ui('Promotion (PWA Growth)')
  },
  get feedback_hub() {
    return ui('Retours utilisateurs (Feedback Hub)')
  },
  get lab_pro() {
    return ui('Labo PWA Pro')
  },
  get beta() {
    return ui('Tests bêta')
  },
  get analytics_pro() {
    return ui('Statistiques avancées')
  },
  get integrations() {
    return ui('Intégrations')
  },
  get assistant() {
    return ui('Assistant IA')
  }
}

export function toolRows(tools) {
  const source = tools && typeof tools === 'object' ? tools : {}
  return Object.keys(TOOL_LABELS).map(key => ({
    key,
    label: TOOL_LABELS[key],
    on: source[key] === true
  }))
}

// Pending jobs older than this threshold warrant checking worker health.
export const QUEUE_STALE_MINUTES = 10

export function queueHealth(queue) {
  const q = queue && typeof queue === 'object' ? queue : {}
  const oldest = count(q.oldest_pending_minutes)
  const failed = count(q.failed_jobs) ?? 0
  return {
    pending: count(q.pending_jobs) ?? 0,
    failed,
    oldest,
    stale: oldest !== null && oldest > QUEUE_STALE_MINUTES,
    hasFailures: failed > 0
  }
}

export const formatCount = value =>
  (Number(value) || 0).toLocaleString(currentLocale())

export function overviewDate(value) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString(currentLocale(), {
        hour: '2-digit',
        minute: '2-digit'
      })
}
