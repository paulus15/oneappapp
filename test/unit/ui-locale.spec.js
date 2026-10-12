import { afterEach, describe, expect, it } from 'vitest'
import { computed } from 'vue'
import { currentLocale, setLocale } from '@/i18n'
import { localizedCopy, ui } from '@/i18n/text'
import english from '@/i18n/ui.en.json'

afterEach(() => setLocale('fr'))

describe('live interface language', () => {
  it('updates existing computed labels and preserves interpolation values', () => {
    setLocale('fr')
    const label = computed(() => ui('Icône de {p0}', { p0: 'Mon application' }))
    expect(label.value).toBe('Icône de Mon application')
    setLocale('en')
    expect(label.value).toBe('Mon application icon')
    expect(currentLocale()).toBe('en')
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem('pwa-locale')).toBe('en')
    setLocale('fr')
    expect(label.value).toBe('Icône de Mon application')
  })

  it('ignores unsupported locales and translates platform copy without mutating it', () => {
    const content = { title: 'Applications', items: ['Gratuit'] }
    setLocale('en')
    setLocale('unknown')
    expect(currentLocale()).toBe('en')
    expect(localizedCopy(content)).toEqual({ title: 'Apps', items: ['Free'] })
    expect(content.title).toBe('Applications')
  })

  it('keeps all source-message placeholders and provides nonempty translations', () => {
    const placeholders = value =>
      [...value.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort()
    for (const [source, translated] of Object.entries(english)) {
      expect(translated.trim(), source).not.toBe('')
      expect(placeholders(translated), source).toEqual(placeholders(source))
    }
  })
})
