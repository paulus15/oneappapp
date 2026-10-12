import { resolveMediaUrl } from '@/utils/media'

// Cover images come as variants per format and width (see the API contract). The browser
// picks the best format it supports (AVIF, then WebP) and the width that fits; JPEG is the
// fallback every browser reads.
const FORMATS = [
  ['avif', 'image/avif'],
  ['webp', 'image/webp'],
  ['jpg', 'image/jpeg']
]
const PREFERRED_WIDTH = 1280

/** A CSS-safe hex colour, or '' (the value is inserted into a style attribute). */
export function safeColor(value) {
  return /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
    String(value || '')
  )
    ? value
    : ''
}

function variants(widths) {
  if (!widths || typeof widths !== 'object') return []
  return Object.entries(widths)
    .map(([width, url]) => [Number(width), resolveMediaUrl(url)])
    .filter(([width, url]) => width > 0 && url)
    .sort((a, b) => a[0] - b[0])
}

/**
 * Normalises an API cover into <picture> sources, or null when there is nothing to show.
 * `fallback` is the <img> itself: JPEG when present, otherwise the last available format.
 */
export function coverSources(cover) {
  if (!cover || typeof cover !== 'object' || !cover.sources) return null
  const sets = FORMATS.map(([format, type]) => {
    const list = variants(cover.sources[format])
    if (!list.length) return null
    const preferred =
      list.find(([width]) => width >= PREFERRED_WIDTH) || list.at(-1)
    return {
      format,
      type,
      srcset: list.map(([width, url]) => `${url} ${width}w`).join(', '),
      src: preferred[1]
    }
  }).filter(Boolean)
  if (!sets.length) return null
  const fallback = sets.find(set => set.format === 'jpg') || sets.at(-1)
  const width = Number(cover.width) > 0 ? Number(cover.width) : 1920
  const height = Number(cover.height) > 0 ? Number(cover.height) : 1080
  return {
    sources: sets.filter(set => set !== fallback),
    fallback,
    color: safeColor(cover.color),
    width,
    height
  }
}
