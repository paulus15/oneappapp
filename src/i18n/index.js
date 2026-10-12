import { shallowRef } from 'vue'
import { createI18n } from 'vue-i18n'
import { Lang } from 'quasar'
import quasarFr from 'quasar/lang/fr'
import fr from './fr'

// French is the source language; English is opt-in and remembered per browser.
// Only French ships in the main bundle: the English catalogues (keyed messages,
// source-message catalogue and Quasar strings) are downloaded when first needed.
export const LOCALES = [
  { value: 'fr', label: 'Français', short: 'FR' },
  { value: 'en', label: 'English', short: 'EN' }
]
const STORAGE_KEY = 'pwa-locale'
const QUASAR_LANG = { fr: quasarFr }
const supported = locale => LOCALES.some(item => item.value === locale)

function savedLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return supported(saved) ? saved : 'fr'
  } catch {
    return 'fr'
  }
}

// The interface starts in French and switches once the English catalogue is loaded.
export const i18n = createI18n({
  legacy: false,
  locale: 'fr',
  fallbackLocale: 'fr',
  messages: { fr }
})

// English source-message catalogue (ui.en.json), read reactively by ui().
export const englishUi = shallowRef(null)

const loading = {}
function loadLocale(locale) {
  if (locale === 'fr' || QUASAR_LANG[locale]) return Promise.resolve()
  loading[locale] ||= Promise.all([
    import('./en'),
    import('./ui.en.json'),
    import('quasar/lang/en-US')
  ])
    .then(([messages, catalogue, quasarLang]) => {
      i18n.global.setLocaleMessage(locale, messages.default)
      englishUi.value = catalogue.default
      QUASAR_LANG[locale] = quasarLang.default
    })
    .catch(error => {
      // Offline or chunk missing: stay in French and allow a later retry.
      delete loading[locale]
      throw error
    })
  return loading[locale]
}

// The language the visitor asked for, even while its catalogue is still loading.
let requested = savedLocale()

async function apply(locale) {
  if (!supported(locale)) return
  requested = locale
  try {
    await loadLocale(locale)
  } catch {
    return
  }
  // A later choice made while this one was loading wins.
  if (requested !== locale) return
  i18n.global.locale.value = locale
  Lang.set(QUASAR_LANG[locale])
  document.documentElement.lang = locale
}

const listeners = new Set()
// Notified when the visitor picks a language (not when it is restored from the account).
export function onLocaleChosen(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setLocale(locale, { fromAccount = false } = {}) {
  if (!supported(locale)) return Promise.resolve()
  const changed = locale !== requested
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // The choice still holds for this visit.
  }
  if (changed && !fromAccount) listeners.forEach(listener => listener(locale))
  return apply(locale)
}

export const currentLocale = () => i18n.global.locale.value
// Sent to the server (Accept-Language) so its messages match the chosen language
// even before the English catalogue has finished loading.
export const requestedLocale = () => requested

export function installI18n(app) {
  app.use(i18n)
  apply(requested)
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY || event.key === null) apply(savedLocale())
  })
}
