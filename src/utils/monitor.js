import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'
import { timeAgo } from '@/utils/timeAgo'

// State is always shown with colour, icon and text together.
export function monitorStatus(state) {
  return (
    {
      up: { label: ui('En ligne'), color: 'positive', icon: 'check_circle' },
      degraded: {
        label: ui('Dégradé'),
        color: 'warning',
        icon: 'warning_amber'
      },
      down: {
        label: ui('Indisponible'),
        color: 'negative',
        icon: 'error_outline'
      }
    }[state] || { label: ui('Inconnu'), color: 'grey-7', icon: 'help_outline' }
  )
}

const validDate = value => {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date : null
}

export function monitorDate(value) {
  const date = validDate(value)
  return date ? date.toLocaleString(currentLocale()) : ui('Pas encore mesuré')
}

// "il y a 5 minutes", or a clear placeholder before the first check.
export function monitorRelative(value, now = Date.now()) {
  return validDate(value) ? timeAgo(value, now) : ui('Pas encore vérifié')
}

// A due or overdue check is about to run: never show "il y a 2 minutes" for the next one.
export function monitorNextCheck(value, now = Date.now()) {
  const date = validDate(value)
  if (!date) return ui('Non planifiée')
  return date.getTime() <= now ? ui('imminente') : timeAgo(value, now)
}

// Older API answers have no flag: treat them as monitorable.
export const isMonitorable = app => app?.monitorable !== false

export function monitorDuration(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value))
    ? `${Number(value).toLocaleString(currentLocale())} ms`
    : '—'
}

// Never show 100 % without history: null means not enough checks yet.
export function monitorUptime(ratio) {
  return ratio === null ||
    ratio === undefined ||
    !Number.isFinite(Number(ratio))
    ? ui('Historique insuffisant')
    : `${Number(ratio).toLocaleString(currentLocale(), { maximumFractionDigits: 2 })} %`
}

export function monitorTls(daysLeft) {
  if (daysLeft === null || daysLeft === undefined)
    return { label: ui('Non vérifié'), color: 'grey-7', icon: 'help_outline' }
  if (daysLeft < 0)
    return { label: ui('Expiré'), color: 'negative', icon: 'gpp_bad' }
  if (daysLeft === 0)
    return {
      label: ui('Expire aujourd’hui'),
      color: 'negative',
      icon: 'gpp_bad'
    }
  if (daysLeft <= 14)
    return {
      label: ui('Expire dans {n} j', { n: daysLeft }),
      color: 'warning',
      icon: 'gpp_maybe'
    }
  return {
    label: ui('{n} jours restants', { n: daysLeft }),
    color: 'positive',
    icon: 'verified_user'
  }
}

export function monitorManifest(ok) {
  if (ok === true)
    return { label: ui('Valide'), color: 'positive', icon: 'task_alt' }
  if (ok === false)
    return {
      label: ui('Invalide ou absent'),
      color: 'negative',
      icon: 'report'
    }
  return { label: ui('Non vérifié'), color: 'grey-7', icon: 'help_outline' }
}

export function monitorInterval(minutes) {
  if (minutes < 60) return ui('Toutes les {n} minutes', { n: minutes })
  if (minutes === 60) return ui('Toutes les heures')
  return ui('Toutes les {n} heures', {
    n: Number((minutes / 60).toFixed(1)).toLocaleString(currentLocale())
  })
}

export function incidentKind(kind) {
  return (
    {
      down: ui('Indisponibilité'),
      degraded: ui('Dégradation'),
      tls: ui('Certificat TLS'),
      manifest: ui('Manifeste')
    }[kind] || ui('Incident')
  )
}

export function incidentState(incident) {
  // Incidents are only created once confirmed, so an unresolved one is ongoing.
  return incident?.resolved_at
    ? { label: ui('Résolu'), color: 'positive', icon: 'check_circle' }
    : { label: ui('En cours'), color: 'negative', icon: 'error_outline' }
}
