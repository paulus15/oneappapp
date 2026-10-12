import { describe, expect, it } from 'vitest'
import fr from '@/i18n/fr'
import en from '@/i18n/en'

// Every message exists in both languages, with the same placeholders.
const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === 'object'
      ? flatten(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value]]
  )
const placeholders = text =>
  [...String(text).matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort()

describe('translations', () => {
  const frMessages = Object.fromEntries(flatten(fr))
  const enMessages = Object.fromEntries(flatten(en))

  it('have the same keys in French and English', () => {
    expect(Object.keys(enMessages).sort()).toEqual(
      Object.keys(frMessages).sort()
    )
  })

  it('use the same placeholders and plural forms', () => {
    for (const [key, text] of Object.entries(frMessages)) {
      expect(placeholders(enMessages[key]), key).toEqual(placeholders(text))
      expect(String(enMessages[key]).split(' | ').length, key).toBe(
        String(text).split(' | ').length
      )
    }
  })

  it('never leave a message empty', () => {
    for (const [key, text] of [
      ...Object.entries(frMessages),
      ...Object.entries(enMessages)
    ])
      expect(String(text).trim(), key).not.toBe('')
  })
})
