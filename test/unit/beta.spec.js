import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, shallowMount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  notify: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  leaveGuard: null,
  route: null,
  auth: null,
  tools: null
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
  mocks.tools = ref({ beta: true })
  return { usePlatform: () => ({ tools: mocks.tools }) }
})
vi.mock('@/stores/auth', async () => {
  const { reactive } = await import('vue')
  mocks.auth = reactive({
    isAuthenticated: true,
    user: { admin_permissions: ['apps.moderate'] }
  })
  return { useAuthStore: () => mocks.auth }
})
vi.mock('@/utils/countries', () => ({
  activeCountries: () =>
    Promise.resolve([
      { code: 'CI', name: 'Côte d’Ivoire', name_en: 'Ivory Coast' }
    ]),
  flagEmoji: code => `[${code}]`
}))
vi.mock('vue-router', async () => {
  const { reactive } = await import('vue')
  mocks.route = reactive({
    path: '/beta/5',
    fullPath: '/beta/5',
    params: { id: '5' },
    query: {}
  })
  return {
    useRoute: () => mocks.route,
    useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
    onBeforeRouteLeave: guard => {
      mocks.leaveGuard = guard
    }
  }
})
vi.mock('quasar', async load => ({
  ...(await load()),
  useQuasar: () => ({ notify: mocks.notify, screen: { lt: { sm: false } } })
}))

import {
  betaAdminApi,
  betaDevApi,
  betaPublicApi,
  betaTesterApi
} from '@/services/beta'
import {
  campaignForm,
  campaignPayload,
  campaignProblems,
  accessPausedReason,
  betaDate,
  changedReviewedFields,
  needsReapproval,
  richTextSummary,
  checkBetaImages,
  countriesLabel,
  dateRange,
  deviceSummary,
  isHttpsUrl,
  participationState,
  spotsLabel
} from '@/utils/beta'
import { resolveToolAccess } from '@/router/guards'
import BetaCatalogPage from '@/pages/store/BetaCatalogPage.vue'
import BetaCampaignPage from '@/pages/store/BetaCampaignPage.vue'
import MyBetaTestsPage from '@/pages/account/MyBetaTestsPage.vue'
import BetaPage from '@/pages/developer/BetaPage.vue'
import BetaCampaignFormPage from '@/pages/developer/BetaCampaignFormPage.vue'
import DevBetaCampaignPage from '@/pages/developer/BetaCampaignPage.vue'
import AdminBetaPage from '@/pages/admin/AdminBetaPage.vue'
import BetaApplyDialog from '@/components/beta/BetaApplyDialog.vue'
import BetaFeedbackForm from '@/components/beta/BetaFeedbackForm.vue'
import BetaQuestionBuilder from '@/components/beta/BetaQuestionBuilder.vue'
import DeveloperToolsNav from '@/components/DeveloperToolsNav.vue'
import AdminNav from '@/components/AdminNav.vue'

const SECRET = 'https://secret-beta.example.com'
const questions = () => [
  { id: 1, label: 'Votre téléphone ?', type: 'text', required: true },
  {
    id: 2,
    label: 'Fréquence d’usage',
    type: 'choice',
    options: ['Souvent', 'Rarement'],
    required: true
  },
  { id: 3, label: 'Intérêt', type: 'rating', options: null, required: false }
]
const publicCampaign = (overrides = {}) => ({
  id: 5,
  name: 'Bêta 2.0',
  description: 'Nouvelle navigation.',
  objectives: 'Trouver les bugs.',
  eligibility: 'Android 12+',
  application: { id: 4, name: 'Alpha', icon_url: null, category: 'Outils' },
  countries: ['CI'],
  starts_at: '2026-10-20',
  ends_at: '2026-11-20',
  spots_left: 3,
  open: true,
  questions: questions(),
  my_participation: null,
  ...overrides
})
const devDetail = (overrides = {}) => ({
  id: 5,
  application: { id: 4, name: 'Alpha', icon_url: null },
  name: 'Bêta 2.0',
  status: 'approved',
  starts_at: '2026-10-20',
  ends_at: '2026-11-20',
  max_participants: 10,
  counts: { applied: 3, accepted: 2, feedback: 4, feedback_new: 1 },
  review_reason: null,
  created_at: '2026-10-10T10:00:00Z',
  description: 'Nouvelle navigation.',
  objectives: 'Trouver les bugs.',
  eligibility: '',
  instructions: '<p>Connectez-vous</p>',
  beta_url: SECRET,
  countries: ['CI'],
  auto_accept: false,
  questions: [{ id: 1, label: 'Téléphone ?', type: 'text', required: true }],
  submitted_at: null,
  reviewed_at: null,
  ...overrides
})
const page = (data, total = data.length, lastPage = 1) => ({
  data: { data, last_page: lastPage, total }
})
const options = {
  global: {
    renderStubDefaultSlot: true,
    stubs: { EmptyState: false, SuggestionDetail: false },
    config: { warnHandler() {} }
  }
}

let wrapper
beforeEach(() => {
  // A fixed "today": 15 Oct 2026 (campaigns run from 20 Oct to 20 Nov).
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 15, 12, 0, 0))
  vi.clearAllMocks()
  mocks.auth.isAuthenticated = true
  mocks.tools.value = { beta: true }
  Object.assign(mocks.route, {
    path: '/beta/5',
    fullPath: '/beta/5',
    params: { id: '5' },
    query: {}
  })
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  vi.useRealTimers()
})

describe('beta services', () => {
  it('calls the documented endpoints', async () => {
    mocks.get.mockResolvedValue({ data: {} })
    mocks.post.mockResolvedValue({ data: {} })
    mocks.patch.mockResolvedValue({ data: {} })
    await betaDevApi.campaigns({ applicationId: 4, status: 'draft', page: 2 })
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/beta/campaigns', {
      params: { application_id: 4, status: 'draft', page: 2 }
    })
    await betaDevApi.campaigns()
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/beta/campaigns', {
      params: { page: 1 }
    })
    await betaDevApi.create({ name: 'x' })
    expect(mocks.post).toHaveBeenLastCalledWith('/developer/beta/campaigns', {
      name: 'x'
    })
    await betaDevApi.show(5)
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/beta/campaigns/5')
    await betaDevApi.update(5, { name: 'y' })
    expect(mocks.patch).toHaveBeenLastCalledWith(
      '/developer/beta/campaigns/5',
      { name: 'y' }
    )
    await betaDevApi.submit(5)
    expect(mocks.post).toHaveBeenLastCalledWith(
      '/developer/beta/campaigns/5/submit'
    )
    await betaDevApi.close(5)
    expect(mocks.post).toHaveBeenLastCalledWith(
      '/developer/beta/campaigns/5/close'
    )
    await betaDevApi.participants(5, { status: 'applied', page: 3 })
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/beta/campaigns/5/participants',
      { params: { status: 'applied', page: 3 } }
    )
    await betaDevApi.decide(11, 'accepted')
    expect(mocks.patch).toHaveBeenLastCalledWith(
      '/developer/beta/participants/11',
      { status: 'accepted' }
    )
    await betaDevApi.feedback(5, { type: 'bug', status: 'new' })
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/developer/beta/campaigns/5/feedback',
      { params: { type: 'bug', status: 'new', page: 1 } }
    )
    await betaDevApi.feedbackDetail(21)
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/beta/feedback/21')
    await betaDevApi.updateFeedback(21, { reply: 'ok' })
    expect(mocks.patch).toHaveBeenLastCalledWith(
      '/developer/beta/feedback/21',
      {
        reply: 'ok'
      }
    )

    await betaPublicApi.campaigns(2)
    expect(mocks.get).toHaveBeenLastCalledWith('/beta/campaigns', {
      params: { page: 2 }
    })
    await betaPublicApi.show(5)
    expect(mocks.get).toHaveBeenLastCalledWith('/beta/campaigns/5')
    await betaPublicApi.apply(5, { accept_terms: true })
    expect(mocks.post).toHaveBeenLastCalledWith('/beta/campaigns/5/apply', {
      accept_terms: true
    })

    await betaTesterApi.participations(2)
    expect(mocks.get).toHaveBeenLastCalledWith('/account/beta', {
      params: { page: 2 }
    })
    await betaTesterApi.withdraw(7)
    expect(mocks.post).toHaveBeenLastCalledWith('/account/beta/7/withdraw')
    await betaTesterApi.feedback(7)
    expect(mocks.get).toHaveBeenLastCalledWith('/account/beta/7/feedback', {
      params: { page: 1 }
    })
    const form = new FormData()
    await betaTesterApi.sendFeedback(7, form)
    expect(mocks.post).toHaveBeenLastCalledWith(
      '/account/beta/7/feedback',
      form,
      undefined
    )
    await betaTesterApi.attachment(21, 3)
    expect(mocks.get).toHaveBeenLastCalledWith(
      '/beta/feedback/21/attachments/3',
      { responseType: 'blob' }
    )

    await betaAdminApi.campaigns()
    expect(mocks.get).toHaveBeenLastCalledWith('/admin/beta/campaigns', {
      params: { status: 'pending', page: 1 }
    })
    await betaAdminApi.review(3, { decision: 'approve' })
    expect(mocks.post).toHaveBeenLastCalledWith(
      '/admin/beta/campaigns/3/review',
      { decision: 'approve' }
    )
  })

  it('reports the upload progress as a percentage', async () => {
    mocks.post.mockResolvedValue({ data: {} })
    const progress = vi.fn()
    await betaTesterApi.sendFeedback(7, new FormData(), progress)
    mocks.post.mock.calls[0][2].onUploadProgress({ loaded: 50, total: 200 })
    expect(progress).toHaveBeenCalledWith(25)
  })
})

describe('beta helpers', () => {
  it('words dates, spots and countries', () => {
    expect(dateRange('2026-10-20', '2026-11-20')).toMatch(
      /^Du 20 oct\. 2026 au 20 nov\. 2026$/
    )
    expect(spotsLabel(0)).toBe('Complet')
    expect(spotsLabel(1)).toBe('1 place restante')
    expect(spotsLabel(4)).toBe('4 places restantes')
    expect(countriesLabel([])).toBe('Tous les pays')
    expect(
      countriesLabel(['CI', 'SN'], [{ code: 'CI', name: 'Côte d’Ivoire' }])
    ).toBe('Côte d’Ivoire, SN')
  })

  it('accepts only https beta addresses', () => {
    expect(isHttpsUrl('https://beta.example.com')).toBe(true)
    expect(isHttpsUrl('http://beta.example.com')).toBe(false)
    expect(isHttpsUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpsUrl('beta.example.com')).toBe(false)
  })

  it('derives the public participation state', () => {
    expect(
      participationState(publicCampaign({ starts_at: '2026-10-01' }))
    ).toBe('open')
    expect(participationState(publicCampaign({ spots_left: 0 }))).toBe('full')
    expect(participationState(publicCampaign({ open: false }))).toBe('closed')
    for (const status of ['applied', 'accepted', 'rejected', 'removed'])
      expect(
        participationState(
          publicCampaign({ my_participation: { id: 1, status } })
        )
      ).toBe(status)
    expect(
      participationState(
        publicCampaign({ my_participation: { id: 1, status: 'withdrawn' } })
      )
    ).toBe('reapply')
  })

  it('summarises the device from the user agent', () => {
    expect(
      deviceSummary(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
      )
    ).toBe('Android 14 · Chrome 128')
    expect(
      deviceSummary(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
      )
    ).toBe('iOS 17 · Safari 17')
    expect(deviceSummary('')).toBe('')
  })

  it('refuses public-field problems before sending', () => {
    const form = campaignForm()
    form.beta_url = 'http://beta.example.com'
    form.starts_at = '2026-10-01'
    form.ends_at = '2027-06-01'
    form.max_participants = 0
    const problems = campaignProblems(form)
    expect(Object.keys(problems)).toEqual(
      expect.arrayContaining([
        'application_id',
        'name',
        'description',
        'objectives',
        'beta_url',
        'max_participants',
        'ends_at'
      ])
    )
    expect(problems.ends_at).toContain('180 jours')
  })
})

describe('public catalogue', () => {
  it('renders the campaign cards without any private field', async () => {
    mocks.get.mockImplementation(url =>
      url === '/beta/campaigns'
        ? Promise.resolve(
            page([publicCampaign({ beta_url: SECRET, instructions: 'x' })])
          )
        : Promise.reject(new Error(url))
    )
    wrapper = shallowMount(BetaCatalogPage, options)
    await flushPromises()
    const text = wrapper.text()
    expect(text).toContain('Bêta 2.0')
    expect(text).toContain('Alpha')
    expect(text).toContain('3 places restantes')
    expect(text).toContain('Côte d’Ivoire')
    expect(text).toContain('Du 20 oct. 2026 au 20 nov. 2026')
    expect(wrapper.find('router-link[to="/beta/5"]').exists()).toBe(true)
    expect(wrapper.html()).not.toContain('secret-beta')
  })

  it('shows the empty state and the error state with Réessayer', async () => {
    mocks.get.mockResolvedValueOnce(page([]))
    wrapper = shallowMount(BetaCatalogPage, options)
    await flushPromises()
    expect(wrapper.text()).toContain(
      'Aucune campagne de test ouverte pour le moment.'
    )
    wrapper.unmount()
    mocks.get.mockRejectedValueOnce({
      response: { status: 500, data: { message: 'Panne' } }
    })
    wrapper = shallowMount(BetaCatalogPage, options)
    await flushPromises()
    expect(wrapper.text()).toContain(
      'Les campagnes n’ont pas pu être chargées.'
    )
    expect(wrapper.text()).toContain('Panne')
    mocks.get.mockResolvedValueOnce(page([publicCampaign()]))
    await wrapper.find('q-btn.retry').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Bêta 2.0')
  })
})

describe('public campaign page', () => {
  async function render(campaign = publicCampaign()) {
    mocks.get.mockImplementation(url =>
      url === '/beta/campaigns/5'
        ? Promise.resolve({ data: { data: campaign } })
        : Promise.reject(new Error(url))
    )
    wrapper = shallowMount(BetaCampaignPage, options)
    await flushPromises()
    return wrapper.text()
  }

  it('shows the description, objectives and eligibility, never the beta url', async () => {
    const text = await render(
      publicCampaign({ beta_url: SECRET, instructions: '<p>secret</p>' })
    )
    for (const part of [
      'Nouvelle navigation.',
      'Trouver les bugs.',
      'Android 12+',
      'Envie de participer ?'
    ])
      expect(text).toContain(part)
    expect(wrapper.html()).not.toContain('secret-beta')
    expect(wrapper.html()).not.toContain('<p>secret</p>')
    // The public pages never even read the private fields.
    for (const file of [
      'src/pages/store/BetaCatalogPage.vue',
      'src/pages/store/BetaCampaignPage.vue',
      'src/components/beta/BetaApplyDialog.vue'
    ]) {
      const source = readFileSync(file, 'utf8')
      expect(source).not.toContain('beta_url')
      expect(source).not.toContain('instructions')
    }
  })

  it('links the app only when its page is public', async () => {
    await render()
    expect(wrapper.find('router-link-stub.app-link, .app-link').exists()).toBe(
      true
    )
    wrapper.unmount()
    await render(
      publicCampaign({
        application: { id: 4, name: 'Alpha', icon_url: null, category: null }
      })
    )
    expect(wrapper.find('.app-link').exists()).toBe(false)
    expect(wrapper.text()).toContain('Alpha')
  })

  it('sends an anonymous visitor to the login page and back', async () => {
    mocks.auth.isAuthenticated = false
    await render()
    wrapper.vm.participate()
    expect(mocks.push).toHaveBeenCalledWith({
      path: '/login',
      query: { redirect: '/beta/5' }
    })
    expect(wrapper.vm.applyOpen).toBe(false)
  })

  it('shows each participation state', async () => {
    const cases = {
      applied: 'Candidature envoyée',
      accepted: 'Vous êtes testeur',
      rejected: 'Candidature non retenue',
      withdrawn: 'vous pouvez candidater de nouveau'
    }
    for (const [status, label] of Object.entries(cases)) {
      const text = await render(
        publicCampaign({ my_participation: { id: 9, status } })
      )
      expect(text).toContain(label)
      wrapper.unmount()
    }
    const text = await render(publicCampaign({ spots_left: 0 }))
    expect(text).toContain('Campagne complète')
    expect(wrapper.find('q-btn.participate').exists()).toBe(false)
  })

  it('shows a not-found state on 404', async () => {
    mocks.get.mockRejectedValue({ response: { status: 404 } })
    wrapper = shallowMount(BetaCampaignPage, options)
    await flushPromises()
    expect(wrapper.text()).toContain('Campagne introuvable.')
  })
})

describe('apply dialog', () => {
  function render(campaign = publicCampaign()) {
    wrapper = mount(BetaApplyDialog, {
      props: { campaign, modelValue: true },
      global: {
        stubs: {
          QDialog: { template: '<div><slot /></div>' },
          QCard: { template: '<div><slot /></div>' },
          QCardSection: { template: '<div><slot /></div>' },
          QCardActions: { template: '<div><slot /></div>' },
          QBtn: true,
          QBanner: { template: '<div class="q-banner"><slot /></div>' },
          QIcon: true
        },
        directives: { closePopup: {} },
        config: { warnHandler() {} }
      }
    })
    return wrapper
  }

  it('renders each question type with accessible controls', () => {
    render()
    expect(wrapper.findAll('fieldset legend')).toHaveLength(3)
    expect(wrapper.find('textarea').attributes('aria-required')).toBe('true')
    expect(wrapper.findAll('input[name="q-2"]')).toHaveLength(2)
    const stars = wrapper.findAll('input[name="q-3"]')
    expect(stars).toHaveLength(5)
    expect(wrapper.text()).toContain('4 sur 5')
    expect(wrapper.text()).toContain('Montrer mon nom au développeur')
    for (const term of [
      'confidentielle',
      'Mes retours sont privés',
      'me retirer du test à tout moment'
    ])
      expect(wrapper.text()).toContain(term)
  })

  it('blocks missing required answers and unaccepted terms', async () => {
    render()
    await wrapper.vm.send()
    await wrapper.vm.$nextTick()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(wrapper.vm.missing).toEqual([1, 2])
    expect(wrapper.findAll('.field-error').length).toBe(3)
    expect(wrapper.text()).toContain('Acceptez les conditions du test')
    // The optional rating does not block.
    await wrapper.find('textarea').setValue('Pixel 8')
    await wrapper.find('input[value="Souvent"]').setValue()
    await wrapper.find('input.accept-terms').setValue(true)
    expect(wrapper.vm.missing).toEqual([])
  })

  it('sends the answers, the share choice and the terms', async () => {
    render()
    mocks.post.mockResolvedValue({
      data: { data: { id: 9, status: 'applied' } }
    })
    await wrapper.find('textarea').setValue('  Pixel 8 ')
    await wrapper.find('input[value="Rarement"]').setValue()
    await wrapper.find('input[name="q-3"][value="4"]').setValue()
    await wrapper.find('input.share-name').setValue(true)
    await wrapper.find('input.accept-terms').setValue(true)
    await wrapper.vm.send()
    expect(mocks.post).toHaveBeenCalledWith('/beta/campaigns/5/apply', {
      accept_terms: true,
      answers: { 1: 'Pixel 8', 2: 'Rarement', 3: 4 },
      share_name: true
    })
    expect(wrapper.emitted('applied')[0]).toEqual([
      { id: 9, status: 'applied' }
    ])
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
  })

  it('explains 409 and 422 answers', async () => {
    render(publicCampaign({ questions: [] }))
    await wrapper.find('input.accept-terms').setValue(true)
    mocks.post.mockRejectedValueOnce({ response: { status: 409 } })
    await wrapper.vm.send()
    expect(wrapper.vm.error).toBe(
      'Vous avez déjà envoyé une candidature pour cette campagne.'
    )
    expect(wrapper.emitted('refresh')).toHaveLength(1)
    mocks.post.mockRejectedValueOnce({
      response: { status: 422, data: { message: 'La campagne est complète.' } }
    })
    await wrapper.vm.send()
    expect(wrapper.vm.error).toBe('La campagne est complète.')
    mocks.post.mockRejectedValueOnce({ response: { status: 422, data: {} } })
    await wrapper.vm.send()
    expect(wrapper.vm.error).toContain('n’accepte plus de candidatures')
  })
})

describe('tester space', () => {
  const participation = (overrides = {}) => ({
    id: 1,
    status: 'accepted',
    applied_at: '2026-10-11T10:00:00Z',
    campaign: {
      id: 5,
      name: 'Bêta 2.0',
      application: { id: 4, name: 'Alpha', icon_url: null },
      ends_at: '2026-11-20',
      status: 'approved'
    },
    access: {
      beta_url: SECRET,
      instructions: '<p>Bienvenue<script>alert(1)</script></p>'
    },
    feedback_count: 0,
    ...overrides
  })

  it('shows the access block only when access is present', async () => {
    mocks.get.mockResolvedValue(
      page([
        participation(),
        participation({ id: 2, status: 'applied', access: null }),
        participation({
          id: 3,
          access: null,
          campaign: { ...participation().campaign, status: 'pending' }
        })
      ])
    )
    wrapper = shallowMount(MyBetaTestsPage, options)
    await flushPromises()
    const links = wrapper.findAll('a.beta-link')
    expect(links).toHaveLength(1)
    expect(links[0].attributes('href')).toBe(SECRET)
    expect(links[0].attributes('target')).toBe('_blank')
    expect(links[0].attributes('rel')).toBe('noopener noreferrer')
    expect(wrapper.find('[data-participation="2"] .access').exists()).toBe(
      false
    )
    const body = wrapper.find('[data-participation="1"] .suggestion-body')
    expect(body.html()).toContain('Bienvenue')
    expect(body.html()).not.toContain('<script')
    expect(wrapper.text()).toContain(
      'Le développeur n’a pas encore répondu à votre candidature.'
    )
    // Accepted, but the approved campaign is back in review: access is paused.
    expect(
      wrapper.find('[data-participation="3"] .access-paused').text()
    ).toContain('Campagne en cours de revalidation')
    expect(wrapper.find('[data-participation="3"] .access').exists()).toBe(
      false
    )
    // The feedback form is offered to the accepted tester with access only.
    expect(wrapper.findAll('q-btn.toggle-form')).toHaveLength(1)
  })

  it('withdraws after confirmation', async () => {
    mocks.get.mockResolvedValue(page([participation()]))
    mocks.post.mockResolvedValue({
      data: { data: { ...participation(), status: 'withdrawn', access: null } }
    })
    wrapper = shallowMount(MyBetaTestsPage, options)
    await flushPromises()
    wrapper.vm.askWithdraw(wrapper.vm.items[0])
    expect(wrapper.vm.withdrawOpen).toBe(true)
    expect(mocks.post).not.toHaveBeenCalled()
    await wrapper.vm.withdraw()
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledWith('/account/beta/1/withdraw')
    expect(wrapper.vm.items[0].status).toBe('withdrawn')
    expect(wrapper.find('a.beta-link').exists()).toBe(false)
  })

  it('shows the empty state', async () => {
    mocks.get.mockResolvedValue(page([]))
    wrapper = shallowMount(MyBetaTestsPage, options)
    await flushPromises()
    expect(wrapper.text()).toContain(
      'Vous ne participez à aucun test pour le moment.'
    )
  })
})

describe('tester feedback form', () => {
  const file = (name, type, size = 1000) =>
    new File([new Uint8Array(size)], name, { type, lastModified: size })

  it('refuses large, wrong-type and extra files before upload', () => {
    expect(
      checkBetaImages([], [file('big.png', 'image/png', 3 * 1024 * 1024)])
        .rejected[0].reason
    ).toBe('size')
    expect(
      checkBetaImages([], [file('anim.gif', 'image/gif')]).rejected[0].reason
    ).toBe('type')
    expect(
      checkBetaImages([], [file('fake.png', 'application/pdf')]).rejected[0]
        .reason
    ).toBe('type')
    const four = [1, 2, 3, 4].map(n => file(`s${n}.jpg`, 'image/jpeg', n * 10))
    const result = checkBetaImages([], four)
    expect(result.accepted).toHaveLength(3)
    expect(result.rejected).toEqual([{ file: four[3], reason: 'count' }])
  })

  it('shows the file messages and sends a FormData payload', async () => {
    wrapper = shallowMount(BetaFeedbackForm, {
      ...options,
      props: { participationId: 9 }
    })
    expect(wrapper.vm.form.device).toBeTypeOf('string')
    wrapper.vm.addFiles([
      file('big.png', 'image/png', 3 * 1024 * 1024),
      file('doc.pdf', 'application/pdf'),
      ...[1, 2, 3, 4].map(n => file(`s${n}.webp`, 'image/webp', n * 10))
    ])
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.files).toHaveLength(3)
    const errors = wrapper.findAll('.file-errors li').map(li => li.text())
    expect(errors).toHaveLength(3)
    expect(errors[0]).toContain('dépasse 2 Mo')
    expect(errors[1]).toContain('n’est pas une image acceptée')
    expect(errors[2]).toContain('3 images au maximum')

    // Invalid form: nothing is sent.
    await wrapper.vm.send()
    expect(mocks.post).not.toHaveBeenCalled()

    mocks.post.mockResolvedValue({ data: { data: { id: 50 } } })
    Object.assign(wrapper.vm.form, {
      type: 'suggestion',
      title: '  Menu caché ',
      body: '<p>Le menu disparaît après rotation.</p>',
      steps: '1. Tourner',
      device: 'Android 14 · Chrome 128'
    })
    await wrapper.vm.send()
    const [url, data, onProgress] = mocks.post.mock.calls[0]
    expect(url).toBe('/account/beta/9/feedback')
    expect(data).toBeInstanceOf(FormData)
    expect(data.get('type')).toBe('suggestion')
    expect(data.get('title')).toBe('Menu caché')
    expect(data.get('body')).toBe('<p>Le menu disparaît après rotation.</p>')
    expect(data.get('steps')).toBe('1. Tourner')
    expect(data.get('device')).toBe('Android 14 · Chrome 128')
    expect(data.getAll('attachments[]').map(f => f.name)).toEqual([
      's1.webp',
      's2.webp',
      's3.webp'
    ])
    expect(onProgress).toBeTypeOf('object')
    expect(wrapper.emitted('sent')[0]).toEqual([{ id: 50 }])
    expect(wrapper.vm.files).toHaveLength(0)
  })
})

describe('developer campaign list', () => {
  it('lists campaigns with status chips and counts, filtered by app and status', async () => {
    mocks.get.mockImplementation(url => {
      if (url === '/developer/apps')
        return Promise.resolve({ data: [{ id: 4, name: 'Alpha' }] })
      if (url === '/developer/beta/campaigns')
        return Promise.resolve(
          page([
            devDetail({
              status: 'rejected',
              review_reason: 'Lien bêta inaccessible.'
            })
          ])
        )
      return Promise.reject(new Error(url))
    })
    wrapper = shallowMount(BetaPage, options)
    await flushPromises()
    const text = wrapper.text()
    expect(text).toContain('Bêta 2.0')
    expect(text).toContain('Refusée')
    expect(text).toContain('3 candidatures')
    expect(text).toContain('2 testeurs acceptés')
    expect(text).toContain('4 retours')
    expect(text).toContain('1 nouveau')
    expect(text).toContain('Lien bêta inaccessible.')
    wrapper.vm.status = 'pending'
    wrapper.vm.applicationId = 4
    await flushPromises()
    expect(mocks.get).toHaveBeenLastCalledWith('/developer/beta/campaigns', {
      params: { application_id: 4, status: 'pending', page: 1 }
    })
  })
})

describe('developer campaign form', () => {
  it('builds questions: add, type, options, reorder, remove, at most 10', async () => {
    const { reactive } = await import('vue')
    const list = reactive([])
    wrapper = shallowMount(BetaQuestionBuilder, {
      ...options,
      props: { questions: list }
    })
    for (let i = 0; i < 12; i++) wrapper.vm.add()
    expect(list).toHaveLength(10)
    list.splice(3)
    list[0].label = 'Téléphone ?'
    list[0].required = true
    wrapper.vm.setType(list[1], 'choice')
    list[1].label = 'Fréquence'
    list[1].options = ['Souvent', ' ', 'Rarement']
    wrapper.vm.setType(list[2], 'rating')
    list[2].label = 'Intérêt'
    wrapper.vm.move(2, -1)
    expect(list.map(q => q.label)).toEqual([
      'Téléphone ?',
      'Intérêt',
      'Fréquence'
    ])
    const payload = campaignPayload({ ...campaignForm(), questions: list })
    const id = expect.stringMatching(/^q_[a-z0-9]+$/)
    expect(new Set(payload.questions.map(q => q.id)).size).toBe(3)
    expect(payload.questions).toEqual([
      { id, label: 'Téléphone ?', type: 'text', required: true },
      { id, label: 'Intérêt', type: 'rating', required: false },
      {
        id,
        label: 'Fréquence',
        type: 'choice',
        required: false,
        options: ['Souvent', 'Rarement']
      }
    ])
    wrapper.vm.remove(0)
    expect(list).toHaveLength(2)
  })

  it('creates a draft with the full payload', async () => {
    mocks.route.params = {}
    mocks.get.mockResolvedValue({ data: [{ id: 4, name: 'Alpha' }] })
    mocks.post.mockResolvedValue({ data: { data: { id: 77 } } })
    wrapper = shallowMount(BetaCampaignFormPage, options)
    await flushPromises()
    Object.assign(wrapper.vm.form, {
      application_id: 4,
      name: ' Bêta 2.0 ',
      description: 'Nouvelle navigation.',
      objectives: 'Trouver les bugs.',
      beta_url: 'http://beta.example.com',
      countries: ['CI'],
      max_participants: 20,
      starts_at: '2026-10-20',
      ends_at: '2026-11-20',
      auto_accept: true
    })
    wrapper.vm.form.questions.push({
      key: 'k1',
      id: null,
      label: 'Téléphone ?',
      type: 'text',
      options: [],
      required: true
    })
    wrapper.vm.save()
    await flushPromises()
    // http:// is refused on the client.
    expect(mocks.post).not.toHaveBeenCalled()
    expect(wrapper.vm.problems.beta_url).toContain('https://')
    wrapper.vm.form.beta_url = 'https://beta.example.com'
    wrapper.vm.save()
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledWith('/developer/beta/campaigns', {
      application_id: 4,
      name: 'Bêta 2.0',
      description: 'Nouvelle navigation.',
      objectives: 'Trouver les bugs.',
      eligibility: null,
      instructions: null,
      beta_url: 'https://beta.example.com',
      countries: ['CI'],
      max_participants: 20,
      starts_at: '2026-10-20T00:00:00',
      ends_at: '2026-11-20T23:59:59',
      auto_accept: true,
      questions: [{ label: 'Téléphone ?', type: 'text', required: true }]
    })
    expect(mocks.push).toHaveBeenCalledWith('/developer/beta/77')
  })

  async function renderEdit(detail = devDetail()) {
    mocks.route.params = { id: '5' }
    mocks.get.mockImplementation(url =>
      url === '/developer/beta/campaigns/5'
        ? Promise.resolve({ data: { data: detail } })
        : Promise.resolve({ data: [{ id: 4, name: 'Alpha' }] })
    )
    wrapper = shallowMount(BetaCampaignFormPage, options)
    await flushPromises()
  }

  it('warns before saving reviewed edits of an approved campaign, then shows requires_review', async () => {
    await renderEdit()
    expect(wrapper.vm.reapproval).toBe(false)
    // Dates, places and automatic acceptance never need a new review.
    Object.assign(wrapper.vm.form, {
      ends_at: '2026-11-30',
      max_participants: 30,
      auto_accept: true
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.reapproval).toBe(false)
    expect(wrapper.find('.reapproval-warning').exists()).toBe(false)
    // The private beta address is reviewed.
    wrapper.vm.form.beta_url = 'https://beta2.example.com'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.reapproval).toBe(true)
    const banner = wrapper.find('.reapproval-warning').text()
    expect(banner).toContain('la renvoie en validation')
    expect(banner).toContain(
      'l’accès des testeurs acceptés est suspendu jusqu’à la nouvelle validation'
    )
    expect(changedReviewedFields(wrapper.vm.detail, wrapper.vm.form)).toEqual([
      'beta_url'
    ])
    wrapper.vm.save()
    expect(wrapper.vm.confirmOpen).toBe(true)
    expect(wrapper.text()).toContain(
      'L’accès des testeurs acceptés est suspendu jusqu’à la nouvelle validation.'
    )
    expect(mocks.patch).not.toHaveBeenCalled()
    mocks.patch.mockResolvedValue({
      data: {
        data: devDetail({ status: 'pending' }),
        meta: { requires_review: true }
      }
    })
    await wrapper.vm.persist()
    expect(mocks.patch).toHaveBeenCalledWith('/developer/beta/campaigns/5', {
      beta_url: 'https://beta2.example.com',
      max_participants: 30,
      ends_at: '2026-11-30T23:59:59',
      auto_accept: true
    })
    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'warning',
      message:
        'Modifications enregistrées. La campagne repasse en validation avant d’être de nouveau visible.'
    })
    // Saved: leaving does not ask.
    expect(mocks.leaveGuard()).toBe(true)
  })

  it('lists exactly the reviewed fields', () => {
    const detail = devDetail()
    const changed = {
      name: 'X',
      description: 'Autre',
      objectives: 'Autre',
      eligibility: 'Autre',
      countries: ['SN'],
      beta_url: 'https://other.example.com',
      instructions: '<p>Autre</p>'
    }
    for (const [field, value] of Object.entries(changed))
      expect(
        needsReapproval(detail, { ...campaignForm(detail), [field]: value }),
        field
      ).toBe(true)
    const questions = campaignForm(detail).questions
    questions[0].label = 'Autre ?'
    expect(
      needsReapproval(detail, { ...campaignForm(detail), questions })
    ).toBe(true)
    for (const [field, value] of Object.entries({
      starts_at: '2026-10-21',
      ends_at: '2026-12-01',
      max_participants: 99,
      auto_accept: true
    }))
      expect(
        needsReapproval(detail, { ...campaignForm(detail), [field]: value }),
        field
      ).toBe(false)
    expect(
      needsReapproval(devDetail({ status: 'draft' }), {
        ...campaignForm(detail),
        name: 'X'
      })
    ).toBe(false)
  })

  it('shows a pending campaign as read-only with "Retirer de la validation"', async () => {
    await renderEdit(devDetail({ status: 'pending' }))
    expect(wrapper.text()).toContain(
      'Cette campagne est en cours de validation.'
    )
    expect(wrapper.find('form.campaign-form').exists()).toBe(false)
    mocks.post.mockResolvedValue({
      data: { data: devDetail({ status: 'draft' }) }
    })
    await wrapper.vm.withdrawReview()
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledWith(
      '/developer/beta/campaigns/5/withdraw'
    )
    expect(wrapper.find('form.campaign-form').exists()).toBe(true)
    expect(wrapper.vm.dirty).toBe(false)
  })

  it('asks before leaving with unsaved changes', async () => {
    await renderEdit(devDetail({ status: 'draft' }))
    expect(mocks.leaveGuard()).toBe(true)
    wrapper.vm.form.name = 'Brouillon modifié'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.dirty).toBe(true)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    expect(mocks.leaveGuard()).toBe(false)
    expect(confirm).toHaveBeenCalledWith(
      'Vous avez des modifications non enregistrées. Quitter quand même ?'
    )
    const event = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
  })

  it('saves an incomplete draft but not an incomplete reviewed campaign', async () => {
    mocks.route.params = {}
    mocks.get.mockResolvedValue({
      data: [
        { id: 4, name: 'Alpha', status: 'published' },
        { id: 6, name: 'Archivée', status: 'archived' },
        { id: 7, name: 'Suspendue', status: 'suspended' }
      ]
    })
    mocks.post.mockResolvedValue({ data: {} })
    wrapper = shallowMount(BetaCampaignFormPage, options)
    await flushPromises()
    expect(wrapper.vm.appOptions.map(option => option.value)).toEqual([4])
    Object.assign(wrapper.vm.form, { application_id: 4, name: 'Idée' })
    wrapper.vm.save()
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledWith(
      '/developer/beta/campaigns',
      expect.objectContaining({
        name: 'Idée',
        description: null,
        objectives: null,
        beta_url: null,
        starts_at: null,
        ends_at: null,
        max_participants: 50
      })
    )
    // No id in the answer: back to the list rather than /developer/beta/undefined.
    expect(mocks.push).toHaveBeenCalledWith('/developer/beta')
    expect(
      Object.keys(
        campaignProblems(
          { ...campaignForm(), application_id: 4, name: 'Idée' },
          { complete: true }
        )
      )
    ).toEqual(['description', 'objectives', 'beta_url', 'starts_at', 'ends_at'])
  })

  it('saves a draft without warning', async () => {
    await renderEdit(devDetail({ status: 'draft' }))
    wrapper.vm.form.name = 'Autre nom'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.reapproval).toBe(false)
    mocks.patch.mockResolvedValue({ data: { data: devDetail(), meta: {} } })
    wrapper.vm.save()
    await flushPromises()
    expect(mocks.patch).toHaveBeenCalledWith('/developer/beta/campaigns/5', {
      name: 'Autre nom'
    })
    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'positive',
      message: 'Modifications enregistrées.'
    })
  })
})

describe('developer campaign detail', () => {
  const person = (overrides = {}) => ({
    id: 11,
    label: 'Testeur n° 3',
    country: 'CI',
    status: 'applied',
    answers: [{ question_id: 1, label: 'Téléphone ?', value: 'Pixel 8' }],
    applied_at: '2026-10-11T10:00:00Z',
    decided_at: null,
    feedback_count: 0,
    ...overrides
  })
  const feedbackItem = (overrides = {}) => ({
    id: 21,
    participant_label: 'Testeur n° 3',
    type: 'bug',
    title: 'Plantage au lancement',
    excerpt: 'Écran blanc',
    status: 'new',
    attachments_count: 1,
    created_at: '2026-10-12T10:00:00Z',
    replied_at: null,
    ...overrides
  })
  async function render({
    people = [person()],
    detail = devDetail(),
    query = {}
  } = {}) {
    mocks.route.params = { id: '5' }
    mocks.route.query = query
    mocks.get.mockImplementation(url => {
      if (url === '/developer/beta/campaigns/5')
        return Promise.resolve({ data: { data: detail } })
      if (url === '/developer/beta/campaigns/5/participants')
        return Promise.resolve(page(people))
      if (url === '/developer/beta/campaigns/5/feedback')
        return Promise.resolve(page([feedbackItem()]))
      const match = /^\/developer\/beta\/feedback\/(\d+)$/.exec(url)
      if (match)
        return Promise.resolve({
          data: {
            data: {
              ...feedbackItem({ id: Number(match[1]) }),
              body: '<p>Écran blanc<img src=x onerror="alert(1)"></p>',
              steps: '1. Ouvrir',
              device: 'Android 14',
              attachments: [],
              developer_reply: null
            }
          }
        })
      return Promise.reject(new Error(url))
    })
    wrapper = shallowMount(DevBetaCampaignPage, options)
    await flushPromises()
    return wrapper.text()
  }

  it('shows participants with their answers and accepts after confirmation', async () => {
    const text = await render()
    expect(text).toContain('Testeur n° 3')
    expect(text).toContain('[CI] CI')
    expect(text).toContain('Téléphone ?')
    expect(text).toContain('Pixel 8')
    const [current] = wrapper.vm.$.setupState.participants.items.value
    wrapper.vm.askDecision(current, 'accepted')
    expect(wrapper.vm.decisionOpen).toBe(true)
    expect(mocks.patch).not.toHaveBeenCalled()
    mocks.patch.mockResolvedValue({
      data: { data: person({ status: 'accepted' }) }
    })
    await wrapper.vm.decide()
    await flushPromises()
    expect(mocks.patch).toHaveBeenCalledWith(
      '/developer/beta/participants/11',
      { status: 'accepted' }
    )
    expect(current.status).toBe('accepted')
    expect(wrapper.vm.decisionOpen).toBe(false)
  })

  it('explains a full campaign (422) and offers reject and remove', async () => {
    await render({
      people: [person(), person({ id: 12, status: 'accepted' })]
    })
    expect(wrapper.findAll('q-btn.reject')).toHaveLength(1)
    expect(wrapper.findAll('q-btn.remove')).toHaveLength(1)
    const [current] = wrapper.vm.$.setupState.participants.items.value
    wrapper.vm.askDecision(current, 'accepted')
    mocks.patch.mockRejectedValue({
      response: { status: 422, data: { message: 'Full' } }
    })
    await wrapper.vm.decide()
    expect(wrapper.vm.decisionError).toContain('La campagne est complète')
    expect(wrapper.vm.decisionOpen).toBe(true)
  })

  it('opens a feedback, renders it sanitized and saves status and private reply', async () => {
    await render()
    wrapper.vm.tab = 'feedback'
    await flushPromises()
    expect(wrapper.text()).toContain('Plantage au lancement')
    await wrapper.vm.openFeedback(21)
    await flushPromises()
    const body = wrapper.find('.suggestion-body')
    expect(body.html()).toContain('Écran blanc')
    expect(body.html()).not.toContain('onerror')
    expect(wrapper.text()).toContain('1. Ouvrir')
    mocks.patch.mockResolvedValue({
      data: {
        data: {
          ...feedbackItem({ status: 'fixed' }),
          developer_reply: 'Merci, corrigé.'
        }
      }
    })
    wrapper.vm.triage.status = 'fixed'
    wrapper.vm.triage.reply = '  Merci, corrigé. '
    await wrapper.vm.saveFeedback()
    expect(mocks.patch).toHaveBeenCalledWith('/developer/beta/feedback/21', {
      status: 'fixed',
      reply: 'Merci, corrigé.'
    })
    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'positive',
      message: 'Réponse enregistrée. Le testeur est prévenu.'
    })
  })

  it('shows the rejection reason with "corriger puis renvoyer" in Paramètres', async () => {
    await render({
      detail: devDetail({
        status: 'rejected',
        review_reason: 'Ajoutez des instructions.'
      })
    })
    wrapper.vm.tab = 'settings'
    await flushPromises()
    const text = wrapper.text()
    expect(text).toContain('Ajoutez des instructions.')
    expect(text).toContain(
      'Corrigez la campagne puis renvoyez-la en validation.'
    )
    mocks.post.mockResolvedValue({
      data: { data: devDetail({ status: 'pending' }) }
    })
    await wrapper.vm.submit()
    expect(mocks.post).toHaveBeenCalledWith(
      '/developer/beta/campaigns/5/submit'
    )
    expect(wrapper.vm.campaign.status).toBe('pending')
  })

  it('offers "Accepter" only on an approved campaign that is not over', async () => {
    await render({ detail: devDetail({ status: 'pending' }) })
    expect(wrapper.vm.canAccept).toBe(false)
    expect(wrapper.find('q-btn.accept').exists()).toBe(false)
    expect(wrapper.find('q-btn.reject').exists()).toBe(true)
    expect(wrapper.text()).toContain('Vous pourrez accepter des testeurs')
    wrapper.unmount()
    await render({ detail: devDetail({ ends_at: '2026-10-01' }) })
    expect(wrapper.find('q-btn.accept').exists()).toBe(false)
    wrapper.unmount()
    await render()
    expect(wrapper.find('q-btn.accept').exists()).toBe(true)
  })

  it('shows the server message for a 422 that is not about places', async () => {
    await render()
    const [current] = wrapper.vm.$.setupState.participants.items.value
    wrapper.vm.askDecision(current, 'accepted')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('à partir du début du test')
    mocks.patch.mockRejectedValue({
      response: {
        status: 422,
        data: {
          message: 'Campagne non approuvée.',
          errors: { status: ['Campagne non approuvée.'] }
        }
      }
    })
    await wrapper.vm.decide()
    expect(wrapper.vm.decisionError).toBe('Campagne non approuvée.')
  })

  it('withdraws a pending campaign from review and hides "Modifier" meanwhile', async () => {
    await render({
      detail: devDetail({ status: 'pending' }),
      query: { tab: 'settings' }
    })
    expect(wrapper.vm.tab).toBe('settings')
    expect(wrapper.find('q-btn.edit-campaign').exists()).toBe(false)
    expect(wrapper.find('q-btn.withdraw-campaign').exists()).toBe(true)
    mocks.post.mockResolvedValue({
      data: { data: devDetail({ status: 'draft' }) }
    })
    await wrapper.vm.withdrawReview()
    await flushPromises()
    expect(mocks.post).toHaveBeenCalledWith(
      '/developer/beta/campaigns/5/withdraw'
    )
    expect(wrapper.vm.campaign.status).toBe('draft')
    expect(wrapper.find('q-btn.edit-campaign').exists()).toBe(true)
    expect(wrapper.find('q-btn.submit-campaign').exists()).toBe(true)
  })

  it('checks completeness before submitting and shows the private instructions', async () => {
    await render({
      detail: devDetail({ status: 'draft', description: '', beta_url: null })
    })
    wrapper.vm.tab = 'settings'
    await flushPromises()
    expect(mocks.replace).toHaveBeenCalledWith({ query: { tab: 'settings' } })
    expect(wrapper.find('.instructions .suggestion-body').text()).toBe(
      'Connectez-vous'
    )
    await wrapper.vm.submit()
    expect(mocks.post).not.toHaveBeenCalled()
    expect(wrapper.vm.submitProblems).toHaveLength(2)
    expect(wrapper.find('.submit-problems').text()).toContain('https://')
  })

  it('keeps an unsaved reply per feedback and refreshes counts after a status change', async () => {
    await render()
    wrapper.vm.tab = 'feedback'
    await flushPromises()
    await wrapper.vm.openFeedback(21)
    await flushPromises()
    wrapper.vm.triage.reply = 'Brouillon de réponse'
    await wrapper.vm.openFeedback(22)
    await flushPromises()
    expect(wrapper.vm.triage.reply).toBe('')
    await wrapper.vm.openFeedback(21)
    await flushPromises()
    expect(wrapper.vm.triage.reply).toBe('Brouillon de réponse')
    mocks.patch.mockResolvedValue({
      data: { data: { ...feedbackItem({ status: 'acknowledged' }) } }
    })
    const shows = () =>
      mocks.get.mock.calls.filter(
        ([url]) => url === '/developer/beta/campaigns/5'
      ).length
    const before = shows()
    wrapper.vm.triage.reply = ''
    wrapper.vm.triage.status = 'acknowledged'
    await wrapper.vm.saveFeedback()
    await flushPromises()
    expect(mocks.patch).toHaveBeenCalledWith('/developer/beta/feedback/21', {
      status: 'acknowledged'
    })
    expect(shows()).toBe(before + 1)
  })

  it('shows a not-found state on 404', async () => {
    mocks.get.mockRejectedValue({ response: { status: 404 } })
    wrapper = shallowMount(DevBetaCampaignPage, options)
    await flushPromises()
    expect(wrapper.text()).toContain('Campagne introuvable.')
  })
})

describe('admin moderation', () => {
  it('requires a reason to reject and shows the private fields as text', async () => {
    mocks.get.mockResolvedValue(
      page([
        {
          ...devDetail({ status: 'pending' }),
          developer: { id: 2, name: 'Kofi' }
        }
      ])
    )
    mocks.post.mockResolvedValue({ data: {} })
    wrapper = shallowMount(AdminBetaPage, options)
    await flushPromises()
    expect(mocks.get).toHaveBeenCalledWith('/admin/beta/campaigns', {
      params: { status: 'pending', page: 1 }
    })
    wrapper.vm.open(wrapper.vm.$.setupState.items[0])
    await wrapper.vm.$nextTick()
    // The beta address is shown as text, never as a link.
    expect(wrapper.find('.beta-url-text').text()).toBe(SECRET)
    expect(wrapper.find(`a[href="${SECRET}"]`).exists()).toBe(false)
    await wrapper.vm.review('reject')
    expect(mocks.post).not.toHaveBeenCalled()
    expect(wrapper.vm.reasonMissing).toBe(true)
    wrapper.vm.reason = '  Lien inaccessible. '
    await wrapper.vm.review('reject')
    expect(mocks.post).toHaveBeenCalledWith('/admin/beta/campaigns/5/review', {
      decision: 'reject',
      reason: 'Lien inaccessible.'
    })
    expect(wrapper.vm.$.setupState.items).toHaveLength(0)
  })

  it('hides the private box when the API omits the private fields', async () => {
    mocks.get.mockResolvedValue(
      page([
        devDetail({
          status: 'approved',
          beta_url: undefined,
          instructions: undefined
        })
      ])
    )
    mocks.route.query = {}
    wrapper = shallowMount(AdminBetaPage, options)
    await flushPromises()
    wrapper.vm.open(wrapper.vm.$.setupState.items[0])
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.private-box').exists()).toBe(false)
    expect(wrapper.text()).toContain('Acceptation')
  })

  it('approves without a reason', async () => {
    mocks.get.mockResolvedValue(page([devDetail({ status: 'pending' })]))
    mocks.post.mockResolvedValue({ data: {} })
    wrapper = shallowMount(AdminBetaPage, options)
    await flushPromises()
    wrapper.vm.open(wrapper.vm.$.setupState.items[0])
    await wrapper.vm.review('approve')
    expect(mocks.post).toHaveBeenCalledWith('/admin/beta/campaigns/5/review', {
      decision: 'approve'
    })
  })
})

describe('beta access, navigation and safety', () => {
  it('guards every beta route behind the flag with a sensible way out', async () => {
    const { default: routes } = await import('@/router/routes')
    const flat = routes.flatMap(route =>
      (route.children || []).map(child => ({ ...child, parent: route.path }))
    )
    const beta = flat.filter(route => route.meta?.tool === 'beta')
    expect(beta.map(route => route.path)).toEqual([
      'account/beta',
      'beta',
      'beta/:id(\\d+)',
      'admin/beta',
      'beta',
      'beta/new',
      'beta/:id(\\d+)/edit',
      'beta/:id(\\d+)'
    ])
    const off = { tools: { beta: false } },
      on = { tools: { beta: true } }
    const exits = beta.map(route => resolveToolAccess(route, off))
    expect(exits).toEqual([
      '/account',
      '/',
      '/',
      '/admin',
      '/developer/lab',
      '/developer/lab',
      '/developer/lab',
      '/developer/lab'
    ])
    for (const route of beta) expect(resolveToolAccess(route, on)).toBe(true)
    const account = beta.find(route => route.path === 'account/beta')
    expect(account.meta.requiresAuth).toBe(true)
    const admin = beta.find(route => route.path === 'admin/beta')
    expect(admin.meta.permission).toBe('apps.moderate')
  })

  it('shows the developer tool card only when the flag is on', async () => {
    mocks.tools.value = { beta: false }
    const stubs = {
      RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
      QIcon: true
    }
    wrapper = mount(DeveloperToolsNav, { global: { stubs } })
    expect(
      wrapper.findAll('a').some(a => a.attributes('href') === '/developer/beta')
    ).toBe(false)
    mocks.tools.value = { beta: true }
    await wrapper.vm.$nextTick()
    expect(
      wrapper.findAll('a').some(a => a.attributes('href') === '/developer/beta')
    ).toBe(true)
    expect(wrapper.text()).toContain('Tests bêta')
  })

  it('shows the admin entry only with the flag and the permission', async () => {
    const targets = () =>
      wrapper.findAll('q-route-tab').map(tab => tab.attributes('to'))
    mocks.tools.value = { beta: false }
    wrapper = shallowMount(AdminNav, options)
    expect(targets()).not.toContain('/admin/beta')
    mocks.tools.value = { beta: true }
    await wrapper.vm.$nextTick()
    expect(targets()).toContain('/admin/beta')
    mocks.auth.user = { admin_permissions: ['users.manage'] }
    await wrapper.vm.$nextTick()
    expect(targets()).not.toContain('/admin/beta')
    mocks.auth.user = { admin_permissions: ['apps.moderate'] }
  })

  it('adds the store links only when the flag is on', () => {
    const layout = readFileSync('src/layouts/MainLayout.vue', 'utf8')
    expect(layout).toMatch(/v-if="tools\.beta"\s+to="\/beta"/)
    expect(layout).toMatch(/<template v-if="tools\.beta">/)
  })

  it('adds no v-html: rich text goes through the existing sanitizer', () => {
    for (const file of [
      'src/pages/store/BetaCatalogPage.vue',
      'src/pages/store/BetaCampaignPage.vue',
      'src/pages/account/MyBetaTestsPage.vue',
      'src/pages/developer/BetaPage.vue',
      'src/pages/developer/BetaCampaignFormPage.vue',
      'src/pages/developer/BetaCampaignPage.vue',
      'src/pages/admin/AdminBetaPage.vue',
      'src/components/beta/BetaApplyDialog.vue',
      'src/components/beta/BetaFeedbackForm.vue',
      'src/components/beta/BetaMyFeedback.vue',
      'src/components/beta/BetaQuestionBuilder.vue'
    ])
      expect(readFileSync(file, 'utf8')).not.toContain('v-html')
  })
})

describe('review fixes', () => {
  it('reads date-only and end-of-day values without shifting the day', () => {
    expect(betaDate('2026-11-20')).toBe('20 nov. 2026')
    expect(betaDate('2026-11-20T23:59:59')).toBe('20 nov. 2026')
    expect(betaDate('2026-11-20T23:59:59.000000Z')).toBe('20 nov. 2026')
    expect(betaDate('2026-10-20T00:00:00+03:00')).toBe('20 oct. 2026')
    const form = {
      ...campaignForm(),
      application_id: 4,
      name: 'X',
      starts_at: '2026-10-20',
      ends_at: '2026-10-19'
    }
    expect(campaignProblems(form, { complete: false }).ends_at).toBe(
      'La fin doit être après le début.'
    )
    expect(
      campaignProblems({ ...form, ends_at: '2026-10-20' }, { complete: false })
        .ends_at
    ).toBeUndefined()
  })

  it('opens upcoming campaigns to applications and says when the test opens', () => {
    expect(participationState(publicCampaign())).toBe('upcoming')
    expect(
      participationState(publicCampaign({ starts_at: '2026-10-15' }))
    ).toBe('open')
  })

  it('explains why an accepted tester has no access', () => {
    const campaign = overrides => ({
      status: 'approved',
      starts_at: '2026-10-01',
      ends_at: '2026-11-20',
      ...overrides
    })
    expect(accessPausedReason(campaign({ status: 'pending' }))).toContain(
      'Campagne en cours de revalidation'
    )
    expect(accessPausedReason(campaign({ status: 'rejected' }))).toBe(
      'Campagne suspendue par la modération.'
    )
    expect(accessPausedReason(campaign({ status: 'closed' }))).toContain(
      'Le test est terminé'
    )
    expect(accessPausedReason(campaign({ ends_at: '2026-10-10' }))).toContain(
      'Le test est terminé'
    )
    expect(accessPausedReason(campaign({ starts_at: '2026-10-20' }))).toBe(
      'Le test commence le 20 oct. 2026.'
    )
  })

  it('refuses long and duplicate choices', () => {
    const question = {
      key: 'k',
      id: 'q_a',
      label: 'Fréquence',
      type: 'choice',
      options: ['Souvent', ' souvent '],
      required: false
    }
    const base = { ...campaignForm(), application_id: 4, name: 'X' }
    expect(
      campaignProblems({ ...base, questions: [question] }, { complete: false })
        .question_k
    ).toContain('deux choix sont identiques')
    expect(
      campaignProblems(
        {
          ...base,
          questions: [{ ...question, options: ['a'.repeat(101), 'b'] }]
        },
        { complete: false }
      ).question_k
    ).toContain('100 caractères au maximum par choix')
  })

  it('summarises rich text as plain text', () => {
    expect(
      richTextSummary('<p>Bonjour<script>alert(1)</script></p><p>monde</p>')
    ).toBe('Bonjour monde')
    expect(richTextSummary('<p>' + 'a'.repeat(300) + '</p>', 10)).toBe(
      'aaaaaaaaa…'
    )
  })

  it('shows "Ouvre le" on an upcoming catalogue card', async () => {
    mocks.get.mockResolvedValue(page([publicCampaign()]))
    wrapper = shallowMount(BetaCatalogPage, options)
    await flushPromises()
    expect(wrapper.find('.upcoming').text()).toBe('Ouvre le 20 oct. 2026')
    // The link keeps its own content as accessible name.
    expect(
      wrapper.find('router-link[to="/beta/5"]').attributes('aria-label')
    ).toBeUndefined()
  })

  it('keeps the catalogue working when the countries cannot be loaded', async () => {
    const countries = await import('@/utils/countries')
    const spy = vi
      .spyOn(countries, 'activeCountries')
      .mockRejectedValue(new Error('offline'))
    mocks.get.mockResolvedValue(page([publicCampaign()]))
    wrapper = shallowMount(BetaCatalogPage, options)
    await flushPromises()
    expect(wrapper.text()).toContain('CI')
    spy.mockRestore()
  })

  it('collapses own feedback to text and loads previews for the expanded one only', async () => {
    const { default: BetaMyFeedback } =
      await import('@/components/beta/BetaMyFeedback.vue')
    const own = (id, overrides = {}) => ({
      id,
      type: 'bug',
      title: `Retour ${id}`,
      body: `<p>Corps ${id}<img src=x onerror="alert(1)"></p>`,
      steps: '1. Ouvrir',
      device: 'Android 14',
      status: 'new',
      developer_reply: 'Merci',
      replied_at: null,
      attachments: [{ id: 3, name: 'a.png', size: 10, mime: 'image/png' }],
      created_at: '2026-10-12T10:00:00Z',
      ...overrides
    })
    mocks.get.mockImplementation(url =>
      url === '/account/beta/1/feedback'
        ? Promise.resolve(page([own(1), own(2)]))
        : Promise.resolve({ data: new Blob(['x']) })
    )
    globalThis.URL.createObjectURL ||= () => 'blob:x'
    globalThis.URL.revokeObjectURL ||= () => {}
    wrapper = shallowMount(BetaMyFeedback, {
      ...options,
      props: { participationId: 1 }
    })
    await flushPromises()
    expect(wrapper.find('.suggestion-body').exists()).toBe(false)
    expect(wrapper.text()).toContain('Corps 1')
    expect(wrapper.text()).toContain('Android 14')
    expect(wrapper.text()).toContain('1. Ouvrir')
    expect(wrapper.text()).toContain('Merci')
    expect(wrapper.html()).not.toContain('onerror')
    expect(
      mocks.get.mock.calls.some(([url]) => url.includes('/attachments/'))
    ).toBe(false)
    wrapper.vm.expanded = 2
    await flushPromises()
    expect(wrapper.findAll('.suggestion-body')).toHaveLength(1)
    expect(mocks.get).toHaveBeenCalledWith('/beta/feedback/2/attachments/3', {
      responseType: 'blob'
    })
    expect(
      mocks.get.mock.calls.some(
        ([url]) => url === '/beta/feedback/1/attachments/3'
      )
    ).toBe(false)
    wrapper.vm.add(own(9, { body: '<p>Nouveau</p>', attachments: [] }))
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Retour 9')
  })

  it('keeps the tester form mounted when closed and adds a sent feedback without remounting', async () => {
    const participation = {
      id: 1,
      status: 'accepted',
      applied_at: '2026-10-11T10:00:00Z',
      campaign: {
        id: 5,
        name: 'Bêta 2.0',
        application: { id: 4, name: 'Alpha', icon_url: null },
        ends_at: '2026-11-20',
        status: 'approved'
      },
      access: { beta_url: SECRET, instructions: null },
      feedback_count: 1
    }
    mocks.get.mockImplementation(url =>
      url === '/account/beta'
        ? Promise.resolve(page([participation]))
        : Promise.resolve(page([]))
    )
    wrapper = shallowMount(MyBetaTestsPage, {
      global: {
        ...options.global,
        stubs: { ...options.global.stubs, BetaMyFeedback: false }
      }
    })
    await flushPromises()
    const item = wrapper.vm.items[0]
    wrapper.vm.toggleForm(item)
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent(BetaFeedbackForm).exists()).toBe(true)
    wrapper.vm.toggleForm(item)
    await wrapper.vm.$nextTick()
    // Closed but still mounted: the draft survives.
    expect(wrapper.findComponent(BetaFeedbackForm).exists()).toBe(true)
    wrapper.vm.listOpen[1] = true
    await flushPromises()
    const lists = () =>
      mocks.get.mock.calls.filter(([url]) => url === '/account/beta/1/feedback')
        .length
    expect(lists()).toBe(1)
    wrapper.vm.onSent(item, {
      id: 70,
      title: 'Neuf',
      type: 'bug',
      status: 'new'
    })
    await flushPromises()
    expect(lists()).toBe(1)
    expect(item.feedback_count).toBe(2)
    expect(wrapper.text()).toContain('Neuf')
  })

  it('thanks an automatically accepted tester differently', async () => {
    wrapper = mount(BetaApplyDialog, {
      props: { campaign: publicCampaign({ questions: [] }), modelValue: true },
      global: {
        stubs: {
          QDialog: { template: '<div><slot /></div>' },
          QCard: { template: '<div v-bind="$attrs"><slot /></div>' },
          QCardSection: { template: '<div><slot /></div>' },
          QCardActions: { template: '<div><slot /></div>' },
          QBtn: true,
          QBanner: true,
          QIcon: true
        },
        directives: { closePopup: {} },
        config: { warnHandler() {} }
      }
    })
    const card = wrapper.find('[aria-labelledby]')
    expect(
      wrapper.find(`#${card.attributes('aria-labelledby')}`).text()
    ).toContain('Participer à « Bêta 2.0 »')
    await wrapper.find('input.accept-terms').setValue(true)
    mocks.post.mockResolvedValue({
      data: { data: { id: 9, status: 'accepted' } }
    })
    await wrapper.vm.send()
    expect(mocks.notify).toHaveBeenCalledWith({
      type: 'positive',
      message:
        'Vous êtes accepté ! L’accès à la version bêta est dans « Mes tests ».'
    })
  })

  it('keeps the suggestion download path when no loader is given', async () => {
    const { default: SuggestionDetail } =
      await import('@/components/SuggestionDetail.vue')
    mocks.get.mockResolvedValue({ data: new Blob(['x']) })
    globalThis.URL.createObjectURL ||= () => 'blob:x'
    globalThis.URL.revokeObjectURL ||= () => {}
    wrapper = shallowMount(SuggestionDetail, {
      ...options,
      props: {
        suggestion: {
          id: 7,
          body: '<p>x</p>',
          attachments: [{ id: 3, name: 'a.png', size: 1, is_image: true }]
        }
      }
    })
    await flushPromises()
    expect(mocks.get).toHaveBeenCalledWith('/suggestions/7/attachments/3', {
      responseType: 'blob'
    })
  })
})
