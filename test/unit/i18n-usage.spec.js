import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createI18n } from 'vue-i18n'
import fr from '@/i18n/fr'
import en from '@/i18n/en'

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    return entry.isDirectory()
      ? sourceFiles(path)
      : /\.(vue|js)$/.test(path)
        ? [path]
        : []
  })
}
const resolve = (messages, key) =>
  key.split('.').reduce((value, part) => value?.[part], messages)
const usages = sourceFiles('src').flatMap(file =>
  [
    ...readFileSync(file, 'utf8').matchAll(/\b(?:t|\$t)\(\s*(['"])([^'"]+)\1/g)
  ].map(match => ({ file, key: match[2] }))
)
const navigationKeys = [
  ...readFileSync('src/layouts/MainLayout.vue', 'utf8').matchAll(
    /\{ key: '([^']+)', icon:/g
  )
].map(match => `nav.${match[1]}`)
const dynamicStoreKeys = [
  ...navigationKeys,
  ...[
    'version',
    'category',
    'languages',
    'availability',
    'dataCollected',
    'compatibility',
    'contact',
    'website',
    'support',
    'privacyPolicy',
    'terms'
  ].map(key => `store.details.info.${key}`),
  'workspace.field.cover',
  'workspace.field.availability',
  ...['popular', 'trending', 'new', 'top_rated'].flatMap(value =>
    ['tabs', 'hint', 'empty'].map(group => `store.rankings.${group}.${value}`)
  ),
  ...['all', 'popular', 'trending', 'recommended'].flatMap(value =>
    ['eyebrow', 'title', 'lead'].map(field => `store.apps.${value}.${field}`)
  ),
  ...['modern', 'verified', 'reviews', 'africa'].flatMap(value =>
    ['title', 'text'].map(field => `store.features.${value}.${field}`)
  ),
  ...['latest', 'downloads', 'rating', 'price_asc', 'price_desc'].map(
    value => `store.sort.${value}`
  )
]

describe.each([
  ['fr', fr],
  ['en', en]
])('translation usage (%s)', (locale, messages) => {
  it('provides every literal key used by components and pages', () => {
    const missing = usages.filter(
      ({ key }) => typeof resolve(messages, key) !== 'string'
    )
    expect(missing).toEqual([])
  })

  it('provides the complete dynamic catalogue families', () => {
    expect(
      dynamicStoreKeys.filter(key => typeof resolve(messages, key) !== 'string')
    ).toEqual([])
  })

  it('renders the hero and plural messages rather than exposing keys', () => {
    const instance = createI18n({
      legacy: false,
      locale,
      messages: { [locale]: messages }
    })
    expect(instance.global.t('store.hero.line1')).toBe(
      locale === 'fr' ? 'Une seule installation.' : 'One installation.'
    )
    expect(instance.global.t('store.categories.count', { n: 2 }, 2)).toBe(
      locale === 'fr' ? '2 applications' : '2 apps'
    )
    expect(
      instance.global.t('store.search.resultsFor', { query: 'Test' })
    ).toContain('Test')
  })
})
