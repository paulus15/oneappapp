import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import list from '@quasar/extras/material-icons/icons.json'

// The app uses the Material Icons web font: a name missing from it renders as plain text.
const font = new Set(
  list.map(k =>
    k
      .replace(/^mat/, '')
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toLowerCase()
  )
)
const files = []
;(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.(vue|js)$/.test(name)) files.push(path)
  }
})('src')
const PATTERNS = [
  /(?<![:\w-])icon="([a-z0-9_]+)"/g,
  /<q-icon[^>]*\sname="([a-z0-9_]+)"/g,
  /\bicon: '([a-z0-9_]+)'/g,
  /(?<![:\w-])fallback-icon="([a-z0-9_]+)"/g
]

describe('icons', () => {
  it('exist in the Material Icons font', () => {
    const missing = []
    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      for (const pattern of PATTERNS)
        for (const [, name] of source.matchAll(pattern))
          if (!font.has(name))
            missing.push(`${name} (${relative('src', file)})`)
    }
    expect(missing).toEqual([])
  })
})
