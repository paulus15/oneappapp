import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

// A template helper used without being imported is undefined at render time: the component
// throws and App.vue replaces the whole page with the 500 screen.
const root = join(__dirname, '../../src')

function vueFiles(dir) {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return vueFiles(path)
    return path.endsWith('.vue') ? [path] : []
  })
}

describe('template helpers', () => {
  it('imports ui() in every component whose template calls it', () => {
    const missing = vueFiles(root).filter(path => {
      const source = readFileSync(path, 'utf8')
      const template =
        source.match(/<template>([\s\S]*)<\/template>/)?.[1] || ''
      const script =
        source.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1] || ''
      const used = /(^|[^\w.$])ui\(/.test(template)
      const provided =
        /import\s*\{[^}]*\bui\b[^}]*\}\s*from/.test(script) ||
        /\b(const|let|function)\s+ui\b/.test(script) ||
        /\bui\s*[,}:]/.test(script.match(/return\s*\{[\s\S]*\}/)?.[0] || '')
      return used && !provided
    })
    expect(missing.map(path => relative(root, path))).toEqual([])
  })
})
