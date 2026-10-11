// Mirrors App\Services\ApplicationLifecycle on the server; the server stays the authority.
export const APP_STATUS = {
  draft: { label: 'Brouillon', color: 'grey-7' },
  submitted: { label: 'Soumise', color: 'blue-7' },
  in_review: { label: 'En analyse', color: 'indigo-6' },
  changes_requested: { label: 'Correction demandée', color: 'orange-8' },
  approved: { label: 'Approuvée — à publier', color: 'teal-7' },
  published: { label: 'Publiée', color: 'green-7' },
  rejected: { label: 'Refusée', color: 'red-7' },
  suspended: { label: 'Suspendue', color: 'deep-orange-9' },
  archived: { label: 'Archivée', color: 'blue-grey-6' }
}

export const statusLabel = status => APP_STATUS[status]?.label || status
export const statusColor = status => APP_STATUS[status]?.color || 'grey-7'

// Moderation decisions an administrator can take from each state.
const DECISIONS = {
  in_review: { label: 'Prendre en charge', icon: 'visibility', reason: false },
  approved: { label: 'Approuver', icon: 'check', reason: true },
  changes_requested: {
    label: 'Demander une correction',
    icon: 'edit_note',
    reason: true
  },
  rejected: { label: 'Refuser', icon: 'block', reason: true },
  suspended: { label: 'Suspendre', icon: 'pause_circle', reason: true }
}
const ADMIN_FLOW = {
  submitted: ['in_review', 'approved', 'changes_requested', 'rejected'],
  in_review: ['approved', 'changes_requested', 'rejected'],
  approved: ['changes_requested', 'suspended'],
  published: ['suspended'],
  suspended: ['in_review']
}

export function adminDecisions(status) {
  return (ADMIN_FLOW[status] || []).map(to => ({
    to,
    ...DECISIONS[to],
    label: status === 'suspended' ? 'Réexaminer' : DECISIONS[to].label
  }))
}

export const EDITABLE_STATUSES = ['draft', 'rejected', 'changes_requested']
