import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  notify: vi.fn(),
  replace: vi.fn(),
  route: null
}))
vi.mock('@/boot/axios', () => ({
  api: { get: mocks.get, post: mocks.post, patch: mocks.patch }
}))
vi.mock('@/services/account', () => ({
  // Same precedence as the real helper: validation errors, then the message.
  apiMessage: error => {
    const errors = error.response?.data?.errors
    return errors
      ? Object.values(errors).flat().join(' ')
      : error.response?.data?.message || error.message || 'Erreur'
  }
}))
vi.mock('@/composables/usePlatform', async () => {
  const { ref } = await import('vue')
  return { usePlatform: () => ({ tools: ref({ growth: true }) }) }
})
vi.mock('vue-router', async () => {
  const { reactive } = await import('vue')
  mocks.route = reactive({
    path: '/developer/growth',
    params: { id: '7' },
    query: {}
  })
  return {
    useRoute: () => mocks.route,
    useRouter: () => ({ replace: mocks.replace })
  }
})
vi.mock('quasar', async load => ({
  ...(await load()),
  useQuasar: () => ({ notify: mocks.notify })
}))
import { campaignApi, growthApi } from '@/services/growth'
import {
  copyText,
  downloadBlob,
  isCampaignToken,
  badgeHtml,
  badgeMarkdown,
  badgeUrl,
  conversionHint,
  conversionLabel,
  defaultCampaignName
} from '@/utils/growth'
import { resolveToolAccess } from '@/router/guards'
import GrowthPage from '@/pages/developer/GrowthPage.vue'
import GrowthCampaignPage from '@/pages/developer/GrowthCampaignPage.vue'
import GrowthSvgAsset from '@/components/growth/GrowthSvgAsset.vue'
import GrowthBadges from '@/components/growth/GrowthBadges.vue'
import MonitorBadge from '@/components/MonitorBadge.vue'

const stats = (overrides = {}) => ({
  visits: 42,
  views: 28,
  opens: 6,
  conversion: 14.3,
  ...overrides
})
const campaign = (overrides = {}) => ({
  id: 5,
  application_id: 1,
  app: { id: 1, name: 'Alpha', icon_url: null },
  name: 'WhatsApp — octobre 2026',
  source: 'whatsapp',
  medium: null,
  token: 'AbCdEfGh12345678IjKlMn',
  url: 'https://store.test/apps/1?c=AbCdEfGh12345678IjKlMn',
  created_at: '2026-10-01T10:00:00Z',
  archived_at: null,
  stats: stats(),
  ...overrides
})
const app = (overrides = {}) => ({
  id: 1,
  name: 'Alpha',
  icon_url: null,
  category: { id: 3, name: 'Productivité' },
  public_url: 'https://store.test/apps/1',
  promotable: true,
  reason: null,
  ...overrides
})
const page = data => ({ data: { data, last_page: 1, total: data.length } })

let wrapper
const mountOptions = {
  global: {
    renderStubDefaultSlot: true,
    stubs: {
      MonitorBadge,
      EmptyState: false,
      CampaignLink: false,
      GrowthStats: false
    },
    config: { warnHandler() {} }
  }
}
let writeText
beforeEach(() => {
  vi.clearAllMocks()
  mocks.route.params.id = '7'
  mocks.route.query = {}
  writeText = vi.fn().mockResolvedValue()
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true
  })
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('growth service and helpers', () => {
  it('calls the documented endpoints', async () => {
    mocks.get.mockResolvedValue({ data: {} })
    mocks.post.mockResolvedValue({ data: {} })
    mocks.patch.mockResolvedValue({ data: {} })
    await growthApi.apps()
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/growth/apps')
    await growthApi.campaigns({ applicationId: 4, archived: true, page: 2 })
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/growth/campaigns', {
      params: { application_id: 4, archived: 1, page: 2 }
    })
    await growthApi.campaigns()
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/growth/campaigns', {
      params: { archived: 0, page: 1 }
    })
    const payload = { application_id: 4, name: 'X', source: 'x' }
    await growthApi.create(payload)
    expect(mocks.post).toHaveBeenLastCalledWith(
      '/developer/growth/campaigns',
      payload
    )
    await growthApi.show(9)
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/growth/campaigns/9')
    await growthApi.update(9, { archived: true })
    expect(mocks.patch).toHaveBeenLastCalledWith(
      '/developer/growth/campaigns/9',
      { archived: true }
    )
    const svg = expect.objectContaining({ responseType: 'text' })
    await growthApi.campaignQr(9)
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/growth/campaigns/9/qr.svg',
      svg
    )
    await growthApi.appQr(4)
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/growth/apps/4/qr.svg',
      svg
    )
    await growthApi.shareCard(4)
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/growth/apps/4/share-card.svg',
      svg
    )
    await campaignApi.visit('AbCdEfGh12345678IjKlMn')
    expect(mocks.post).toHaveBeenLastCalledWith(
      '/campaigns/AbCdEfGh12345678IjKlMn/visit'
    )
  })

  it('formats conversion honestly and suggests a dated name', () => {
    expect(conversionLabel(null)).toBe('—')
    expect(conversionLabel(undefined)).toBe('—')
    expect(conversionLabel(12.5)).toBe('12,5 %')
    expect(conversionHint(null)).toContain('10 visites')
    expect(defaultCampaignName('whatsapp', new Date(2026, 9, 15))).toBe(
      'WhatsApp — octobre 2026'
    )
    expect(defaultCampaignName('website', new Date(2026, 0, 3))).toBe(
      'Site web — janvier 2026'
    )
  })

  it('accepts only 22-character base62 campaign tokens', () => {
    expect(isCampaignToken('AbCdEfGh12345678IjKlMn')).toBe(true)
    expect(isCampaignToken('AbCdEfGh12345678IjKlM')).toBe(false)
    expect(isCampaignToken('AbCdEfGh12345678IjKlMnO')).toBe(false)
    expect(isCampaignToken('AbCdEfGh12345678IjKl-n')).toBe(false)
    expect(isCampaignToken(['AbCdEfGh12345678IjKlMn'])).toBe(false)
  })

  it('copies without the clipboard API and gives focus back', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true
    })
    document.execCommand = vi.fn(() => true)
    const button = document.createElement('button')
    document.body.appendChild(button)
    button.focus()
    expect(await copyText('https://x.test')).toBe(true)
    expect(document.execCommand).toHaveBeenCalledWith('copy')
    expect(document.activeElement).toBe(button)
    expect(document.querySelector('textarea')).toBe(null)
    button.remove()
  })

  it('keeps a download URL alive for 30 seconds', () => {
    vi.useFakeTimers()
    URL.createObjectURL = vi.fn(() => 'blob:file')
    URL.revokeObjectURL = vi.fn()
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    downloadBlob(new Blob(['x']), 'x.svg')
    expect(click).toHaveBeenCalled()
    vi.advanceTimersByTime(29000)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:file')
    vi.useRealTimers()
  })

  it('builds an absolute public badge URL with validated options', () => {
    const url = badgeUrl(4, { style: 'discover', theme: 'evil', size: 'lg' })
    expect(url).toMatch(/^https?:\/\/.+\/badges\/4\.svg\?/)
    expect(url).toContain('style=discover')
    expect(url).toContain('theme=light')
    expect(url).toContain('size=lg')
    expect(url).toContain('lang=fr')
  })

  it('escapes the app name in the HTML and Markdown snippets', () => {
    const input = {
      appId: 4,
      name: 'Ma "super" <app> & co [beta]',
      publicUrl: 'https://store.test/apps/4?x="1"',
      options: { style: 'available', lang: 'fr' }
    }
    const html = badgeHtml(input)
    expect(html).toContain(
      'alt="Ma &quot;super&quot; &lt;app&gt; &amp; co [beta] — Disponible sur PWA Store"'
    )
    expect(html).toContain('href="https://store.test/apps/4?x=&quot;1&quot;"')
    expect(html).not.toContain('<app>')
    expect(html).toMatch(/^<a href="[^"]*"><img src="[^"]*"/)
    expect(html).toContain('&amp;theme=')
    const markdown = badgeMarkdown(input)
    expect(markdown).toContain('co \\[beta\\]')
    expect(badgeMarkdown({ ...input, name: 'a_b*c`d' })).toContain(
      'a\\_b\\*c\\`d'
    )
    expect(markdown).toMatch(/\]\(https:\/\/store\.test\/apps\/4\?x="1"\)$/)
  })
})

describe('growth page', () => {
  function mockApi({ apps = [app()], campaigns = [] } = {}) {
    mocks.get.mockImplementation(url => {
      if (url === '/developer/growth/apps')
        return Promise.resolve({ data: { data: apps } })
      if (url === '/developer/growth/campaigns')
        return Promise.resolve(page(campaigns))
      return Promise.resolve({ data: '<svg></svg>' })
    })
  }
  async function render(options) {
    mockApi(options)
    wrapper = shallowMount(GrowthPage, mountOptions)
    await flushPromises()
    return wrapper.text()
  }

  it('preselects the only promotable app and disables the others with their reason', async () => {
    const text = await render({
      apps: [
        app(),
        app({
          id: 2,
          name: 'Beta',
          promotable: false,
          reason: 'Publiez d’abord cette application.'
        })
      ]
    })
    expect(wrapper.vm.selectedId).toBe(1)
    const beta = wrapper.findAll('button.app-choice')[1]
    // Still focusable so the reason can be reached; selecting it does nothing.
    expect(beta.attributes('disabled')).toBeUndefined()
    expect(beta.attributes('aria-disabled')).toBe('true')
    expect(beta.text()).toContain('Publiez d’abord cette application.')
    expect(beta.attributes('aria-describedby')).toBe('reason-2')
    expect(wrapper.find('#reason-2').text()).toBe(
      'Publiez d’abord cette application.'
    )
    await beta.trigger('click')
    expect(wrapper.vm.selectedId).toBe(1)
    expect(
      wrapper.findAll('button.app-choice')[0].attributes('aria-pressed')
    ).toBe('true')
    expect(text).not.toMatch(/installations/i)
    expect(mocks.get).toHaveBeenCalledWith('/developer/growth/campaigns', {
      params: { application_id: 1, archived: 0, page: 1 }
    })
  })

  it('waits for a choice when several apps can be promoted', async () => {
    await render({ apps: [app(), app({ id: 2, name: 'Beta' })] })
    expect(wrapper.vm.selectedId).toBe(null)
    await wrapper.findAll('button.app-choice')[1].trigger('click')
    await flushPromises()
    expect(wrapper.vm.selectedId).toBe(2)
    expect(mocks.replace).toHaveBeenCalledWith({ query: { app: '2' } })
  })

  it('creates a link, shows it and copies it in one click', async () => {
    await render()
    wrapper.vm.pickSource('linkedin')
    const name = wrapper.vm.form.name
    expect(name).toMatch(/^LinkedIn — /)
    const created = campaign({
      id: 8,
      name,
      source: 'linkedin',
      url: 'https://store.test/apps/1?c=Zz9Yy8Xx7Ww6Vv5U'
    })
    mocks.post.mockResolvedValue({ status: 201, data: { data: created } })
    await wrapper.vm.createCampaign()
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledWith('/developer/growth/campaigns', {
      application_id: 1,
      name,
      source: 'linkedin'
    })
    expect(wrapper.text()).toContain('Votre lien est prêt')
    expect(wrapper.text()).toContain(created.url)
    const copy = wrapper
      .findAll('q-btn[label="Copier le lien"]')
      .find(button => button.attributes('aria-label')?.includes(created.url))
    await copy.trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(created.url)
    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'positive',
      message: 'Lien copié.'
    })
  })

  it('shows the server message when the campaign is refused', async () => {
    await render()
    mocks.post.mockRejectedValue({
      response: {
        status: 422,
        data: { message: 'Vous avez atteint la limite de 50 liens.' }
      }
    })
    await wrapper.vm.createCampaign()
    await flushPromises()
    expect(wrapper.text()).toContain('Vous avez atteint la limite de 50 liens.')
    expect(wrapper.vm.created).toBe(null)
  })

  it('lists campaigns with exact wording and "—" when conversion is unknown', async () => {
    const text = await render({
      campaigns: [campaign({ stats: stats({ visits: 4, conversion: null }) })]
    })
    expect(text).toContain('WhatsApp — octobre 2026')
    for (const label of [
      'Visites',
      'Consultations',
      'Ouvertures (Ouvrir ou installation)',
      'Conversion'
    ])
      expect(text).toContain(label)
    expect(wrapper.find('.growth-stats').text()).toContain('—')
    // The explanation opens from a keyboard-reachable button.
    const toggle = wrapper.find('button.hint-toggle')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.growth-stats .hint').text()).toContain('10 visites')
    expect(text).toContain('Une ouverture n’est pas une preuve d’installation.')
    expect(text).toContain('une fois par jour et par appareil')
    expect(text).not.toContain('Visiteurs uniques')
  })

  it('shows the error and retries on demand', async () => {
    mocks.get.mockRejectedValueOnce(new Error('Service indisponible'))
    wrapper = shallowMount(GrowthPage, mountOptions)
    await flushPromises()
    expect(wrapper.text()).toContain('Impossible de charger vos applications.')
    mockApi()
    await wrapper.find('q-btn[label="Réessayer"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).not.toContain('Impossible de charger')
    expect(wrapper.vm.selectedId).toBe(1)
  })

  it('explains a refused app and refreshes the choices', async () => {
    await render()
    mocks.post.mockRejectedValue({ response: { status: 404 } })
    await wrapper.vm.createCampaign()
    await flushPromises()
    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'negative',
      message: 'Cette application n’est plus disponible pour la promotion.'
    })
    expect(
      mocks.get.mock.calls.filter(([url]) => url === '/developer/growth/apps')
    ).toHaveLength(2)
  })

  it('shows an empty state without any app', async () => {
    expect(await render({ apps: [] })).toContain(
      'Aucune application à promouvoir.'
    )
  })
})

describe('growth access', () => {
  it('guards both growth routes behind the growth flag', async () => {
    const { default: routes } = await import('@/router/routes')
    const developer = routes.find(r => r.path === '/developer')
    const growth = developer.children.filter(
      child => child.meta?.tool === 'growth'
    )
    expect(growth.map(child => child.path)).toEqual([
      'growth',
      'growth/campaigns/:id'
    ])
    for (const route of growth) {
      expect(resolveToolAccess(route, { tools: { growth: false } })).toBe(
        '/developer/lab'
      )
      expect(resolveToolAccess(route, { tools: {} })).toBe('/developer/lab')
      expect(resolveToolAccess(route, { tools: { growth: true } })).toBe(true)
    }
  })
})

describe('badges', () => {
  it('previews the public badge and copies an escaped snippet', async () => {
    wrapper = shallowMount(GrowthBadges, {
      ...mountOptions,
      props: {
        app: { id: 4, name: 'A "B" <C>', public_url: 'https://store.test/4' }
      }
    })
    const img = wrapper.find('.preview img')
    expect(img.attributes('src')).toContain('/badges/4.svg?style=available')
    expect(wrapper.text()).not.toContain('vérifiée »')
    await wrapper.findAll('q-btn[label="Copier"]')[0].trigger('click')
    await flushPromises()
    const copied = writeText.mock.calls[0][0]
    expect(copied).toContain('alt="A &quot;B&quot; &lt;C&gt; — ')
    expect(copied).toContain('href="https://store.test/4"')
  })
})

describe('svg assets', () => {
  let originalCreate, canvas, context, anchors
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    context = { fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: '' }
    canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      toBlob: vi.fn(callback =>
        callback(new Blob(['png'], { type: 'image/png' }))
      )
    }
    anchors = []
    originalCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag, options) => {
      if (tag === 'canvas') return canvas
      const element = originalCreate(tag, options)
      if (tag === 'a') {
        element.click = vi.fn()
        anchors.push(element)
      }
      return element
    })
    vi.stubGlobal(
      'Image',
      class {
        set src(value) {
          this._src = value
          setTimeout(() => this.onload?.())
        }
        get src() {
          return this._src
        }
      }
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('rasterizes the QR code to a 1024 px PNG', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'
    const fetch = vi.fn().mockResolvedValue({ data: svg })
    wrapper = shallowMount(GrowthSvgAsset, {
      ...mountOptions,
      props: { fetch, source: 5, alt: 'QR', filename: 'qr-alpha' }
    })
    await flushPromises()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(wrapper.find('img').attributes('src')).toBe('blob:preview')
    await wrapper.vm.downloadPng()
    expect(canvas.width).toBe(1024)
    expect(canvas.height).toBe(1024)
    expect(context.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      0,
      0,
      1024,
      1024
    )
    expect(context.drawImage.mock.calls[0][0].src).toBe(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    )
    const link = anchors.at(-1)
    expect(link.download).toBe('qr-alpha.png')
    expect(link.click).toHaveBeenCalled()
    wrapper.unmount()
    wrapper = null
    // The preview object URL does not outlive the component.
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
  })

  it('shows why an asset is refused instead of breaking', async () => {
    const reason = 'Publiez d’abord cette application.'
    wrapper = shallowMount(GrowthSvgAsset, {
      ...mountOptions,
      props: {
        // Text requests receive the 422 JSON body as a string.
        fetch: vi.fn().mockRejectedValue({
          response: {
            status: 422,
            data: JSON.stringify({ errors: { application_id: [reason] } })
          }
        }),
        source: 4,
        alt: 'Visuel',
        filename: 'visuel'
      }
    })
    await flushPromises()
    expect(wrapper.text()).toContain(reason)
    expect(wrapper.find('q-btn[label="Réessayer"]').exists()).toBe(false)
    expect(wrapper.find('q-btn[label="Télécharger PNG"]').exists()).toBe(false)
  })

  it('shows the archived-campaign refusal without any download', async () => {
    const message = 'Ce lien est archivé.'
    wrapper = shallowMount(GrowthSvgAsset, {
      ...mountOptions,
      props: {
        fetch: vi.fn().mockRejectedValue({
          response: {
            status: 422,
            data: JSON.stringify({ errors: { campaign: [message] } })
          }
        }),
        source: 5,
        alt: 'QR',
        filename: 'qr'
      }
    })
    await flushPromises()
    expect(wrapper.text()).toContain(message)
    expect(wrapper.find('q-btn[label="Télécharger SVG"]').exists()).toBe(false)
  })

  it('reports a failed PNG conversion', async () => {
    canvas.getContext = vi.fn(() => null)
    wrapper = shallowMount(GrowthSvgAsset, {
      ...mountOptions,
      props: {
        fetch: vi.fn().mockResolvedValue({ data: '<svg></svg>' }),
        source: 5,
        alt: 'QR',
        filename: 'qr'
      }
    })
    await flushPromises()
    await wrapper.vm.downloadPng()
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative' })
    )
  })
})

describe('campaign detail', () => {
  const detail = (overrides = {}) => ({
    ...campaign({ id: 7 }),
    daily: [
      { date: '2026-10-13', visits: 3, views: 2, opens: 1 },
      { date: '2026-10-14', visits: 5, views: 4, opens: 2 }
    ],
    countries: [
      { code: 'CI', visits: 6 },
      { code: 'SN', visits: 1 }
    ],
    ...overrides
  })
  async function render(data = detail()) {
    mocks.get.mockImplementation(url =>
      Promise.resolve(
        url === '/developer/growth/campaigns/7'
          ? { data: { data } }
          : { data: '<svg></svg>' }
      )
    )
    wrapper = shallowMount(GrowthCampaignPage, mountOptions)
    await flushPromises()
    return wrapper.text()
  }

  it('renders stats, declared countries and the 30-day charts', async () => {
    const text = await render()
    expect(text).toContain('WhatsApp — octobre 2026')
    expect(text).toContain('pas une géolocalisation')
    expect(text).toContain('Côte d’Ivoire')
    expect(text).toContain('6 visites')
    expect(text).toMatch(/1 visite(?!s)/)
    expect(text).toContain('Ouvertures (Ouvrir ou installation)')
    expect(
      wrapper
        .findAllComponents({ name: 'TrendChart' })
        .map(c => c.props('title'))
    ).toEqual(['Visites par jour', 'Ouvertures par jour'])
    expect(wrapper.findAll('trend-chart-stub').length).toBe(2)
  })

  it('asks for confirmation before archiving', async () => {
    await render()
    mocks.patch.mockResolvedValue({
      data: { data: campaign({ id: 7, archived_at: '2026-10-15T00:00:00Z' }) }
    })
    await wrapper.find('q-btn.toggle-archive').trigger('click')
    expect(wrapper.vm.confirmOpen).toBe(true)
    expect(mocks.patch).not.toHaveBeenCalled()
    await wrapper.find('q-btn.confirm-archive').trigger('click')
    await flushPromises()
    expect(mocks.patch).toHaveBeenCalledWith('/developer/growth/campaigns/7', {
      archived: true
    })
    expect(wrapper.vm.confirmOpen).toBe(false)
    expect(wrapper.text()).toContain('Ce lien est archivé')
    // The PATCH answer has no daily data: the charts keep the loaded one.
    expect(wrapper.vm.campaign.daily).toHaveLength(2)
    expect(wrapper.find('q-btn.toggle-archive').attributes('label')).toBe(
      'Réactiver le lien'
    )
  })

  it('keeps the dialog open with the reason when reactivation is refused', async () => {
    await render(detail({ archived_at: '2026-10-10T00:00:00Z' }))
    const message = 'Vous avez déjà 50 liens actifs.'
    mocks.patch.mockRejectedValue({
      response: { status: 422, data: { errors: { archived: [message] } } }
    })
    await wrapper.find('q-btn.toggle-archive').trigger('click')
    await wrapper.find('q-btn.confirm-archive').trigger('click')
    await flushPromises()
    expect(mocks.patch).toHaveBeenCalledWith('/developer/growth/campaigns/7', {
      archived: false
    })
    expect(wrapper.vm.confirmOpen).toBe(true)
    expect(wrapper.find('.archive-error').text()).toBe(message)
    expect(wrapper.vm.campaign.archived_at).toBe('2026-10-10T00:00:00Z')
    // An archived campaign's QR code is not even requested.
    expect(wrapper.findComponent(GrowthSvgAsset).exists()).toBe(false)
    expect(wrapper.text()).toContain('son QR code n’est plus proposé')
    expect(mocks.get).not.toHaveBeenCalledWith(
      '/developer/growth/campaigns/7/qr.svg',
      expect.anything()
    )
  })

  it('renames the link with the exact payload', async () => {
    await render()
    mocks.patch.mockResolvedValue({
      data: { data: campaign({ id: 7, name: 'Story', medium: 'story' }) }
    })
    wrapper.vm.form.name = '  Story  '
    wrapper.vm.form.medium = 'story'
    await wrapper.vm.saveDetails()
    expect(mocks.patch).toHaveBeenCalledWith('/developer/growth/campaigns/7', {
      name: 'Story',
      medium: 'story'
    })
    expect(wrapper.text()).toContain('Story')
  })

  it('ignores a late answer for the previous campaign', async () => {
    const pending = {}
    mocks.get.mockImplementation(url => {
      const match = url.match(/^\/developer\/growth\/campaigns\/(\d+)$/)
      if (!match) return Promise.resolve({ data: '<svg></svg>' })
      return new Promise(resolve => (pending[match[1]] = resolve))
    })
    wrapper = shallowMount(GrowthCampaignPage, mountOptions)
    await flushPromises()
    mocks.route.params.id = '8'
    await flushPromises()
    pending['8']({ data: { data: detail({ id: 8, name: 'Beta' }) } })
    await flushPromises()
    pending['7']({ data: { data: detail({ id: 7, name: 'Ancien' }) } })
    await flushPromises()
    expect(wrapper.vm.campaign.name).toBe('Beta')
    expect(wrapper.vm.form.name).toBe('Beta')
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.text()).not.toContain('Ancien')
  })

  it('shows a not-found state when the API answers 404', async () => {
    mocks.get.mockRejectedValue({ response: { status: 404 } })
    wrapper = shallowMount(GrowthCampaignPage, mountOptions)
    await flushPromises()
    expect(wrapper.text()).toContain('Lien introuvable.')
  })
})
