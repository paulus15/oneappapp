import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
  notify: vi.fn(),
  replace: vi.fn(),
  route: null
}))
vi.mock('@/boot/axios', () => ({
  api: {
    get: mocks.get,
    post: mocks.post,
    patch: mocks.patch,
    delete: mocks.del
  }
}))
vi.mock('@/services/account', () => ({
  apiMessage: error => {
    const errors = error.response?.data?.errors
    return errors
      ? Object.values(errors).flat().join(' ')
      : error.response?.data?.message || error.message || 'Erreur'
  }
}))
vi.mock('vue-router', async () => {
  const { reactive } = await import('vue')
  mocks.route = reactive({ path: '/developer/integrations', query: {} })
  return {
    useRoute: () => mocks.route,
    useRouter: () => ({ replace: mocks.replace })
  }
})
vi.mock('quasar', async load => ({
  ...(await load()),
  useQuasar: () => ({ notify: mocks.notify, screen: { lt: { sm: false } } })
}))

import { integrationsApi } from '@/services/integrations'
import {
  ABILITIES,
  DEFAULT_ABILITIES,
  integrationsPlural,
  abilityLabel,
  eventLabel,
  expiryText,
  integrationsApiBase,
  maskedToken,
  newTokenForm,
  tokenFormError,
  tokenPayload,
  tokenState,
  webhookPayload,
  webhookState,
  webhookUrlError
} from '@/utils/integrations'
import { API_BASE_URL } from '@/utils/media'
import { resolveToolAccess } from '@/router/guards'
import routes from '@/router/routes'
import IntegrationTokens from '@/components/integrations/IntegrationTokens.vue'
import IntegrationWebhooks from '@/components/integrations/IntegrationWebhooks.vue'
import WebhookDeliveries from '@/components/integrations/WebhookDeliveries.vue'
import IntegrationDocs from '@/components/integrations/IntegrationDocs.vue'
import SecretReveal from '@/components/integrations/SecretReveal.vue'
import IntegrationsPage from '@/pages/developer/IntegrationsPage.vue'

const PLAINTEXT = 'pwas_abcd1234_SuperSecretValue0123456789'
const SECRET = 'whsec_9f8e7d6c5b4a39281706f5e4d3c2b1a0'
const NOW = new Date('2026-10-15T12:00:00Z')

const token = (overrides = {}) => ({
  id: 1,
  name: 'GitHub Actions',
  prefix: 'pwas_abcd1234',
  application: null,
  abilities: ['apps:read'],
  expires_at: '2027-01-15T12:00:00Z',
  last_used_at: null,
  revoked_at: null,
  created_at: '2026-10-01T10:00:00Z',
  ...overrides
})
const hook = (overrides = {}) => ({
  id: 3,
  url: 'https://hooks.example.com/pwa',
  application: { id: 9, name: 'Alpha' },
  events: ['audit.completed', 'incident.opened'],
  active: true,
  consecutive_failures: 0,
  disabled_at: null,
  created_at: '2026-10-01T10:00:00Z',
  ...overrides
})
const delivery = (overrides = {}) => ({
  id: 11,
  event: 'audit.completed',
  event_id: 'evt_1',
  status: 'failed',
  attempts: 3,
  response_status: 500,
  last_error: '<script>alert(1)</script> timeout',
  next_attempt_at: '2026-10-15T13:00:00Z',
  delivered_at: null,
  created_at: '2026-10-15T11:00:00Z',
  ...overrides
})

const mountOptions = {
  global: {
    renderStubDefaultSlot: true,
    stubs: {
      SecretReveal: false,
      MonitorBadge: false,
      EmptyState: false,
      WebhookDeliveries: true
    },
    config: { warnHandler() {} }
  }
}

// Routes the GET mock by address.
function serve(map) {
  mocks.get.mockImplementation(url => {
    const key = Object.keys(map).find(prefix => url.startsWith(prefix))
    if (!key) return Promise.reject(new Error(`unexpected ${url}`))
    const value = map[key]
    return typeof value === 'function'
      ? value(url)
      : Promise.resolve({ data: value })
  })
}

let wrapper, writeText
beforeEach(() => {
  vi.clearAllMocks()
  mocks.route.query = {}
  localStorage.clear()
  sessionStorage.clear()
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

describe('integrations service', () => {
  it('calls the documented endpoints', async () => {
    mocks.get.mockResolvedValue({ data: {} })
    mocks.post.mockResolvedValue({ data: {} })
    mocks.patch.mockResolvedValue({ data: {} })
    mocks.del.mockResolvedValue({})
    const base = '/developer/integrations'
    await integrationsApi.apps()
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/apps')
    await integrationsApi.tokens()
    expect(mocks.get).toHaveBeenLastCalledWith(`${base}/tokens`)
    const payload = { name: 'X', abilities: ['apps:read'], expires_in_days: 30 }
    await integrationsApi.createToken(payload)
    expect(mocks.post).toHaveBeenLastCalledWith(`${base}/tokens`, payload)
    await integrationsApi.revokeToken(4)
    expect(mocks.del).toHaveBeenLastCalledWith(`${base}/tokens/4`)
    await integrationsApi.webhooks()
    expect(mocks.get).toHaveBeenLastCalledWith(`${base}/webhooks`)
    await integrationsApi.createWebhook({ url: 'https://a.example' })
    expect(mocks.post).toHaveBeenLastCalledWith(`${base}/webhooks`, {
      url: 'https://a.example'
    })
    await integrationsApi.updateWebhook(3, { active: false })
    expect(mocks.patch).toHaveBeenLastCalledWith(`${base}/webhooks/3`, {
      active: false
    })
    await integrationsApi.rotateSecret(3)
    expect(mocks.post).toHaveBeenLastCalledWith(
      `${base}/webhooks/3/rotate-secret`
    )
    await integrationsApi.ping(3)
    expect(mocks.post).toHaveBeenLastCalledWith(`${base}/webhooks/3/ping`)
    await integrationsApi.deleteWebhook(3)
    expect(mocks.del).toHaveBeenLastCalledWith(`${base}/webhooks/3`)
    await integrationsApi.deliveries(3, { status: 'failed', page: 2 })
    expect(mocks.get).toHaveBeenLastCalledWith(
      `${base}/webhooks/3/deliveries`,
      {
        params: { status: 'failed', page: 2 }
      }
    )
    await integrationsApi.deliveries(3)
    expect(mocks.get).toHaveBeenLastCalledWith(
      `${base}/webhooks/3/deliveries`,
      {
        params: { page: 1 }
      }
    )
    await integrationsApi.redeliver(3, 11)
    expect(mocks.post).toHaveBeenLastCalledWith(
      `${base}/webhooks/3/deliveries/11/redeliver`
    )
  })
})

describe('integrations helpers', () => {
  it('defaults new tokens to least privilege and builds the payload', () => {
    const form = newTokenForm()
    expect(form.abilities).toEqual(['apps:read'])
    expect(DEFAULT_ABILITIES).toEqual(['apps:read'])
    expect(form.expires_in_days).toBe(90)
    expect(tokenFormError(form)).not.toBe('')
    form.name = '  CI  '
    expect(tokenFormError(form)).toBe('')
    expect(tokenPayload(form)).toEqual({
      name: 'CI',
      abilities: ['apps:read'],
      expires_in_days: 90
    })
    form.abilities = ['versions:write', 'apps:read']
    form.application_id = '7'
    form.expires_in_days = 30
    expect(tokenPayload(form)).toEqual({
      name: 'CI',
      abilities: ['apps:read', 'versions:write'],
      expires_in_days: 30,
      application_id: 7
    })
    form.abilities = []
    expect(tokenFormError(form)).toMatch('permission')
  })

  it('labels abilities and events in French', () => {
    expect(ABILITIES).toEqual([
      'apps:read',
      'checks:read',
      'checks:write',
      'audits:read',
      'versions:write',
      'versions:read'
    ])
    expect(abilityLabel('checks:read')).toBe('Lire les vérifications')
    expect(abilityLabel('apps:read')).toBe('Lire les applications')
    expect(abilityLabel('versions:write')).toBe(
      'Soumettre des mises à jour à la modération'
    )
    expect(eventLabel('incident.opened')).toBe('Incident détecté')
    expect(eventLabel('submission.rejected')).toBe('Mise à jour refusée')
  })

  it('flags expiring, expired and revoked tokens', () => {
    expect(tokenState(token(), NOW)).toBe('active')
    expect(tokenState(token({ expires_at: '2026-10-20T12:00:00Z' }), NOW)).toBe(
      'expiring'
    )
    expect(tokenState(token({ expires_at: '2026-10-01T12:00:00Z' }), NOW)).toBe(
      'expired'
    )
    expect(tokenState(token({ revoked_at: '2026-10-02T12:00:00Z' }), NOW)).toBe(
      'revoked'
    )
    expect(expiryText(token({ expires_at: '2026-10-20T12:00:00Z' }), NOW)).toBe(
      'Expire dans 5 jours'
    )
    expect(maskedToken('pwas_abcd1234')).toBe('pwas_abcd1234…')
  })

  it('only accepts public https webhook addresses', () => {
    expect(webhookUrlError('https://hooks.example.com/pwa')).toBe('')
    expect(webhookUrlError('')).not.toBe('')
    expect(webhookUrlError('http://hooks.example.com')).toMatch('https://')
    expect(webhookUrlError('not a url')).toMatch('invalide')
    expect(webhookUrlError('https://user:pw@hooks.example.com')).not.toBe('')
    // The default port is accepted, any other one is not.
    expect(webhookUrlError('https://hooks.example.com:443/pwa')).toBe('')
    expect(webhookUrlError('https://hooks.example.com:8443/pwa')).toMatch('443')
    expect(webhookUrlError('https://hooks.example.com./pwa')).toMatch(
      'point final'
    )
    for (const local of [
      'https://localhost/x',
      'https://127.0.0.1/x',
      'https://192.168.1.4/x',
      'https://10.0.0.2/x',
      'https://8.8.8.8/x',
      'https://[2001:db8::1]/x',
      'https://intranet/x',
      'https://api.test/x',
      'https://hooks.invalid/x',
      'https://app.localhost/x',
      'https://printer.local/x'
    ])
      expect(webhookUrlError(local), local).toMatch('nom de domaine public')
  })

  it('uses three plural forms so that 0 reads as singular in French', () => {
    expect(integrationsPlural('attempts', 0)).toBe('0 tentative')
    expect(integrationsPlural('attempts', 1)).toBe('1 tentative')
    expect(integrationsPlural('attempts', 3)).toBe('3 tentatives')
    expect(integrationsPlural('days', 0)).toBe('0 jour')
    expect(integrationsPlural('failures', 0)).toBe('0 échec consécutif')
  })

  it('builds webhook payloads and states', () => {
    const form = {
      url: ' https://hooks.example.com/pwa ',
      application_id: 9,
      events: ['incident.opened', 'audit.completed']
    }
    expect(webhookPayload(form)).toEqual({
      url: 'https://hooks.example.com/pwa',
      events: ['audit.completed', 'incident.opened'],
      application_id: 9
    })
    expect(webhookPayload(form, { editing: true })).toEqual({
      url: 'https://hooks.example.com/pwa',
      events: ['audit.completed', 'incident.opened']
    })
    expect(webhookState(hook())).toBe('active')
    expect(webhookState(hook({ active: false }))).toBe('paused')
    expect(
      webhookState(hook({ active: false, disabled_at: '2026-10-10T00:00:00Z' }))
    ).toBe('failing')
  })
})

describe('access tokens', () => {
  async function mountTokens(list = [token()]) {
    serve({ '/developer/integrations/tokens': { data: list } })
    wrapper = shallowMount(IntegrationTokens, {
      ...mountOptions,
      props: { apps: [{ id: 9, name: 'Alpha' }] }
    })
    await flushPromises()
    return wrapper
  }

  it('lists tokens by prefix, scope, abilities and expiry', async () => {
    await mountTokens([
      token(),
      token({
        id: 2,
        name: 'Script',
        application: { id: 9, name: 'Alpha' },
        revoked_at: '2026-10-05T10:00:00Z'
      })
    ])
    const text = wrapper.text()
    expect(text).toContain('pwas_abcd1234…')
    expect(text).toContain('Toutes mes applications')
    expect(text).toContain('Alpha')
    expect(text).toContain('Lire les applications')
    expect(text).toContain('Jamais utilisé')
    expect(text).toContain('Révoqué')
    // Revoked tokens cannot be revoked again.
    expect(wrapper.findAll('q-btn.revoke-token')).toHaveLength(1)
  })

  it('shows an error with a retry', async () => {
    serve({
      '/developer/integrations/tokens': () =>
        Promise.reject({ response: { data: { message: 'Panne' } } })
    })
    wrapper = shallowMount(IntegrationTokens, mountOptions)
    await flushPromises()
    expect(wrapper.text()).toContain('Vos jetons n’ont pas pu être chargés.')
    serve({ '/developer/integrations/tokens': { data: [token()] } })
    await wrapper.find('q-btn').trigger('click')
    await wrapper.vm.load()
    expect(wrapper.text()).toContain('GitHub Actions')
  })

  it('creates a least-privilege token and reveals it only once', async () => {
    await mountTokens([])
    wrapper.vm.openCreate()
    expect(wrapper.vm.form.abilities).toEqual(['apps:read'])
    wrapper.vm.form.name = 'CI'
    mocks.post.mockResolvedValue({
      data: {
        data: {
          ...token({ id: 5, name: 'CI', prefix: 'pwas_abcd1234' }),
          token: PLAINTEXT
        }
      }
    })
    await wrapper.vm.createToken()
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledWith('/developer/integrations/tokens', {
      name: 'CI',
      abilities: ['apps:read'],
      expires_in_days: 90
    })
    // Shown in the reveal dialog, never in the list state.
    expect(wrapper.vm.revealOpen).toBe(true)
    expect(wrapper.vm.revealed).toBe(PLAINTEXT)
    expect(JSON.stringify(wrapper.vm.tokens)).not.toContain(PLAINTEXT)
    expect(wrapper.vm.tokens[0]).not.toHaveProperty('token')
    expect(wrapper.find('code.secret-value').text()).toBe(PLAINTEXT)
    expect(wrapper.find('.token-list').text()).not.toContain(PLAINTEXT)

    // Copy.
    await wrapper.find('q-btn.copy-secret').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(PLAINTEXT)

    // Closing needs the confirmation checkbox.
    const reveal = wrapper.findComponent(SecretReveal)
    expect(wrapper.find('q-btn.close-reveal').attributes('disable')).toBe(
      'true'
    )
    reveal.vm.close()
    expect(reveal.emitted('update:modelValue')).toBeUndefined()
    reveal.vm.confirmed = true
    await flushPromises()
    reveal.vm.close()
    expect(reveal.emitted('update:modelValue')).toEqual([[false]])
    reveal.vm.$emit('closed')
    await flushPromises()
    expect(wrapper.vm.revealed).toBe('')
    expect(wrapper.html()).not.toContain(PLAINTEXT)
    expect(JSON.stringify({ ...localStorage })).not.toContain(PLAINTEXT)
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(PLAINTEXT)
  })

  it('shows the 422 message when the cap is reached', async () => {
    await mountTokens([])
    wrapper.vm.openCreate()
    wrapper.vm.form.name = 'CI'
    mocks.post.mockRejectedValue({
      response: {
        status: 422,
        data: { errors: { name: ['Vous avez déjà 20 jetons actifs.'] } }
      }
    })
    await wrapper.vm.createToken()
    expect(wrapper.vm.formError).toBe('Vous avez déjà 20 jetons actifs.')
    expect(wrapper.vm.revealOpen).toBe(false)
    expect(wrapper.vm.revealed).toBe('')
  })

  it('disables creation at 20 active tokens', async () => {
    await mountTokens(
      Array.from({ length: 20 }, (_, i) =>
        token({ id: i + 1, expires_at: '2030-01-01T00:00:00Z' })
      )
    )
    expect(wrapper.find('q-btn.open-create-token').attributes('disable')).toBe(
      'true'
    )
    expect(wrapper.text()).toContain('Limite atteinte')
  })

  it('revokes only after confirmation', async () => {
    await mountTokens()
    mocks.del.mockResolvedValue({})
    await wrapper.find('q-btn.revoke-token').trigger('click')
    expect(wrapper.vm.revokeOpen).toBe(true)
    expect(mocks.del).not.toHaveBeenCalled()
    await wrapper.find('q-btn.confirm-revoke').trigger('click')
    await flushPromises()
    expect(mocks.del).toHaveBeenCalledWith('/developer/integrations/tokens/1')
    expect(wrapper.vm.revokeOpen).toBe(false)
    expect(wrapper.vm.tokens[0].revoked_at).toBeTruthy()
  })

  it('ignores a stale list answer', async () => {
    let resolveFirst
    serve({
      '/developer/integrations/tokens': () =>
        new Promise(resolve => (resolveFirst = resolve))
    })
    wrapper = shallowMount(IntegrationTokens, mountOptions)
    const first = resolveFirst
    serve({ '/developer/integrations/tokens': { data: [token()] } })
    await wrapper.vm.load()
    first({ data: { data: [token({ id: 8, name: 'Ancien' })] } })
    await flushPromises()
    expect(wrapper.vm.tokens.map(item => item.id)).toEqual([1])
  })
})

describe('webhooks', () => {
  async function mountHooks(list = [hook()]) {
    serve({ '/developer/integrations/webhooks': { data: list } })
    wrapper = shallowMount(IntegrationWebhooks, {
      ...mountOptions,
      props: { apps: [{ id: 9, name: 'Alpha' }] }
    })
    await flushPromises()
    return wrapper
  }

  it('lists webhooks with their state', async () => {
    await mountHooks([
      hook(),
      hook({ id: 4, active: false }),
      hook({
        id: 5,
        active: false,
        disabled_at: '2026-10-10T08:00:00Z',
        consecutive_failures: 12
      })
    ])
    const text = wrapper.text()
    expect(text).toContain('https://hooks.example.com/pwa')
    expect(text).toContain('Actif')
    expect(text).toContain('En pause')
    expect(text).toContain('Désactivé après échecs')
    expect(text).toContain('12 échecs consécutifs')
    expect(text).toContain('Audit terminé')
  })

  it('refuses a non-https address before sending', async () => {
    await mountHooks([])
    wrapper.vm.openCreate()
    wrapper.vm.form.url = 'http://hooks.example.com/pwa'
    await wrapper.vm.save()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(wrapper.vm.formError).toMatch('https://')
  })

  it('creates a webhook and reveals its secret once', async () => {
    await mountHooks([])
    wrapper.vm.openCreate()
    // Every event is pre-checked for a new webhook.
    expect(wrapper.vm.form.events).toHaveLength(5)
    wrapper.vm.form.url = 'https://hooks.example.com/pwa'
    wrapper.vm.form.application_id = 9
    wrapper.vm.form.events = ['incident.resolved', 'audit.completed']
    mocks.post.mockResolvedValue({
      data: { data: { ...hook({ id: 6 }), secret: SECRET } }
    })
    await wrapper.vm.save()
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledWith(
      '/developer/integrations/webhooks',
      {
        url: 'https://hooks.example.com/pwa',
        events: ['audit.completed', 'incident.resolved'],
        application_id: 9
      }
    )
    expect(wrapper.vm.revealOpen).toBe(true)
    expect(wrapper.find('code.secret-value').text()).toBe(SECRET)
    expect(JSON.stringify(wrapper.vm.hooks)).not.toContain(SECRET)
    wrapper.vm.clearRevealed()
    await flushPromises()
    expect(wrapper.vm.revealed).toBe('')
    expect(wrapper.html()).not.toContain(SECRET)
  })

  it('shows the 422 message for a private address or the cap', async () => {
    await mountHooks([])
    wrapper.vm.openCreate()
    wrapper.vm.form.url = 'https://hooks.example.com/pwa'
    mocks.post.mockRejectedValue({
      response: {
        status: 422,
        data: { errors: { url: ['Cette adresse n’est pas autorisée.'] } }
      }
    })
    await wrapper.vm.save()
    expect(wrapper.vm.formError).toBe('Cette adresse n’est pas autorisée.')
    expect(wrapper.vm.revealed).toBe('')
  })

  it('edits only the url and events', async () => {
    await mountHooks()
    wrapper.vm.openEdit(wrapper.vm.hooks[0])
    wrapper.vm.form.events = ['incident.opened']
    mocks.patch.mockResolvedValue({
      data: { data: hook({ events: ['incident.opened'] }) }
    })
    await wrapper.vm.save()
    expect(mocks.patch).toHaveBeenCalledWith(
      '/developer/integrations/webhooks/3',
      { url: 'https://hooks.example.com/pwa', events: ['incident.opened'] }
    )
    expect(wrapper.vm.hooks[0].events).toEqual(['incident.opened'])
  })

  it('rotates the secret after confirmation and reveals it once', async () => {
    await mountHooks()
    await wrapper.find('q-btn.rotate-hook').trigger('click')
    expect(wrapper.vm.confirmOpen).toBe(true)
    expect(mocks.post).not.toHaveBeenCalled()
    mocks.post.mockResolvedValue({ data: { data: { secret: SECRET } } })
    await wrapper.find('q-btn.confirm-action').trigger('click')
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledWith(
      '/developer/integrations/webhooks/3/rotate-secret'
    )
    expect(wrapper.vm.revealOpen).toBe(true)
    expect(wrapper.vm.revealed).toBe(SECRET)
    expect(JSON.stringify(wrapper.vm.hooks)).not.toContain(SECRET)
  })

  it('deletes after confirmation', async () => {
    await mountHooks()
    mocks.del.mockResolvedValue({})
    wrapper.vm.ask('delete', wrapper.vm.hooks[0])
    expect(mocks.del).not.toHaveBeenCalled()
    await wrapper.vm.confirm()
    expect(mocks.del).toHaveBeenCalledWith('/developer/integrations/webhooks/3')
    expect(wrapper.vm.hooks).toEqual([])
  })

  it('pings and toggles a webhook', async () => {
    await mountHooks([
      hook(),
      hook({ id: 5, active: false, disabled_at: '2026-10-10T08:00:00Z' })
    ])
    mocks.post.mockResolvedValue({ status: 202 })
    await wrapper.vm.ping(wrapper.vm.hooks[0])
    expect(mocks.post).toHaveBeenCalledWith(
      '/developer/integrations/webhooks/3/ping'
    )
    mocks.patch.mockResolvedValueOnce({
      data: { data: hook({ active: false }) }
    })
    await wrapper.vm.toggle(wrapper.vm.hooks[0])
    expect(mocks.patch).toHaveBeenLastCalledWith(
      '/developer/integrations/webhooks/3',
      { active: false }
    )
    expect(wrapper.vm.hooks[0].active).toBe(false)
    // A webhook disabled after failures is re-enabled.
    mocks.patch.mockResolvedValueOnce({ data: {} })
    await wrapper.vm.toggle(wrapper.vm.hooks[1])
    expect(mocks.patch).toHaveBeenLastCalledWith(
      '/developer/integrations/webhooks/5',
      { active: true }
    )
    expect(webhookState(wrapper.vm.hooks[1])).toBe('active')
  })

  it('labels row actions with the webhook address', async () => {
    await mountHooks()
    for (const action of [
      'open-deliveries',
      'toggle-hook',
      'edit-hook',
      'rotate-hook'
    ])
      expect(
        wrapper.find(`q-btn.${action}`).attributes('aria-label'),
        action
      ).toContain('https://hooks.example.com/pwa')
  })

  it('keeps the open deliveries drawer in step after a toggle or an edit', async () => {
    await mountHooks()
    wrapper.vm.openDeliveries(wrapper.vm.hooks[0])
    mocks.patch.mockResolvedValueOnce({
      data: { data: hook({ active: false }) }
    })
    await wrapper.vm.toggle(wrapper.vm.hooks[0])
    expect(wrapper.vm.deliveriesHook.active).toBe(false)
    wrapper.vm.openEdit(wrapper.vm.hooks[0])
    wrapper.vm.form.url = 'https://new.example.com/pwa'
    mocks.patch.mockResolvedValueOnce({
      data: {
        data: hook({ active: false, url: 'https://new.example.com/pwa' })
      }
    })
    await wrapper.vm.save()
    expect(wrapper.vm.deliveriesHook.url).toBe('https://new.example.com/pwa')
  })
})

describe('webhook deliveries', () => {
  const page = (data, lastPage = 1) => ({
    data: { data, last_page: lastPage, total: data.length }
  })

  it('lists deliveries, filters by status and redelivers', async () => {
    mocks.get.mockResolvedValue(page([delivery()], 2))
    wrapper = shallowMount(WebhookDeliveries, {
      ...mountOptions,
      props: { modelValue: true, webhook: hook() }
    })
    await flushPromises()
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/integrations/webhooks/3/deliveries',
      { params: { page: 1 } }
    )
    const text = wrapper.text()
    expect(text).toContain('Audit terminé')
    expect(text).toContain('Échouée')
    expect(text).toContain('3 tentatives')
    expect(text).toContain('HTTP 500')
    // The server error is plain text, never markup.
    expect(wrapper.find('.last-error pre').text()).toBe(
      '<script>alert(1)</script> timeout'
    )
    expect(wrapper.find('.last-error script').exists()).toBe(false)

    // Next page.
    mocks.get.mockResolvedValue(page([delivery({ id: 12 })], 2))
    await wrapper.vm.list.loadMore()
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/integrations/webhooks/3/deliveries',
      { params: { page: 2 } }
    )
    expect(wrapper.vm.list.items.value).toHaveLength(2)

    // Status filter.
    mocks.get.mockResolvedValue(page([delivery()]))
    wrapper.vm.status = 'failed'
    await flushPromises()
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/integrations/webhooks/3/deliveries',
      { params: { status: 'failed', page: 1 } }
    )

    mocks.post.mockResolvedValue({ status: 202 })
    await wrapper.find('q-btn.redeliver').trigger('click')
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledWith(
      '/developer/integrations/webhooks/3/deliveries/11/redeliver'
    )
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'positive' })
    )
  })

  it('shows the 409 message when a redelivery is refused', async () => {
    mocks.get.mockResolvedValue(page([delivery()]))
    wrapper = shallowMount(WebhookDeliveries, {
      ...mountOptions,
      props: { modelValue: true, webhook: hook() }
    })
    await flushPromises()
    mocks.post.mockRejectedValue({
      response: {
        status: 409,
        data: {
          message: 'Ce webhook est désactivé : réactivez-le avant de le tester.'
        }
      }
    })
    await wrapper.vm.redeliver(delivery())
    await flushPromises()
    expect(wrapper.find('.action-error').text()).toBe(
      'Ce webhook est désactivé : réactivez-le avant de le tester.'
    )
    // Shown once, inline only.
    expect(mocks.notify).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative' })
    )
  })

  it('does not load while closed', async () => {
    wrapper = shallowMount(WebhookDeliveries, {
      ...mountOptions,
      props: { modelValue: false, webhook: hook() }
    })
    await flushPromises()
    expect(mocks.get).not.toHaveBeenCalled()
  })
})

describe('integrations documentation', () => {
  it('renders snippets as text and uses the API base', async () => {
    wrapper = shallowMount(IntegrationDocs, mountOptions)
    const base = integrationsApiBase(API_BASE_URL)
    expect(base).toBe(`${API_BASE_URL.replace(/\/$/, '')}/integrations/v1`)
    expect(wrapper.find('code.api-base').text()).toBe(base)
    const codes = wrapper.findAll('pre code').map(code => code.text())
    expect(codes.some(code => code.includes(`curl -s ${base}/apps`))).toBe(true)
    expect(
      codes.some(
        code => code.includes('X-PWAStore') || code.includes('createHmac')
      )
    ).toBe(true)
    expect(codes.some(code => code.startsWith('<?php'))).toBe(true)
    expect(codes.some(code => code.includes('hmac.compare_digest'))).toBe(true)
    const action = wrapper.vm.githubSnippet
    expect(action).toContain('uses: <votre-organisation>/pwastore-action@v1')
    expect(action).toContain('à adapter')
    expect(action).toContain('integrations/github-action')
    for (const input of [
      'token: ${{ secrets.PWASTORE_TOKEN }}',
      'application-id: 42',
      'mode: submit',
      'wait: "true"',
      'timeout-minutes: "10"',
      'api-url: ',
      'https://api.pwastore.online/api/integrations/v1'
    ])
      expect(action, input).toContain(input)
    for (const removed of ['note:', 'command:', 'app-id:'])
      expect(action, removed).not.toContain(removed)
    // Submissions take no body; checks answer 202 and are limited per app.
    const submit = wrapper.vm.endpoints.find(item => item.key === 'submit')
    expect(submit.curl).toContain(`-X POST ${base}/apps/42/submissions`)
    expect(submit.curl).not.toContain('-d ')
    expect(submit.response).toContain('"request_id": 7')
    const check = wrapper.vm.endpoints.find(item => item.key === 'check')
    expect(check.response).toContain('"status": "queued"')
    expect(check.note).toContain('5 minutes')
    expect(
      wrapper.vm.endpoints.find(item => item.key === 'check-latest').ability
    ).toBe('checks:read | checks:write')
    const status = wrapper.vm.endpoints.find(
      item => item.key === 'check-status'
    )
    expect(status.path).toBe('/apps/{id}/checks/{requestId}')
    expect(status.ability).toBe('checks:read | checks:write')
    for (const value of ['queued', 'skipped', 'done'])
      expect(status.note).toContain(value)
    expect(status.curl).toContain(
      `${base}/apps/42/checks/9b2f6c1e-4d7a-4c3b-8e21-5f0a7d9c3b64`
    )
    expect(submit.note).toContain('5 demandes par minute')
    // Real payload keys (WebhookDispatcher / IntegrationReport).
    const audit = JSON.parse(
      wrapper.vm.payloadSnippets.find(item => item.event === 'audit.completed')
        .code
    )
    expect(audit.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(Object.keys(audit.data.audit).sort()).toEqual(
      [
        'created_at',
        'final_url',
        'id',
        'installable',
        'reachable',
        'score',
        'summary',
        'url'
      ].sort()
    )
    expect(Object.keys(audit.data.audit.summary)).toEqual([
      'by_status',
      'by_severity'
    ])
    const rejected = JSON.parse(
      wrapper.vm.payloadSnippets.find(
        item => item.event === 'submission.rejected'
      ).code
    )
    expect(rejected.data.submission.decision).toBe('changes_requested')
    // Signature snippets refuse missing or malformed headers.
    const [node, php, python] = wrapper.vm.signatureSnippets.map(
      item => item.code
    )
    expect(node).toContain("typeof header !== 'string'")
    expect(php).toContain('ctype_digit($t)')
    expect(python).toContain('if not header:')
    expect(python).toContain('t.isdigit()')
    const text = wrapper.text()
    expect(text).toContain('1 min, 5 min, 30 min, 2 h puis 6 h')
    expect(text).toContain('15 tentatives échouées')
    expect(text).toContain('changes_requested')
    expect(text).toContain('X-PWAStore-Delivery')
    expect(text).toContain('volontairement la même')
    expect(text).toContain('limités par adresse IP')
    expect(text).toContain('pas de période de chevauchement')
    expect(text).toContain('préfixe whsec_ compris')
    expect(text).toContain('checks:read suffit pour lire les résultats')
    expect(wrapper.find('.action-abilities').text()).toBe(
      'Permissions du jeton : checks:write ; en mode submit, ajoutez versions:write et versions:read. Pour seulement lire les résultats, checks:read suffit.'
    )
    expect(
      codes.some(code => code.includes('${{ secrets.PWASTORE_TOKEN }}'))
    ).toBe(true)
    // Text, not markup: the PHP opening tag is escaped in the HTML.
    expect(wrapper.html()).toContain('&lt;?php')
    expect(wrapper.text()).toContain('Rien n’est publié automatiquement.')
    for (const file of [
      'src/components/integrations/IntegrationDocs.vue',
      'src/components/integrations/WebhookDeliveries.vue',
      'src/components/integrations/SecretReveal.vue'
    ])
      expect(readFileSync(file, 'utf8')).not.toContain('v-html')
  })
})

describe('integrations page and access', () => {
  it('opens the tab named in the address and loads the apps once', async () => {
    mocks.route.query = { tab: 'docs' }
    serve({ '/developer/apps': { data: [{ id: 9, name: 'Alpha' }] } })
    wrapper = shallowMount(IntegrationsPage, {
      global: { renderStubDefaultSlot: true, config: { warnHandler() {} } }
    })
    await flushPromises()
    expect(wrapper.vm.tab).toBe('docs')
    expect(wrapper.vm.apps).toEqual([{ id: 9, name: 'Alpha' }])
    wrapper.vm.tab = 'webhooks'
    await flushPromises()
    expect(mocks.replace).toHaveBeenCalledWith({ query: { tab: 'webhooks' } })
  })

  it('redirects away when the integrations tool is off', () => {
    const developer = routes.find(route => route.path === '/developer')
    const route = developer.children.find(item => item.path === 'integrations')
    expect(route.meta).toMatchObject({
      requiresAuth: true,
      developerOnly: true,
      tool: 'integrations'
    })
    const to = { meta: route.meta }
    expect(resolveToolAccess(to, { tools: { integrations: false } })).toBe(
      '/developer/lab'
    )
    expect(resolveToolAccess(to, { tools: {} })).toBe('/developer/lab')
    expect(resolveToolAccess(to, { tools: { integrations: true } })).toBe(true)
  })
})
