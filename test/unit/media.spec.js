import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { URL } from 'node:url'
import { runInNewContext } from 'node:vm'

it('loads media helpers in a browser without a Node process global', () => {
  const source = readFileSync('src/utils/media.js', 'utf8')
    .replaceAll('export ', '')
    .replaceAll('import.meta.env.VITE_API_URL', 'undefined')
  const context = { URL, window: { location: { protocol: 'https:' } } }
  const result = runInNewContext(
    `${source}\nresolveMediaUrl('/storage/icon.png')`,
    context
  )
  expect(result).toBe('https://oneapp.test/storage/icon.png')
})
