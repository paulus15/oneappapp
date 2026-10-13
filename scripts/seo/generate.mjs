import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { JSDOM } from 'jsdom'
import {
  applySeo,
  PUBLIC_PAGES,
  routeSeo,
  SITE_URL
} from '../../src/utils/seo.js'

const escapeXml = value =>
  String(value).replace(
    /[<>&"']/g,
    char =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;'
      })[char]
  )

export async function catalogPages(apiUrl, fetcher = fetch) {
  const base = new URL(apiUrl)
  if (
    base.protocol !== 'https:' ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  )
    throw new Error('SEO catalogue requires a public HTTPS API URL')
  const get = async path => {
    const response = await fetcher(`${base.href.replace(/\/$/, '')}/${path}`, {
      headers: { Accept: 'application/json', 'Accept-Language': 'fr' },
      signal: AbortSignal.timeout(20000),
      redirect: 'error'
    })
    if (!response.ok) throw new Error(`SEO catalogue HTTP ${response.status}`)
    return response.json()
  }
  const pages = []
  let lastPage = 1
  for (let page = 1; page <= lastPage; page++) {
    const result = await get(`apps?page=${page}`)
    if (
      !Array.isArray(result.data) ||
      !Number.isSafeInteger(result.last_page) ||
      result.last_page < page ||
      result.last_page > 1000
    )
      throw new Error('Invalid SEO catalogue pagination')
    lastPage = result.last_page
    for (const app of result.data) {
      if (
        !/^\d+$/.test(String(app.id)) ||
        app.status !== 'published' ||
        !app.name
      )
        continue
      pages.push({
        path: `/apps/${app.id}`,
        details: {
          title: `${app.name} — Application PWA | PWAStore`,
          name: app.name,
          description: app.short_description || app.description
        }
      })
    }
  }
  const categories = await get('categories')
  if (!Array.isArray(categories)) throw new Error('Invalid SEO categories')
  for (const category of categories) {
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.slug || '') ||
      !category.name
    )
      continue
    pages.push({
      path: `/categories/${category.slug}`,
      details: {
        title: `${category.name} | PWAStore`,
        name: category.name,
        description: category.description
      }
    })
  }
  return pages
}

export function sitemapXml(paths) {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    [...new Set(paths)]
      .map(path => `  <url><loc>${escapeXml(SITE_URL + path)}</loc></url>`)
      .join('\n') +
    '\n</urlset>\n'
  )
}

export async function generateSeo(outDir, { apiUrl, fetcher } = {}) {
  const root = resolve(outDir)
  const shell = await readFile(resolve(root, 'index.html'), 'utf8')
  const pages = Object.keys(PUBLIC_PAGES).map(path => ({ path, details: {} }))
  if (apiUrl) pages.push(...(await catalogPages(apiUrl, fetcher)))
  const unique = [...new Map(pages.map(page => [page.path, page])).values()]
  // Unknown/dynamic URLs receive a neutral shell, never the home page's canonical.
  await writeFile(resolve(root, 'spa.html'), shell)
  const privatePages = [
    '/login',
    '/register',
    '/forgot-password',
    '/verify-email',
    '/account',
    '/developer',
    '/admin',
    '/notifications'
  ].map(path => ({ path, details: {} }))
  for (const { path, details } of [...unique, ...privatePages]) {
    const dom = new JSDOM(shell)
    applySeo(routeSeo({ path }, 'fr', details), dom.window.document)
    const file = resolve(
      root,
      path === '/' ? 'index.html' : `${path.slice(1)}.html`
    )
    await mkdir(dirname(file), { recursive: true })
    await writeFile(file, dom.serialize())
    dom.window.close()
  }
  await writeFile(
    resolve(root, 'sitemap.xml'),
    sitemapXml(unique.map(page => page.path))
  )
  await writeFile(
    resolve(root, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /sanctum/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  )
  console.log(
    `SEO: ${unique.length} public URLs with HTML metadata and sitemap`
  )
}

export function seoPlugin(options = {}) {
  let outDir
  return {
    name: 'pwastore-seo',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outDir = config.build.outDir
    },
    // Vite closes before Quasar generates the service worker, keeping precache revisions correct.
    async closeBundle() {
      await generateSeo(outDir, options)
    }
  }
}
