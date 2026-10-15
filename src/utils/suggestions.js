// Client-side rules for private suggestions. They mirror the API (StoreSuggestionRequest),
// which stays the authority: this only gives an immediate, clear message before upload.

export const SUGGESTION_LIMITS = Object.freeze({
  maxFiles: 10,
  // Same limit as the server rule "max:2048" (kilobytes).
  maxFileBytes: 2048 * 1024,
  minTextLength: 10,
  maxTextLength: 5000,
  maxTitleLength: 150
})

// Extension => content type the browser should report for it.
export const SUGGESTION_FILE_TYPES = Object.freeze({
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
  txt: 'text/plain'
})

export const SUGGESTION_ACCEPT = Object.keys(SUGGESTION_FILE_TYPES)
  .map(ext => `.${ext}`)
  .join(',')

export const SUGGESTION_STATUSES = [
  'new',
  'read',
  'planned',
  'in_progress',
  'done',
  'declined'
]

export function fileExtension(name) {
  const match = /\.([^./\\]+)$/.exec(String(name || ''))
  return match ? match[1].toLowerCase() : ''
}

/** Reason a single file is refused, or null when it is acceptable. */
export function fileProblem(file) {
  const expected = SUGGESTION_FILE_TYPES[fileExtension(file?.name)]
  // An empty browser type is tolerated (some systems do not report one): the server checks the content.
  if (!expected || (file.type && file.type !== expected)) return 'type'
  if (!(file.size > 0)) return 'empty'
  if (file.size > SUGGESTION_LIMITS.maxFileBytes) return 'size'
  return null
}

const sameFile = (a, b) =>
  a.name === b.name && a.size === b.size && a.lastModified === b.lastModified

/**
 * Splits newly picked files into accepted and rejected ones, given the files already attached.
 * Rejection reasons: type, empty, size, count, duplicate.
 */
export function checkSuggestionFiles(current = [], incoming = []) {
  const accepted = [],
    rejected = []
  for (const file of incoming) {
    const problem = fileProblem(file)
    if (problem) rejected.push({ file, reason: problem })
    else if ([...current, ...accepted].some(other => sameFile(other, file)))
      rejected.push({ file, reason: 'duplicate' })
    else if (current.length + accepted.length >= SUGGESTION_LIMITS.maxFiles)
      rejected.push({ file, reason: 'count' })
    else accepted.push(file)
  }
  return { accepted, rejected }
}

export function isImageFile(file) {
  return /^image\/(png|jpeg|webp|gif)$/.test(
    file?.type || SUGGESTION_FILE_TYPES[fileExtension(file?.name)] || ''
  )
}

export function formatFileSize(bytes) {
  const size = Number(bytes) || 0
  if (size < 1024) return `${size} o`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`
  return `${(size / 1024 / 1024).toFixed(1).replace('.0', '')} Mo`
}

const ALLOWED_TAGS = new Set([
  'P',
  'DIV',
  'BR',
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'S',
  'STRIKE',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'PRE',
  'CODE',
  'H3',
  'H4',
  'A'
])
const DROPPED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'SVG',
  'MATH',
  'IMG',
  'VIDEO',
  'AUDIO',
  'TEMPLATE',
  'NOSCRIPT',
  'FORM',
  'TEXTAREA',
  'SELECT',
  'BUTTON'
])

function safeHref(value) {
  try {
    const url = new URL(String(value || '').trim())
    return ['https:', 'http:', 'mailto:'].includes(url.protocol)
      ? url.href
      : null
  } catch {
    return null
  }
}

function clean(node) {
  // Snapshot the live collection before removing or replacing nodes.
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 3) continue
    if (child.nodeType !== 1 || DROPPED_TAGS.has(child.tagName)) {
      child.remove()
      continue
    }
    clean(child)
    if (!ALLOWED_TAGS.has(child.tagName)) {
      child.replaceWith(...child.childNodes)
      continue
    }
    const href =
      child.tagName === 'A' ? safeHref(child.getAttribute('href')) : null
    for (const attribute of Array.from(child.attributes))
      child.removeAttribute(attribute.name)
    if (child.tagName === 'A') {
      if (!href) {
        child.replaceWith(...child.childNodes)
        continue
      }
      child.setAttribute('href', href)
      child.setAttribute('target', '_blank')
      child.setAttribute('rel', 'noopener noreferrer nofollow ugc')
    }
  }
}

/**
 * Second, client-side allowlist (the server already sanitizes): only this output is ever given
 * to v-html. DOMParser does not run scripts nor load images of the parsed document.
 */
export function sanitizeRichText(html) {
  if (!html) return ''
  const doc = new DOMParser().parseFromString(
    `<!doctype html><body>${html}</body>`,
    'text/html'
  )
  clean(doc.body)
  return doc.body.innerHTML
}

/** Visible text length of the editor content (the limit applies to text, not markup). */
export function richTextLength(html) {
  if (!html) return 0
  const doc = new DOMParser().parseFromString(
    `<!doctype html><body>${String(html).replace(/<(br|\/p|\/div|\/li)\b[^>]*>/gi, ' $&')}</body>`,
    'text/html'
  )
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim().length
}
