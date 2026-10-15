import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

export function monitorStatus(status) {
  return {
    healthy: { label: ui('En ligne'), color: 'positive', icon: 'check_circle' },
    degraded: { label: ui('Dégradé'), color: 'warning', icon: 'warning_amber' },
    unavailable: { label: ui('Indisponible'), color: 'negative', icon: 'error_outline' }
  }[status] || { label: ui('Inconnu'), color: 'grey-7', icon: 'help_outline' }
}

export function monitorDate(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString(currentLocale())
    : ui('Pas encore mesuré')
}

export function monitorDuration(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value))
    ? `${Number(value).toLocaleString(currentLocale())} ms`
    : '—'
}

export function monitorEligibility(reason) {
  return {
    inactive: ui('Cette application est inactive.'),
    archived: ui('Cette application est archivée.'),
    owner_inactive: ui('Le compte propriétaire est inactif.'),
    missing_url: ui('Ajoutez une adresse HTTPS à cette application.')
  }[reason] || ui('La surveillance n’est pas disponible pour cette application.')
}
