import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'
import { API_BASE_URL } from '@/utils/media'

// Order of the quick-create chips.
const SOURCES = [
  ['linkedin', 'LinkedIn', 'work'],
  ['facebook', 'Facebook', 'thumb_up'],
  ['whatsapp', 'WhatsApp', 'chat'],
  ['x', 'X', 'alternate_email'],
  ['instagram', 'Instagram', 'photo_camera'],
  ['tiktok', 'TikTok', 'music_note'],
  ['email', 'E-mail', 'mail'],
  ['website', 'Site web', 'language'],
  ['qr', 'QR code', 'qr_code'],
  ['other', 'Autre', 'more_horiz']
]
// Brand names stay as they are; the generic sources are translated.
const TRANSLATED = new Set(['email', 'website', 'qr', 'other'])

export function growthSources() {
  return SOURCES.map(([value, label, icon]) => ({
    value,
    label: TRANSLATED.has(value) ? ui(label) : label,
    icon
  }))
}

export function sourceInfo(source) {
  return (
    growthSources().find(item => item.value === source) || {
      value: source,
      label: ui('Autre'),
      icon: 'more_horiz'
    }
  )
}

// "WhatsApp — octobre 2026": a sensible default the developer can still edit.
export function defaultCampaignName(source, date = new Date()) {
  const month = date.toLocaleDateString(currentLocale(), {
    month: 'long',
    year: 'numeric'
  })
  return `${sourceInfo(source).label} — ${month}`
}

export function growthCount(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString(currentLocale()) : '0'
}

// The API sends null under 10 visits: a rate on so few visits would mislead.
export function conversionLabel(value) {
  return value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
    ? '—'
    : `${Number(value).toLocaleString(currentLocale(), { maximumFractionDigits: 1 })} %`
}

export function conversionHint(value) {
  return conversionLabel(value) === '—'
    ? ui(
        'Pas encore assez de visites : le taux s’affiche à partir de 10 visites.'
      )
    : ui('Ouvertures rapportées aux visites de ce lien.')
}

export function growthDate(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(currentLocale(), {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : ''
}

/* Badges --------------------------------------------------------------- */

export const BADGE_DEFAULTS = Object.freeze({
  style: 'available',
  theme: 'light',
  size: 'md',
  lang: 'fr'
})

// The alt text follows the badge language, not the interface language.
const BADGE_ALT = {
  fr: {
    available: 'Disponible sur PWA Store',
    discover: 'Découvrir sur PWA Store'
  },
  en: { available: 'Available on PWA Store', discover: 'Discover on PWA Store' }
}

export function badgeParams(options = {}) {
  const pick = (key, allowed) =>
    allowed.includes(options[key]) ? options[key] : BADGE_DEFAULTS[key]
  return {
    style: pick('style', ['available', 'discover']),
    theme: pick('theme', ['light', 'dark']),
    size: pick('size', ['sm', 'md', 'lg']),
    lang: pick('lang', ['fr', 'en'])
  }
}

// Absolute public URL: the snippet is pasted on other websites.
export function badgeUrl(appId, options = {}) {
  const query = new URLSearchParams(badgeParams(options)).toString()
  return `${API_BASE_URL.replace(/\/$/, '')}/badges/${encodeURIComponent(appId)}.svg?${query}`
}

export function badgeAlt(name, options = {}) {
  const { style, lang } = badgeParams(options)
  const label = BADGE_ALT[lang][style]
  return name ? `${name} — ${label}` : label
}

export function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    char =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]
  )
}

export function badgeHtml({ appId, name, publicUrl, options }) {
  return `<a href="${escapeHtml(publicUrl)}"><img src="${escapeHtml(
    badgeUrl(appId, options)
  )}" alt="${escapeHtml(badgeAlt(name, options))}" loading="lazy"></a>`
}

// Brackets would break the link syntax; backticks, * and _ would format the text.
const markdownText = value =>
  String(value ?? '').replace(/([\\[\]`*_])/g, '\\$1')
const markdownUrl = value =>
  String(value ?? '').replace(
    /[()\s<>]/g,
    char => `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`
  )

export function badgeMarkdown({ appId, name, publicUrl, options }) {
  return `[![${markdownText(badgeAlt(name, options))}](${markdownUrl(
    badgeUrl(appId, options)
  )})](${markdownUrl(publicUrl)})`
}

/* Attribution ------------------------------------------------------------ */

// Tokens are exactly 22 base62 characters.
export const CAMPAIGN_TOKEN = /^[A-Za-z0-9]{22}$/
export const isCampaignToken = value =>
  typeof value === 'string' && CAMPAIGN_TOKEN.test(value)

const campaignKey = appId => `pwa-campaign-${appId}`

// Kept per app for the tab's lifetime, so it is never sent for another app.
export function rememberCampaign(appId, token) {
  if (!appId || !isCampaignToken(token)) return
  try {
    sessionStorage.setItem(campaignKey(appId), token)
  } catch {
    // Storage blocked: the attribution simply stops at the visit.
  }
}

export function campaignFor(appId) {
  if (!appId) return null
  try {
    const token = sessionStorage.getItem(campaignKey(appId))
    return isCampaignToken(token) ? token : null
  } catch {
    return null
  }
}

export function forgetCampaign(appId) {
  try {
    sessionStorage.removeItem(campaignKey(appId))
  } catch {
    // Nothing stored.
  }
}

/* Files and clipboard ---------------------------------------------------- */

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permission refused or insecure context: try the legacy way.
  }
  // The fallback moves focus to a hidden field: give it back to the button afterwards.
  const previous = document.activeElement
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }
  area.remove()
  previous?.focus?.()
  return copied
}

export const svgBlob = text => new Blob([text], { type: 'image/svg+xml' })

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Some browsers start reading the file late: keep the URL alive for a while.
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}

export function fileSlug(value) {
  return (
    String(value || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'pwa-store'
  )
}

// Rasterizes SVG text at an exact size. A data URL keeps the canvas untainted.
export function svgToPng(text, width, height, background = '#ffffff') {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        if (!context) throw new Error('canvas')
        if (background) {
          context.fillStyle = background
          context.fillRect(0, 0, width, height)
        }
        context.drawImage(image, 0, 0, width, height)
        canvas.toBlob(
          blob => (blob ? resolve(blob) : reject(new Error('png'))),
          'image/png'
        )
      } catch (e) {
        reject(e)
      }
    }
    image.onerror = () => reject(new Error('svg'))
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`
  })
}
