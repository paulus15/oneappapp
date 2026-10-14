import { describe, expect, it, afterEach, vi } from 'vitest'
import { applySeo, routeSeo, SITE_URL } from '@/utils/seo'
import { catalogPages, generateSeo } from '../../scripts/seo/generate.mjs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let directory
afterEach(async () => {
  document.head.innerHTML = ''
  if (directory) await rm(directory, { recursive: true, force: true })
})

describe('search metadata', () => {
  it('canonicalizes tracking links without indexing search/filter combinations', () => {
    const tracked = routeSeo({
      path: '/apps/17/',
      query: { utm_source: 'newsletter' }
    })
    expect(tracked.canonical).toBe(`${SITE_URL}/apps/17`)
    expect(tracked.noindex).toBe(false)
    expect(routeSeo({ path: '/', query: { search: 'finance' } }).noindex).toBe(
      true
    )
    expect(
      routeSeo({ path: '/applications', query: { page: '2' } }).noindex
    ).toBe(true)
  })
  it('excludes private and unknown screens, not the public developer landing page', () => {
    for (const path of [
      '/login',
      '/verify-email',
      '/account',
      '/developer/apps/1',
      '/admin',
      '/unknown'
    ]) {
      expect(routeSeo({ path }).noindex).toBe(true)
    }
    expect(routeSeo({ path: '/developers' }).noindex).toBe(false)
    expect(
      routeSeo({ path: '/apps/17' }, 'fr', { noindex: true }).noindex
    ).toBe(true)
  })
  it('replaces metadata and schema on navigation without duplicates or stale home identity', () => {
    applySeo(routeSeo({ path: '/' }))
    expect(document.title).toContain('PWAStore')
    const schema = () =>
      JSON.parse(
        document.getElementById('pwastore-structured-data').textContent
      )
    expect(schema()['@graph'][0]['@type']).toBe('WebSite')
    applySeo(
      routeSeo({ path: '/apps/17' }, 'en', {
        title: 'Useful App | PWAStore',
        name: 'Useful App',
        description: '<b>Useful</b> app'
      })
    )
    expect(document.title).toBe('Useful App | PWAStore')
    expect(document.querySelectorAll('link[rel=canonical]')).toHaveLength(1)
    expect(document.querySelectorAll('meta[name=description]')).toHaveLength(1)
    expect(document.querySelector('meta[name=description]').content).toBe(
      'Useful app'
    )
    expect(document.querySelector('meta[property="og:locale"]').content).toBe(
      'en_US'
    )
    expect(schema()['@graph'][0]['@type']).toBe('BreadcrumbList')
    applySeo(routeSeo({ path: '/login' }))
    expect(document.getElementById('pwastore-structured-data')).toBeNull()
    expect(document.querySelector('meta[name=robots]').content).toBe(
      'noindex, follow'
    )
  })
  it('treats app-supplied markup as data, including closing script tags', () => {
    applySeo(
      routeSeo({ path: '/apps/17' }, 'fr', {
        name: '</script><script>alert(1)</script>'
      })
    )
    const script = document.getElementById('pwastore-structured-data')
    expect(script.textContent).not.toContain('</script>')
    expect(
      JSON.parse(script.textContent)['@graph'][0].itemListElement[1].name
    ).toContain('</script>')
    expect(document.querySelectorAll('script')).toHaveLength(1)
  })
})

describe('build-time SEO files', () => {
  it('walks every public catalogue page and excludes drafts and unsafe paths', async () => {
    const requested = []
    const pages = await catalogPages('https://api.example/api', async url => {
      requested.push(url)
      return {
        ok: true,
        json: async () =>
          url.includes('categories')
            ? [
                { slug: 'productivity', name: 'Productivité' },
                { slug: '../../admin', name: 'Bad' }
              ]
            : {
                last_page: 2,
                data: url.endsWith('page=1')
                  ? [
                      { id: 17, name: 'Public', status: 'published' },
                      { id: 18, name: 'Draft', status: 'draft' }
                    ]
                  : [{ id: 19, name: 'Another', status: 'published' }]
              }
      }
    })
    expect(requested).toHaveLength(3)
    expect(pages.map(page => page.path)).toEqual([
      '/apps/17',
      '/apps/19',
      '/categories/productivity'
    ])
  })
  it('fails rather than publishing a silently incomplete catalogue sitemap', async () => {
    await expect(
      catalogPages('https://api.example/api', async () => ({
        ok: false,
        status: 503
      }))
    ).rejects.toThrow('503')
  })
  it.each([502, 503, 504])(
    'builds static SEO files when the catalogue returns %s, without partial entries',
    async status => {
      directory = await mkdtemp(join(tmpdir(), 'pwastore-seo-'))
      await writeFile(
        join(directory, 'index.html'),
        '<html><head><title>Store</title></head><body><div id="q-app"></div></body></html>'
      )
      const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const fetcher = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: [{ id: 17, name: 'Public', status: 'published' }],
            last_page: 2
          })
        })
        .mockResolvedValueOnce({ ok: false, status })
      await generateSeo(directory, {
        apiUrl: 'https://api.example/api',
        fetcher
      })
      const sitemap = await readFile(join(directory, 'sitemap.xml'), 'utf8')
      expect(sitemap).toContain(
        '<loc>https://pwastore.online/applications</loc>'
      )
      expect(sitemap).not.toContain('/apps/17')
      expect(await readFile(join(directory, 'spa.html'), 'utf8')).toContain(
        'q-app'
      )
      expect(await readFile(join(directory, 'login.html'), 'utf8')).toContain(
        'noindex, follow'
      )
      expect(warning).toHaveBeenCalledWith(
        expect.stringContaining(`HTTP ${status}`)
      )
    }
  )
  it.each([401, 403, 404, 500])(
    'still fails on catalogue HTTP %s',
    async status => {
      directory = await mkdtemp(join(tmpdir(), 'pwastore-seo-'))
      await writeFile(
        join(directory, 'index.html'),
        '<html><head></head><body></body></html>'
      )
      await expect(
        generateSeo(directory, {
          apiUrl: 'https://api.example/api',
          fetcher: async () => ({ ok: false, status })
        })
      ).rejects.toThrow(`HTTP ${status}`)
    }
  )
  it('still fails on malformed catalogue data', async () => {
    directory = await mkdtemp(join(tmpdir(), 'pwastore-seo-'))
    await writeFile(
      join(directory, 'index.html'),
      '<html><head></head><body></body></html>'
    )
    await expect(
      generateSeo(directory, {
        apiUrl: 'https://api.example/api',
        fetcher: async () => ({ ok: true, json: async () => ({ data: [] }) })
      })
    ).rejects.toThrow('Invalid SEO catalogue pagination')
  })
  it('writes crawlable files, route-specific HTML, private noindex and a neutral SPA fallback', async () => {
    directory = await mkdtemp(join(tmpdir(), 'pwastore-seo-'))
    await writeFile(
      join(directory, 'index.html'),
      '<!doctype html><html><head><title>Store</title></head><body><div id="q-app"></div></body></html>'
    )
    await generateSeo(directory)
    const sitemap = await readFile(join(directory, 'sitemap.xml'), 'utf8')
    expect(sitemap).toContain('<loc>https://pwastore.online/</loc>')
    expect(sitemap).toContain('<loc>https://pwastore.online/applications</loc>')
    expect(sitemap).not.toContain('/login')
    expect(sitemap).not.toContain('<lastmod>')
    expect(await readFile(join(directory, 'robots.txt'), 'utf8')).toContain(
      'Sitemap: https://pwastore.online/sitemap.xml'
    )
    expect(
      await readFile(join(directory, 'applications.html'), 'utf8')
    ).toContain('href="https://pwastore.online/applications"')
    expect(await readFile(join(directory, 'login.html'), 'utf8')).toContain(
      'noindex, follow'
    )
    expect(await readFile(join(directory, 'spa.html'), 'utf8')).not.toContain(
      'rel="canonical"'
    )
  })
})
