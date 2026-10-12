import { ui } from '@/i18n/text'
import { i18n } from '@/i18n'

// Mirrors App\Services\ApplicationLifecycle on the server; the server stays the authority.
export const APP_STATUS = {
  draft: {
    get label() {
      return ui('Brouillon')
    },
    color: 'grey-7'
  },
  submitted: {
    get label() {
      return ui('Soumise')
    },
    color: 'blue-7'
  },
  in_review: {
    get label() {
      return ui('En analyse')
    },
    color: 'indigo-6'
  },
  changes_requested: {
    get label() {
      return ui('Correction demandée')
    },
    color: 'orange-8'
  },
  approved: {
    get label() {
      return ui('Approuvée — à publier')
    },
    color: 'teal-7'
  },
  published: {
    get label() {
      return ui('Publiée')
    },
    color: 'green-7'
  },
  rejected: {
    get label() {
      return ui('Refusée')
    },
    color: 'red-7'
  },
  suspended: {
    get label() {
      return ui('Suspendue')
    },
    color: 'deep-orange-9'
  },
  archived: {
    get label() {
      return ui('Archivée')
    },
    color: 'blue-grey-6'
  }
}

const t = (key, fallback) =>
  i18n.global.te(key) ? i18n.global.t(key) : fallback
export const statusLabel = status =>
  t(`status.${status}`, APP_STATUS[status]?.label || status)
export const statusColor = status => APP_STATUS[status]?.color || 'grey-7'

// Moderation decisions an administrator can take from each state.
const DECISIONS = {
  in_review: {
    get label() {
      return ui('Prendre en charge')
    },
    icon: 'visibility',
    reason: false
  },
  approved: {
    get label() {
      return ui('Approuver')
    },
    icon: 'check',
    reason: true
  },
  changes_requested: {
    get label() {
      return ui('Demander une correction')
    },
    icon: 'edit_note',
    reason: true
  },
  rejected: {
    get label() {
      return ui('Refuser')
    },
    icon: 'block',
    reason: true
  },
  suspended: {
    get label() {
      return ui('Suspendre')
    },
    icon: 'pause_circle',
    reason: true
  },
  // A suspended app is put back online directly, with a reason (or through a re-examination request).
  published: {
    get label() {
      return ui('Rétablir')
    },
    icon: 'restore',
    reason: true
  }
}
const ADMIN_FLOW = {
  submitted: ['in_review', 'approved', 'changes_requested', 'rejected'],
  in_review: ['approved', 'changes_requested', 'rejected'],
  approved: ['changes_requested', 'suspended'],
  published: ['suspended'],
  suspended: ['published']
}

export function adminDecisions(status) {
  return (ADMIN_FLOW[status] || []).map(to => ({
    to,
    ...DECISIONS[to],
    label:
      status === 'suspended'
        ? t('decision.reinstate', 'Rétablir')
        : t(`decision.${to}`, DECISIONS[to].label)
  }))
}

export const EDITABLE_STATUSES = ['draft', 'rejected', 'changes_requested']
