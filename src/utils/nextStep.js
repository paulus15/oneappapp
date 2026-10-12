// What the developer should do next with an app, from its status (the server stays the authority).
export function nextStep(app) {
  const id = app.id
  const pending = app.pending_changes && Object.keys(app.pending_changes).length
  switch (app.status) {
    case 'draft':
      return {
        key: 'complete',
        icon: 'edit_note',
        color: 'primary',
        to: `/developer/apps/${id}?tab=submit`
      }
    case 'submitted':
    case 'in_review':
      return {
        key: 'inReview',
        icon: 'hourglass_top',
        color: 'indigo-6',
        to: `/developer/apps/${id}?tab=history`
      }
    case 'changes_requested':
      return {
        key: 'fix',
        icon: 'build_circle',
        color: 'orange-8',
        to: `/developer/apps/${id}?tab=history`
      }
    case 'rejected':
      return {
        key: 'rejected',
        icon: 'report',
        color: 'red-7',
        to: `/developer/apps/${id}?tab=history`
      }
    case 'approved':
      return {
        key: 'publish',
        icon: 'rocket_launch',
        color: 'positive',
        to: `/developer/apps/${id}`
      }
    case 'published':
      return pending
        ? {
            key: 'submitChanges',
            icon: 'pending_actions',
            color: 'orange-8',
            to: `/developer/apps/${id}?tab=submit`
          }
        : {
            key: 'online',
            icon: 'check_circle',
            color: 'positive',
            to: `/apps/${id}`
          }
    case 'suspended':
      return {
        key: 'suspended',
        icon: 'pause_circle',
        color: 'deep-orange-9',
        to: `/developer/apps/${id}?tab=history`
      }
    default:
      return {
        key: 'archived',
        icon: 'inventory',
        color: 'grey-7',
        to: `/developer/apps/${id}`
      }
  }
}
