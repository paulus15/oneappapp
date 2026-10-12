import { describe, expect, it } from 'vitest'
import { coverSources, safeColor } from '@/utils/cover'
import {
  compatibilityKeys,
  countryCodes,
  safeEmail,
  safeExternalUrl
} from '@/utils/listing'
import { toCard } from '@/utils/appCard'

const cover = {
  color: '#0a5cff',
  width: 1920,
  height: 1080,
  sources: {
    avif: {
      640: 'https://cdn.test/a-640.avif',
      1920: 'https://cdn.test/a-1920.avif'
    },
    webp: {
      1280: '/api/media/covers/1/w-1280.webp',
      640: '/api/media/covers/1/w-640.webp'
    },
    jpg: {
      640: 'https://cdn.test/j-640.jpg',
      1280: 'https://cdn.test/j-1280.jpg'
    }
  }
}

describe('coverSources', () => {
  it('orders formats AVIF then WebP, with JPEG as the <img> fallback', () => {
    const picture = coverSources(cover)
    expect(picture.sources.map(s => s.type)).toEqual([
      'image/avif',
      'image/webp'
    ])
    expect(picture.fallback.type).toBe('image/jpeg')
    expect(picture.fallback.src).toBe('https://cdn.test/j-1280.jpg')
    expect(picture.sources[0].srcset).toBe(
      'https://cdn.test/a-640.avif 640w, https://cdn.test/a-1920.avif 1920w'
    )
    // Relative URLs are resolved against the API origin.
    expect(picture.sources[1].srcset).toMatch(
      /^https?:\/\/[^ ]+\/api\/media\/covers\/1\/w-640\.webp 640w/
    )
    expect(picture).toMatchObject({
      color: '#0a5cff',
      width: 1920,
      height: 1080
    })
  })

  it('works with a single format and returns null without any source', () => {
    expect(
      coverSources({ sources: { webp: { 640: 'https://x.test/a.webp' } } })
        .fallback.type
    ).toBe('image/webp')
    expect(coverSources(null)).toBeNull()
    expect(coverSources({ sources: {} })).toBeNull()
  })

  it('never lets an arbitrary string into a style', () => {
    expect(safeColor('#abc')).toBe('#abc')
    expect(safeColor('red;background:url(x)')).toBe('')
  })
})

describe('listing helpers', () => {
  it('keeps only http(s) links and plausible e-mails', () => {
    expect(safeExternalUrl('https://example.com/privacy')).toBe(
      'https://example.com/privacy'
    )
    expect(safeExternalUrl('javascript:alert(1)')).toBe('')
    expect(safeExternalUrl('not a url')).toBe('')
    expect(safeEmail('hello@studio.ci')).toBe('hello@studio.ci')
    expect(safeEmail('nope')).toBe('')
  })

  it('reads countries and compatibility in either shape', () => {
    expect(countryCodes(['CI', { code: 'SN' }])).toEqual(['CI', 'SN'])
    expect(
      compatibilityKeys({ mobile: true, tablet: 0, offline: '1' })
    ).toEqual(['mobile', 'offline'])
    expect(compatibilityKeys(['desktop'])).toEqual(['desktop'])
  })

  it('carries cover and rank to cards only when the API sends them', () => {
    expect(toCard({ id: 1, name: 'A' })).toMatchObject({
      cover: null,
      rank: null
    })
    expect(toCard({ id: 1, name: 'A', cover, rank: 3 })).toMatchObject({
      cover,
      rank: 3
    })
  })
})
