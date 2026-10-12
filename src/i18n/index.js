import { createI18n } from 'vue-i18n'
import { Lang } from 'quasar'
import quasarFr from 'quasar/lang/fr'
import quasarEn from 'quasar/lang/en-US'
import fr from './fr'
import en from './en'

// French is the source language; English is opt-in and remembered per browser.
export const LOCALES = [
  { value: 'fr', label: 'Français', short: 'FR' },
  { value: 'en', label: 'English', short: 'EN' }
]
const STORAGE_KEY = 'pwa-locale'
const QUASAR_LANG = { fr: quasarFr, en: quasarEn }

function savedLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return LOCALES.some(l => l.value === saved) ? saved : 'fr'
  } catch {
    return 'fr'
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale(),
  fallbackLocale: 'fr',
  messages: { fr, en }
})

function apply(locale) {
  if (!LOCALES.some(item => item.value === locale)) return
  i18n.global.locale.value = locale
  Lang.set(QUASAR_LANG[locale])
  document.documentElement.lang = locale
}

export function setLocale(locale) {
  if (!LOCALES.some(item => item.value === locale)) return
  apply(locale)
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // The choice still holds for this visit.
  }
}

export const currentLocale = () => i18n.global.locale.value

export function installI18n(app) {
  app.use(i18n)
  apply(i18n.global.locale.value)
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY || event.key === null) apply(savedLocale())
  })
}
