import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'
const units = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60]
]

export function timeAgo(value, now = Date.now()) {
  const format = new Intl.RelativeTimeFormat(currentLocale(), {
    numeric: 'auto'
  })
  const seconds = Math.round((new Date(value).getTime() - now) / 1000)
  for (const [unit, size] of units)
    if (Math.abs(seconds) >= size)
      return format.format(Math.round(seconds / size), unit)
  return ui('à l’instant')
}
