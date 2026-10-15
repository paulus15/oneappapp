import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  notify: vi.fn(),
  route: null
}))
vi.mock('@/boot/axios', () => ({
  api: { get: mocks.get, post: mocks.post, patch: mocks.patch }
}))
vi.mock('@/services/account', () => ({
  apiMessage: error => {
    const errors = error.response?.data?.errors
    return errors
      ? Object.values(errors).flat().join(' ')
      : error.response?.data?.message || error.message || 'Erreur'
  }
}))
vi.mock('@/composables/usePlatform', async () => {
  const { ref } = await import('vue')
  return { usePlatform: () => ({ tools: ref({ feedback_hub: true }) }) }
})
vi.mock('vue-router', async () => {
  const { reactive } = await import('vue')
  mocks.route = reactive({
    path: '/developer/feedback/7',
    params: { id: '7' },
    query: {}
  })
  return { useRoute: () => mocks.route, useRouter: () => ({}) }
})
vi.mock('quasar', async load => ({
  ...(await load()),
  useQuasar: () => ({ notify: mocks.notify })
}))
import { feedbackApi } from '@/services/feedback'
import {
  SUGGESTION_STATUS_COLORS,
  SUGGESTION_STATUS_LABELS
} from '@/services/suggestions'
import { SUGGESTION_STATUSES } from '@/utils/suggestions'
import {
  BULK_MAX,
  DEFAULT_FILTERS,
  bulkPayload,
  bulkResultMessage,
  feedbackListParams,
  formatResolution,
  historyActor,
  historyNote,
  historyText,
  resolutionHint,
  triageChanges
} from '@/utils/feedback'
import { resolveLegacySuggestions, resolveToolAccess } from '@/router/guards'
import FeedbackPage from '@/pages/developer/FeedbackPage.vue'
import FeedbackDetailPage from '@/pages/developer/FeedbackDetailPage.vue'
import SuggestionDetail from '@/components/SuggestionDetail.vue'
import MySuggestions from '@/components/MySuggestions.vue'

const summary = (overrides = {}) => ({
  received: 12,
  pending: 5,
  planned: 2,
  in_progress: 3,
  resolved: 1,
  declined: 1,
  avg_resolution_hours: 52,
  period_days: 90,
  by_status: {
    new: 3,
    read: 2,
    planned: 2,
    in_progress: 3,
    done: 1,
    declined: 1
  },
  by_topic: { none: 12 },
  by_priority: { none: 12 },
  ...overrides
})
const item = (overrides = {}) => ({
  id: 1,
  application: { id: 4, name: 'Alpha', icon_url: null },
  title: 'Mode sombre',
  excerpt: 'Ajouter un mode sombre.',
  status: 'new',
  priority: null,
  topic: null,
  version: null,
  duplicate_of_id: null,
  duplicates_count: 0,
  attachments_count: 0,
  author: { name: 'Awa' },
  created_at: '2026-10-10T10:00:00Z',
  status_changed_at: null,
  replied_at: null,
  ...overrides
})
const detail = (overrides = {}) => ({
  ...item({ id: 7 }),
  body: '<p>Bonjour <img src=x onerror="alert(1)"><script>alert(2)</script></p>',
  attachments: [],
  developer_reply: null,
  duplicate_of: null,
  duplicates: [],
  history: [],
  ...overrides
})
const page = (data, total = data.length, lastPage = 1) => ({
  data: { data, last_page: lastPage, total }
})

let wrapper
const mountOptions = {
  global: {
    renderStubDefaultSlot: true,
    stubs: { EmptyState: false, SuggestionDetail: false },
    config: { warnHandler() {} }
  }
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.route.params.id = '7'
  mocks.route.query = {}
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.useRealTimers()
})

describe('feedback service and helpers', () => {
  it('calls the documented endpoints', async () => {
    mocks.get.mockResolvedValue({ data: {} })
    mocks.post.mockResolvedValue({ data: {} })
    mocks.patch.mockResolvedValue({ data: {} })
    await feedbackApi.summary({ applicationId: 4, period: 90 })
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/feedback/summary', {
      params: { application_id: 4, period: 90 }
    })
    await feedbackApi.summary()
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/feedback/summary', {
      params: { period: 90 }
    })
    await feedbackApi.list({ page: 2 })
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/feedback/suggestions',
      { params: { page: 2 } }
    )
    await feedbackApi.show(9)
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/feedback/suggestions/9'
    )
    await feedbackApi.similar(9)
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/feedback/suggestions/9/similar'
    )
    await feedbackApi.update(9, { status: 'planned' })
    expect(mocks.patch).toHaveBeenLastCalledWith(
      '/developer/feedback/suggestions/9',
      { status: 'planned' }
    )
    await feedbackApi.bulk({ ids: [1], topic: 'bug' })
    expect(mocks.post).toHaveBeenLastCalledWith('/developer/feedback/bulk', {
      ids: [1],
      topic: 'bug'
    })
  })

  it('builds list parameters from the filters only', () => {
    expect(feedbackListParams(DEFAULT_FILTERS)).toEqual({
      duplicates: 'hide',
      sort: 'newest',
      page: 1
    })
    expect(
      feedbackListParams(
        {
          status: 'in_progress',
          priority: 'none',
          topic: 'bug',
          q: '  sombre ',
          duplicates: 'only',
          sort: 'priority'
        },
        { applicationId: 4, page: 3 }
      )
    ).toEqual({
      application_id: 4,
      status: 'in_progress',
      priority: 'none',
      topic: 'bug',
      q: 'sombre',
      duplicates: 'only',
      sort: 'priority',
      page: 3
    })
  })

  it('formats the average resolution time and explains a missing one', () => {
    expect(formatResolution(null)).toBe('—')
    expect(formatResolution(undefined)).toBe('—')
    expect(resolutionHint(null)).toContain(
      'Pas encore assez de retours résolus'
    )
    expect(formatResolution(52)).toBe('2 j 4 h')
    expect(formatResolution(48)).toBe('2 j')
    expect(formatResolution(5.4)).toBe('5 h')
    expect(formatResolution(0.25)).toBe('15 min')
  })

  it('caps the bulk payload at 50 ids with exactly one field', () => {
    const ids = Array.from({ length: BULK_MAX }, (_, i) => i + 1)
    expect(bulkPayload(ids, 'status', 'planned')).toEqual({
      ids,
      status: 'planned'
    })
    expect(bulkPayload([...ids, 51], 'status', 'planned')).toBe(null)
    expect(bulkPayload([1], 'priority', 'none')).toEqual({
      ids: [1],
      priority: null
    })
    expect(bulkPayload([1], 'status', 'none')).toBe(null)
    expect(bulkPayload([1], 'version', '2')).toBe(null)
    expect(bulkPayload([], 'topic', 'bug')).toBe(null)
  })

  it('words the bulk result from the selected feedbacks that changed', () => {
    expect(bulkResultMessage(3, { updated: 3, selected_updated: 3 })).toBe(
      '3 retours modifiés.'
    )
    expect(bulkResultMessage(5, { updated: 2, selected_updated: 1 })).toBe(
      '1 retour modifié (+1 doublon mis à jour). 4 avaient déjà cette valeur.'
    )
    expect(bulkResultMessage(2, { updated: 0, selected_updated: 0 })).toBe(
      'Aucun retour modifié : ils avaient déjà cette valeur.'
    )
  })

  it('sends only the changed triage fields', () => {
    const current = detail({ priority: 'high', version: '1.0' })
    expect(
      triageChanges(current, {
        status: 'new',
        priority: 'high',
        topic: null,
        version: '1.0'
      })
    ).toEqual({})
    expect(
      triageChanges(current, {
        status: 'planned',
        priority: null,
        topic: 'ux',
        version: ' 2.1 '
      })
    ).toEqual({
      status: 'planned',
      priority: null,
      topic: 'ux',
      version: '2.1'
    })
    expect(triageChanges(current, { ...current, version: '' })).toEqual({
      version: null
    })
  })

  it('writes the history in plain words', () => {
    expect(historyText({ field: 'status', from: 'read', to: 'planned' })).toBe(
      'Statut : À étudier → Planifié'
    )
    expect(historyText({ field: 'priority', from: null, to: 'urgent' })).toBe(
      'Priorité : — → Urgente'
    )
    expect(historyText({ field: 'topic', from: 'bug', to: 'ux' })).toBe(
      'Thème : Bug → Ergonomie'
    )
    expect(historyText({ field: 'version', from: null, to: '2.0' })).toBe(
      'Version : — → 2.0'
    )
    expect(historyText({ field: 'duplicate_of', from: null, to: '12' })).toBe(
      'Marqué comme doublon du retour n° 12'
    )
    expect(
      historyText({ field: 'duplicate_of', from: '12', to: null })
    ).toContain('N’est plus marqué comme doublon')
    expect(historyText({ field: 'reply', from: null, to: 'updated' })).toBe(
      'Réponse privée envoyée à l’auteur'
    )
    expect(historyText({ field: 'reply', from: null, to: 'removed' })).toBe(
      'Réponse privée supprimée'
    )
    const read = {
      actor: null,
      actor_role: 'system',
      field: 'status',
      from: 'new',
      to: 'read'
    }
    expect(historyActor(read)).toBe('Automatique')
    expect(historyNote(read)).toBe('À l’ouverture du retour')
    expect(
      historyActor({ actor: { name: 'Kofi' }, actor_role: 'developer' })
    ).toBe('Kofi (Développeur)')
    expect(historyActor({ actor: null, actor_role: 'platform' })).toBe(
      'Équipe PWA Store'
    )
  })
})

describe('in_progress status everywhere', () => {
  it('adds in_progress to the shared maps without dropping the others', () => {
    expect(SUGGESTION_STATUSES).toEqual([
      'new',
      'read',
      'planned',
      'in_progress',
      'done',
      'declined'
    ])
    for (const status of SUGGESTION_STATUSES) {
      expect(SUGGESTION_STATUS_LABELS[status]).toBeTruthy()
      expect(SUGGESTION_STATUS_COLORS[status]).toBeTruthy()
    }
    expect(SUGGESTION_STATUS_LABELS.in_progress).toBe('En cours')
    expect(SUGGESTION_STATUS_LABELS.planned).toBe('Prévue')
  })

  it('shows "En cours" to the author', async () => {
    mocks.get.mockResolvedValue(
      page([{ ...item(), status: 'in_progress', developer_reply: null }])
    )
    wrapper = shallowMount(MySuggestions, {
      global: {
        ...mountOptions.global,
        stubs: {
          ...mountOptions.global.stubs,
          QExpansionItem: {
            template: '<div><slot name="header" /><slot /></div>'
          }
        }
      }
    })
    await flushPromises()
    const badge = wrapper.find('q-badge')
    expect(badge.attributes('label')).toBe('En cours')
    expect(badge.attributes('color')).toBe('teal-7')
  })
})

describe('feedback page', () => {
  function mockApi({ items = [item()], summaryData = summary(), total } = {}) {
    mocks.get.mockImplementation(url => {
      if (url === '/developer/apps')
        return Promise.resolve({ data: [{ id: 4, name: 'Alpha' }] })
      if (url === '/developer/feedback/summary')
        return Promise.resolve({ data: { data: summaryData } })
      if (url === '/developer/feedback/suggestions')
        return Promise.resolve(page(items, total ?? items.length))
      return Promise.reject(new Error(`unexpected ${url}`))
    })
  }
  async function render(options) {
    mockApi(options)
    wrapper = shallowMount(FeedbackPage, mountOptions)
    await flushPromises()
    return wrapper.text()
  }
  const listCalls = () =>
    mocks.get.mock.calls.filter(
      ([url]) => url === '/developer/feedback/suggestions'
    )

  it('shows the KPIs, the privacy wording and "—" for an unknown average', async () => {
    const text = await render({
      summaryData: summary({ avg_resolution_hours: null })
    })
    for (const label of [
      'Retours reçus',
      'En attente',
      'En cours',
      'Résolus',
      'Temps moyen de traitement'
    ])
      expect(text).toContain(label)
    expect(wrapper.find('.kpi-average').text()).toBe('—')
    expect(text).toContain('Pas encore assez de retours résolus')
    expect(text).toContain('jamais publiés automatiquement')
    expect(text).toContain('reçus pendant les 90 derniers jours')
    expect(mocks.get).toHaveBeenCalledWith('/developer/feedback/summary', {
      params: { period: 90 }
    })
    // Status chips carry the counts of by_status.
    const planned = wrapper.find('button[data-status="in_progress"]')
    expect(planned.text()).toContain('En cours')
    expect(planned.text()).toContain('3')
  })

  it('formats a known average and reloads the summary with the period', async () => {
    await render()
    expect(wrapper.find('.kpi-average').text()).toBe('2 j 4 h')
    const button = wrapper.findAll('button.period')[2]
    await button.trigger('click')
    await flushPromises()
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/feedback/summary', {
      params: { period: 365 }
    })
    expect(button.attributes('aria-pressed')).toBe('true')
  })

  it('lists items with their chips, author, attachments and duplicates', async () => {
    const text = await render({
      items: [
        item({
          priority: 'urgent',
          topic: 'bug',
          duplicates_count: 3,
          attachments_count: 2
        }),
        item({ id: 2, title: 'Autre', author: null, duplicates_count: 1 })
      ]
    })
    expect(text).toContain('Mode sombre')
    expect(text).toContain('Nouveau')
    expect(text).toContain('Urgente')
    expect(text).toContain('Bug')
    expect(text).toContain('Awa')
    expect(text).toContain('Compte supprimé')
    expect(text).toContain('2 fichiers joints')
    expect(text).toContain('3 doublons')
    expect(text).toMatch(/1 doublon(?!s)/)
    expect(text).toContain('Ajouter un mode sombre.')
  })

  it('turns the filters into query parameters', async () => {
    await render()
    expect(listCalls()[0][1]).toEqual({
      params: { duplicates: 'hide', sort: 'newest', page: 1 }
    })
    await wrapper.find('button[data-status="planned"]').trigger('click')
    wrapper.vm.filters.priority = 'none'
    wrapper.vm.filters.topic = 'ux'
    wrapper.vm.filters.duplicates = 'all'
    wrapper.vm.filters.sort = 'group'
    wrapper.vm.applicationId = 4
    await flushPromises()
    expect(listCalls().at(-1)[1]).toEqual({
      params: {
        application_id: 4,
        status: 'planned',
        priority: 'none',
        topic: 'ux',
        duplicates: 'all',
        sort: 'group',
        page: 1
      }
    })
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/feedback/summary', {
      params: { application_id: 4, period: 90 }
    })
  })

  it('debounces the search', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    await render()
    const before = listCalls().length
    wrapper.vm.searchInput = 'som'
    await flushPromises()
    vi.advanceTimersByTime(200)
    wrapper.vm.searchInput = 'sombre'
    await flushPromises()
    vi.advanceTimersByTime(399)
    await flushPromises()
    expect(listCalls()).toHaveLength(before)
    vi.advanceTimersByTime(1)
    await flushPromises()
    expect(listCalls()).toHaveLength(before + 1)
    expect(listCalls().at(-1)[1].params.q).toBe('sombre')
  })

  it('distinguishes no feedback, no match and a failure', async () => {
    expect(await render({ items: [] })).toContain(
      'Aucun retour pour le moment.'
    )
    wrapper.unmount()
    await render({ items: [] })
    wrapper.vm.filters.topic = 'bug'
    await flushPromises()
    expect(wrapper.text()).toContain(
      'Aucun retour ne correspond à ces filtres.'
    )
    await wrapper.find('q-btn.reset-filters').trigger('click')
    await flushPromises()
    expect(wrapper.vm.filters.topic).toBe(null)
    expect(wrapper.text()).toContain('Aucun retour pour le moment.')
    wrapper.unmount()

    mockApi()
    mocks.get.mockImplementation(url =>
      url === '/developer/feedback/suggestions'
        ? Promise.reject(new Error('Service indisponible'))
        : Promise.resolve({ data: { data: summary() } })
    )
    wrapper = shallowMount(FeedbackPage, mountOptions)
    await flushPromises()
    expect(wrapper.text()).toContain('Les retours n’ont pas pu être chargés.')
    mockApi()
    await wrapper.find('q-btn.retry-list').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Mode sombre')
  })

  it('caps the selection at 50 and sends the bulk payload after confirmation', async () => {
    const many = Array.from({ length: 55 }, (_, i) =>
      item({ id: i + 1, title: `Retour ${i + 1}` })
    )
    await render({ items: many })
    await wrapper.find('.select-all input').trigger('change')
    expect(wrapper.vm.selection).toHaveLength(BULK_MAX)
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'warning' })
    )
    // One more is refused.
    wrapper.vm.toggle(55)
    expect(wrapper.vm.selection).toHaveLength(BULK_MAX)
    expect(wrapper.text()).toContain('50 retours sélectionnés')

    wrapper.vm.bulkField = 'status'
    await flushPromises()
    wrapper.vm.bulkValue = 'in_progress'
    await flushPromises()
    await wrapper.find('q-btn.bulk-apply').trigger('click')
    expect(wrapper.vm.confirmOpen).toBe(true)
    expect(wrapper.find('.confirm-text').text()).toBe(
      'Appliquer « Statut : En cours » aux 50 retours sélectionnés ?'
    )
    expect(mocks.post).not.toHaveBeenCalled()
    mocks.post.mockResolvedValue({
      data: { data: { updated: 51, selected_updated: 48 } }
    })
    await wrapper.find('q-btn.confirm-bulk').trigger('click')
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledWith('/developer/feedback/bulk', {
      ids: many.slice(0, 50).map(entry => entry.id),
      status: 'in_progress'
    })
    expect(mocks.notify).toHaveBeenLastCalledWith({
      type: 'positive',
      message:
        '48 retours modifiés (+3 doublons mis à jour). 2 avaient déjà cette valeur.'
    })
    expect(wrapper.vm.selection).toEqual([])
  })

  it('refreshes the list when a selected feedback is gone', async () => {
    await render({ items: [item(), item({ id: 2 })] })
    wrapper.vm.toggle(1)
    wrapper.vm.bulkValue = 'done'
    await flushPromises()
    // One of two rows selected: the "select all" box is mixed.
    expect(wrapper.find('.select-all input').element.indeterminate).toBe(true)
    wrapper.vm.openConfirm()
    const before = listCalls().length
    mocks.post.mockRejectedValue({
      response: { status: 404, data: { message: 'Not Found' } }
    })
    await wrapper.vm.runBulk()
    await flushPromises()
    expect(wrapper.vm.confirmOpen).toBe(false)
    expect(wrapper.vm.selection).toEqual([])
    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'warning',
      message:
        'Certains retours ne sont plus disponibles. La liste a été actualisée.'
    })
    expect(listCalls()).toHaveLength(before + 1)
    expect(wrapper.text()).not.toContain('Not Found')
  })

  it('clears a topic in bulk and shows a refusal in the dialog', async () => {
    await render({ items: [item(), item({ id: 2 })] })
    wrapper.vm.toggle(2)
    wrapper.vm.bulkField = 'topic'
    await flushPromises()
    wrapper.vm.bulkValue = 'none'
    await flushPromises()
    wrapper.vm.openConfirm()
    mocks.post.mockRejectedValue({
      response: {
        status: 422,
        data: { errors: { field: ['Indiquez un seul champ.'] } }
      }
    })
    await wrapper.vm.runBulk()
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledWith('/developer/feedback/bulk', {
      ids: [2],
      topic: null
    })
    expect(wrapper.vm.confirmOpen).toBe(true)
    expect(wrapper.text()).toContain('Indiquez un seul champ.')
  })

  it('ignores a late summary for a previous application', async () => {
    mockApi()
    const pending = []
    mocks.get.mockImplementation(url => {
      if (url === '/developer/feedback/summary')
        return new Promise(resolve => pending.push(resolve))
      if (url === '/developer/feedback/suggestions')
        return Promise.resolve(page([item()]))
      return Promise.resolve({ data: [] })
    })
    wrapper = shallowMount(FeedbackPage, mountOptions)
    await flushPromises()
    wrapper.vm.applicationId = 4
    await flushPromises()
    pending[1]({ data: { data: summary({ received: 2 }) } })
    await flushPromises()
    pending[0]({ data: { data: summary({ received: 99 }) } })
    await flushPromises()
    expect(wrapper.vm.summary.received).toBe(2)
  })
})

describe('feedback detail', () => {
  function mockDetail(data = detail(), similar = []) {
    mocks.get.mockImplementation(url => {
      if (url === '/developer/feedback/suggestions/7')
        return Promise.resolve({ data: { data } })
      if (url === '/developer/feedback/suggestions/7/similar')
        return Promise.resolve({ data: { data: similar } })
      return Promise.reject(new Error(`unexpected ${url}`))
    })
  }
  async function render(data, similar) {
    mockDetail(data, similar)
    wrapper = shallowMount(FeedbackDetailPage, mountOptions)
    await flushPromises()
    return wrapper.text()
  }

  it('renders the body through the existing sanitizer only', async () => {
    const text = await render()
    expect(text).toContain('Mode sombre')
    expect(text).toContain('Alpha')
    expect(text).toContain('Par Awa')
    const body = wrapper.find('.suggestion-body')
    expect(body.html()).toContain('Bonjour')
    expect(body.html()).not.toContain('<script')
    expect(body.html()).not.toContain('onerror')
    expect(body.html()).not.toContain('<img')
    // No other v-html in the Feedback Hub pages.
    for (const file of [
      'src/pages/developer/FeedbackPage.vue',
      'src/pages/developer/FeedbackDetailPage.vue'
    ])
      expect(readFileSync(file, 'utf8')).not.toContain('v-html')
    expect(
      wrapper.findComponent(SuggestionDetail).props('suggestion')
    ).toMatchObject({ id: 7, developer_reply: null })
  })

  it('labels the private reply and sends it alone', async () => {
    const text = await render(detail({ developer_reply: 'Merci !' }))
    expect(text).toContain('Réponse privée — visible uniquement par l’auteur')
    expect(wrapper.vm.reply).toBe('Merci !')
    mocks.patch.mockResolvedValue({
      data: { data: detail({ developer_reply: 'C’est prévu.' }) }
    })
    wrapper.vm.reply = '  C’est prévu. '
    await wrapper.vm.saveReply()
    expect(mocks.patch).toHaveBeenCalledWith(
      '/developer/feedback/suggestions/7',
      { reply: 'C’est prévu.' }
    )
    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'positive',
      message: 'Réponse enregistrée. L’auteur est prévenu.'
    })
  })

  it('saves only the changed triage fields', async () => {
    await render(detail({ priority: 'low' }))
    mocks.patch.mockResolvedValue({
      data: {
        data: detail({ status: 'planned', priority: null, version: '2.1' })
      }
    })
    wrapper.vm.form.status = 'planned'
    wrapper.vm.form.priority = null
    wrapper.vm.form.version = '2.1'
    await wrapper.vm.saveTriage()
    expect(mocks.patch).toHaveBeenCalledWith(
      '/developer/feedback/suggestions/7',
      { status: 'planned', priority: null, version: '2.1' }
    )
    expect(wrapper.text()).toContain('Planifié')
    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'positive',
      message: 'Tri enregistré.'
    })
  })

  it('marks a similar suggestion as primary from the PATCH answer, keeping unsaved edits', async () => {
    await render(detail({ developer_reply: 'Ancienne' }), [
      { id: 3, title: 'Thème sombre', status: 'planned', score: 0.72 }
    ])
    expect(wrapper.text()).toContain('Thème sombre')
    expect(wrapper.text()).toContain('Ressemblance : 72 %')
    // Unsaved work on the page.
    wrapper.vm.form.priority = 'high'
    wrapper.vm.form.version = '3.0'
    wrapper.vm.reply = 'Brouillon en cours'
    const linked = detail({
      status: 'planned',
      developer_reply: 'Ancienne',
      duplicate_of_id: 3,
      duplicate_of: { id: 3, title: 'Thème sombre', status: 'planned' }
    })
    mocks.patch.mockResolvedValue({ data: { data: linked } })
    await wrapper.find('q-btn.mark-duplicate').trigger('click')
    await flushPromises()
    expect(mocks.patch).toHaveBeenCalledWith(
      '/developer/feedback/suggestions/7',
      { duplicate_of_id: 3 }
    )
    // Filled from the PATCH answer: no second GET of the detail.
    expect(
      mocks.get.mock.calls.filter(
        ([url]) => url === '/developer/feedback/suggestions/7'
      )
    ).toHaveLength(1)
    expect(wrapper.text()).toContain('Ce retour est un doublon de :')
    // The inherited status shows; the developer's unsaved edits and draft stay.
    expect(wrapper.vm.form.status).toBe('planned')
    expect(wrapper.vm.form.priority).toBe('high')
    expect(wrapper.vm.form.version).toBe('3.0')
    expect(wrapper.vm.reply).toBe('Brouillon en cours')
  })

  it('offers the primary of a similar suggestion that is itself a duplicate', async () => {
    await render(detail(), [
      {
        id: 5,
        title: 'Sombre partout',
        status: 'read',
        score: 0.5,
        duplicate_of_id: 3
      }
    ])
    expect(wrapper.find('q-btn.mark-duplicate').exists()).toBe(false)
    expect(wrapper.find('.group-of').text()).toContain(
      'Fait partie du groupe de'
    )
    expect(wrapper.find('.group-of').text()).toContain('#3')
    const action = wrapper.find('q-btn.mark-primary')
    expect(action.attributes('label')).toBe('Marquer comme doublon du n° 3')
    mocks.patch.mockResolvedValue({
      data: { data: detail({ duplicate_of_id: 3 }) }
    })
    await action.trigger('click')
    await flushPromises()
    expect(mocks.patch).toHaveBeenCalledWith(
      '/developer/feedback/suggestions/7',
      { duplicate_of_id: 3 }
    )
  })

  it('shows the not-found state when a save answers 404', async () => {
    await render()
    wrapper.vm.form.status = 'done'
    mocks.patch.mockRejectedValue({
      response: {
        status: 404,
        data: {
          message: 'No query results for model [App\\Models\\Suggestion].'
        }
      }
    })
    await wrapper.vm.saveTriage()
    await flushPromises()
    expect(wrapper.text()).toContain('Retour introuvable.')
    expect(wrapper.text()).not.toContain('No query results')
    expect(mocks.notify).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'negative' })
    )
  })

  it('resets the spinners and ignores a late save for the previous feedback', async () => {
    await render()
    let finish
    mocks.patch.mockReturnValue(new Promise(resolve => (finish = resolve)))
    wrapper.vm.reply = 'Pour le 7'
    const saving = wrapper.vm.saveReply()
    expect(wrapper.vm.savingReply).toBe(true)
    mocks.route.params.id = '8'
    mockDetail(detail({ id: 8, title: 'Huit' }))
    mocks.get.mockImplementation(url =>
      Promise.resolve(
        url.endsWith('/similar')
          ? { data: { data: [] } }
          : { data: { data: detail({ id: 8, title: 'Huit' }) } }
      )
    )
    await flushPromises()
    expect(wrapper.vm.savingReply).toBe(false)
    finish({ data: { data: detail({ id: 7, developer_reply: 'Pour le 7' }) } })
    await saving
    await flushPromises()
    expect(wrapper.vm.detail.id).toBe(8)
    expect(wrapper.vm.reply).toBe('')
    expect(mocks.notify).not.toHaveBeenCalled()
  })

  it('unlinks a duplicate and shows a refused link inline', async () => {
    await render(
      detail({
        duplicate_of_id: 3,
        duplicate_of: { id: 3, title: 'Thème sombre', status: 'read' }
      })
    )
    mocks.patch.mockResolvedValue({ data: { data: detail() } })
    await wrapper.find('q-btn.unlink').trigger('click')
    await flushPromises()
    expect(mocks.patch).toHaveBeenCalledWith(
      '/developer/feedback/suggestions/7',
      { duplicate_of_id: null }
    )
    const message =
      'Cette suggestion est elle-même un doublon : choisissez la suggestion principale.'
    mocks.patch.mockRejectedValue({
      response: {
        status: 422,
        data: { errors: { duplicate_of_id: [message] } }
      }
    })
    await wrapper.vm.markDuplicate(9)
    await flushPromises()
    expect(wrapper.find('.dup-error').text()).toBe(message)
  })

  it('detaches a grouped duplicate', async () => {
    await render(
      detail({
        duplicates_count: 1,
        duplicates: [
          { id: 8, title: 'Sombre aussi', status: 'new', created_at: null }
        ]
      })
    )
    expect(wrapper.text()).toContain('Sombre aussi')
    mocks.patch.mockResolvedValue({ data: { data: detail({ id: 8 }) } })
    await wrapper.find('q-btn.detach').trigger('click')
    await flushPromises()
    expect(mocks.patch).toHaveBeenCalledWith(
      '/developer/feedback/suggestions/8',
      { duplicate_of_id: null }
    )
    expect(wrapper.vm.detail.id).toBe(7)
  })

  it('renders the history timeline', async () => {
    await render(
      detail({
        history: [
          {
            id: 2,
            actor: { name: 'Kofi' },
            actor_role: 'developer',
            field: 'status',
            from: 'read',
            to: 'planned',
            created_at: '2026-10-12T10:00:00Z'
          },
          {
            id: 1,
            actor: null,
            actor_role: 'system',
            field: 'status',
            from: 'new',
            to: 'read',
            created_at: '2026-10-11T10:00:00Z'
          }
        ]
      })
    )
    const entries = wrapper.findAll('.timeline-item')
    expect(entries).toHaveLength(2)
    expect(entries[0].text()).toContain('Statut : À étudier → Planifié')
    expect(entries[0].text()).toContain('Kofi (Développeur)')
    expect(entries[1].text()).toContain('Statut : Nouveau → À étudier')
    expect(entries[1].text()).toContain('Automatique')
    expect(entries[1].text()).toContain('À l’ouverture du retour')
  })

  it('ignores a late answer for the previous feedback', async () => {
    const pending = {}
    mocks.get.mockImplementation(url => {
      const match = url.match(/^\/developer\/feedback\/suggestions\/(\d+)$/)
      if (!match) return Promise.resolve({ data: { data: [] } })
      return new Promise(resolve => (pending[match[1]] = resolve))
    })
    wrapper = shallowMount(FeedbackDetailPage, mountOptions)
    await flushPromises()
    mocks.route.params.id = '8'
    await flushPromises()
    pending['8']({ data: { data: detail({ id: 8, title: 'Nouveau titre' }) } })
    await flushPromises()
    pending['7']({
      data: { data: detail({ id: 7, title: 'Ancien', developer_reply: 'X' }) }
    })
    await flushPromises()
    expect(wrapper.vm.detail.title).toBe('Nouveau titre')
    expect(wrapper.vm.reply).toBe('')
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.text()).not.toContain('Ancien')
  })

  it('shows a not-found state on 404', async () => {
    mocks.get.mockRejectedValue({ response: { status: 404 } })
    wrapper = shallowMount(FeedbackDetailPage, mountOptions)
    await flushPromises()
    expect(wrapper.text()).toContain('Retour introuvable.')
  })
})

describe('feedback access and redirects', () => {
  it('guards both feedback routes behind the feedback_hub flag', async () => {
    const { default: routes } = await import('@/router/routes')
    const developer = routes.find(r => r.path === '/developer')
    const pages = developer.children.filter(
      child => child.meta?.tool === 'feedback_hub'
    )
    expect(pages.map(child => child.path)).toEqual([
      'feedback',
      'feedback/:id(\\d+)'
    ])
    for (const route of pages) {
      expect(resolveToolAccess(route, { tools: { feedback_hub: false } })).toBe(
        '/developer/lab'
      )
      expect(resolveToolAccess(route, { tools: { feedback_hub: true } })).toBe(
        true
      )
    }
    const legacy = developer.children.find(c => c.path === 'suggestions')
    expect(legacy.meta.legacySuggestions).toBe(true)
    expect(legacy.meta.tool).toBeUndefined()
  })

  it('redirects the former inbox only when the flag is on', () => {
    const to = query => ({ path: '/developer/suggestions', query })
    const on = { tools: { feedback_hub: true } }
    expect(resolveLegacySuggestions(to({ id: '12' }), on)).toBe(
      '/developer/feedback/12'
    )
    expect(resolveLegacySuggestions(to({}), on)).toBe('/developer/feedback')
    expect(resolveLegacySuggestions(to({ id: 'abc' }), on)).toBe(
      '/developer/feedback'
    )
    for (const platform of [
      { tools: { feedback_hub: false } },
      { tools: {} },
      null
    ])
      expect(resolveLegacySuggestions(to({ id: '12' }), platform)).toBe(true)
  })
})
