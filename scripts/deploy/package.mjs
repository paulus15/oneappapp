import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve('dist/pwa')
const commit = process.env.GITHUB_SHA
if (!/^[a-f0-9]{40}$/.test(commit || '')) throw new Error('GITHUB_SHA required')
const files = {}
async function walk(dir = '') {
  for (const entry of await readdir(resolve(root, dir), {
    withFileTypes: true
  })) {
    const path = dir ? `${dir}/${entry.name}` : entry.name
    if (entry.isDirectory()) await walk(path)
    else if (entry.isFile() && path !== 'release.json') {
      if (!/^[a-zA-Z0-9_./@-]+$/.test(path))
        throw new Error(`Unsafe path: ${path}`)
      files[path] = createHash('sha256')
        .update(await readFile(resolve(root, path)))
        .digest('hex')
    } else if (!entry.isFile()) throw new Error(`Unsupported entry: ${path}`)
  }
}
await walk()
for (const file of [
  'index.html',
  'spa.html',
  'sw.js',
  'manifest.json',
  'robots.txt',
  'sitemap.xml'
]) {
  if (!files[file]) throw new Error(`Missing ${file}`)
}
for (const ext of ['js', 'css']) {
  if (
    !Object.keys(files).some(
      path => path.startsWith('assets/') && path.endsWith(`.${ext}`)
    )
  ) {
    throw new Error(`Missing ${ext} assets`)
  }
}
const html = await readFile(resolve(root, 'index.html'), 'utf8')
if (!/rel="manifest"/.test(html)) throw new Error('Manifest link missing')
const manifest = JSON.parse(
  await readFile(resolve(root, 'manifest.json'), 'utf8')
)
if (!manifest.icons?.length) throw new Error('Manifest icons missing')
for (const icon of manifest.icons) {
  if (!files[icon.src.replace(/^\//, '')])
    throw new Error(`Missing icon ${icon.src}`)
}
await writeFile(
  resolve(root, 'release.json'),
  JSON.stringify({ commit, files }, null, 2) + '\n'
)
console.log(
  `Verified PWA: ${Object.keys(files).length} files, commit ${commit}`
)
