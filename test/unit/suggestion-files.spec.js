import { describe, expect, it } from 'vitest'
import {
  checkSuggestionFiles,
  fileExtension,
  fileProblem,
  formatFileSize,
  isImageFile,
  richTextLength,
  sanitizeRichText,
  SUGGESTION_ACCEPT,
  SUGGESTION_LIMITS
} from '@/utils/suggestions'

const MB = 1024 * 1024
// A File-like object: only name, type, size and lastModified are read.
const file = (name, size = 1000, type, lastModified = 1) => ({
  name,
  size,
  type: type ?? '',
  lastModified
})

describe('suggestion file rules', () => {
  it('uses the same limits as the API (2048 KB, 10 files)', () => {
    expect(SUGGESTION_LIMITS.maxFileBytes).toBe(2048 * 1024)
    expect(SUGGESTION_LIMITS.maxFiles).toBe(10)
    expect(SUGGESTION_ACCEPT).toBe('.png,.jpg,.jpeg,.webp,.gif,.pdf,.txt')
  })

  it('accepts files up to exactly 2 MB and refuses anything larger', () => {
    expect(fileProblem(file('a.png', 2 * MB, 'image/png'))).toBeNull()
    expect(fileProblem(file('a.png', 2 * MB + 1, 'image/png'))).toBe('size')
    expect(fileProblem(file('empty.txt', 0, 'text/plain'))).toBe('empty')
  })

  it('accepts only the allowed types, and a browser type that matches the extension', () => {
    for (const [name, type] of [
      ['shot.PNG', 'image/png'],
      ['photo.jpg', 'image/jpeg'],
      ['photo.jpeg', 'image/jpeg'],
      ['anim.gif', 'image/gif'],
      ['shot.webp', 'image/webp'],
      ['doc.pdf', 'application/pdf'],
      ['notes.txt', 'text/plain'],
      ['unknown-type.pdf', '']
    ])
      expect(fileProblem(file(name, 10, type)), name).toBeNull()

    for (const [name, type] of [
      ['archive.zip', 'application/zip'],
      ['vector.svg', 'image/svg+xml'],
      ['page.html', 'text/html'],
      ['setup.exe', 'application/x-msdownload'],
      ['no-extension', ''],
      // A disguised file: extension and reported type disagree.
      ['capture.png', 'text/html'],
      ['document.pdf', 'image/png']
    ])
      expect(fileProblem(file(name, 10, type)), name).toBe('type')
  })

  it('splits picked files into accepted and rejected with a reason for each', () => {
    const big = file('big.png', 3 * MB, 'image/png')
    const zip = file('a.zip', 10, 'application/zip')
    const ok = file('ok.png', 10, 'image/png')
    const { accepted, rejected } = checkSuggestionFiles([], [big, zip, ok])
    expect(accepted).toEqual([ok])
    expect(rejected).toEqual([
      { file: big, reason: 'size' },
      { file: zip, reason: 'type' }
    ])
  })

  it('stops at ten files and ignores a file already attached', () => {
    const current = Array.from({ length: 9 }, (_, i) =>
      file(`c${i}.png`, 10, 'image/png', i)
    )
    const tenth = file('tenth.pdf', 10, 'application/pdf')
    const eleventh = file('eleventh.pdf', 10, 'application/pdf')
    const again = { ...current[0] }
    const { accepted, rejected } = checkSuggestionFiles(current, [
      again,
      tenth,
      eleventh
    ])
    expect(accepted).toEqual([tenth])
    expect(rejected.map(r => r.reason)).toEqual(['duplicate', 'count'])
  })

  it('helps display files', () => {
    expect(fileExtension('Archive.Final.PDF')).toBe('pdf')
    expect(fileExtension('README')).toBe('')
    expect(isImageFile(file('a.webp', 1, 'image/webp'))).toBe(true)
    expect(isImageFile(file('a.pdf', 1, 'application/pdf'))).toBe(false)
    expect(formatFileSize(512)).toBe('512 o')
    expect(formatFileSize(2048)).toBe('2 Ko')
    expect(formatFileSize(2.5 * MB)).toBe('2.5 Mo')
  })
})

describe('suggestion rich text', () => {
  it('keeps simple formatting and drops scripts, handlers, styles and unsafe links', () => {
    const html = sanitizeRichText(
      '<p onclick="steal()" style="color:red">Bonjour <b>équipe</b></p>' +
        '<script>alert(1)</script><img src="x" onerror="alert(1)">' +
        '<a href="javascript:alert(1)">piège</a> <a href="https://example.org">lien</a>' +
        '<iframe src="https://evil.test"></iframe><font size="7">gros</font>'
    )
    expect(html).toContain('<p>Bonjour <b>équipe</b></p>')
    expect(html).toContain(
      '<a href="https://example.org/" target="_blank" rel="noopener noreferrer nofollow ugc">lien</a>'
    )
    expect(html).toContain('piège')
    expect(html).toContain('gros')
    for (const forbidden of [
      '<script',
      'onclick',
      'style=',
      '<img',
      'onerror',
      'javascript:',
      '<iframe',
      '<font'
    ])
      expect(html).not.toContain(forbidden)
  })

  it('counts visible characters, not markup', () => {
    expect(richTextLength('<p><b>Bonjour</b></p><p>à tous</p>')).toBe(14)
    expect(richTextLength('<div><br></div>')).toBe(0)
    expect(richTextLength('')).toBe(0)
  })
})
