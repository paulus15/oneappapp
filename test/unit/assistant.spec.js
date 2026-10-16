import { describe, expect, it, vi, beforeEach } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
const api = vi.hoisted(() => ({
  status: vi.fn(),
  history: vi.fn(),
  ask: vi.fn()
}))
vi.mock('@/services/assistant', () => ({ assistantApi: api }))
import LabAssistant from '@/components/lab/LabAssistant.vue'
import { canEnableAssistant } from '@/utils/aiSettings'
const record = {
  id: 1,
  answer: '<script>alert(1)</script>',
  model: 'deepseek-flash',
  created_at: '2026-10-16T12:00:00Z'
}
const mountPanel = () =>
  shallowMount(LabAssistant, {
    props: { analysisId: 7 },
    global: {
      stubs: {
        QBtn: true,
        QIcon: true,
        QSkeleton: true,
        QBanner: { template: '<aside><slot /></aside>' },
        QSelect: true,
        QInput: true,
        QSpinnerDots: true,
        QForm: {
          template: '<form @submit.prevent="$emit(\'submit\')"><slot /></form>'
        }
      }
    }
  })
beforeEach(() => {
  vi.clearAllMocks()
  api.status.mockResolvedValue({
    data: { data: { available: true, remaining_today: 3, daily_limit: 5 } }
  })
  api.history.mockResolvedValue({
    data: { data: [], current_page: 1, last_page: 1 }
  })
  api.ask.mockResolvedValue({
    data: { data: record, quota: { remaining_today: 2, daily_limit: 5 } }
  })
})
describe('Labo assistant', () => {
  it('does not allow unknown models or missing keys', () => {
    expect(
      canEnableAssistant(
        { has_key: true, models: [{ id: 'supported' }] },
        { model: 'removed' }
      )
    ).toBe(false)
    expect(
      canEnableAssistant(
        { has_key: false, models: [{ id: 'supported' }] },
        { model: 'supported' }
      )
    ).toBe(false)
    expect(
      canEnableAssistant(
        { has_key: true, models: [{ id: 'supported' }] },
        { model: 'supported' }
      )
    ).toBe(true)
  })
  it('does not fetch history or show the form when unconfigured', async () => {
    api.status.mockResolvedValue({ data: { data: { available: false } } })
    const wrapper = mountPanel()
    await flushPromises()
    expect(api.history).not.toHaveBeenCalled()
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('indisponible')
  })
  it('sends only analysis context and safely renders text, including code', async () => {
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.ask).toHaveBeenCalledWith({ analysis_id: 7, action: 'improve' })
    expect(wrapper.find('.answer-text').text()).toBe(record.answer)
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.text()).toContain('2 questions restantes')
  })
  it('passes the selected issue and loads subsequent history pages', async () => {
    api.history.mockResolvedValueOnce({
      data: { data: [record], current_page: 1, last_page: 2 }
    })
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.setProps({
      selectedCheck: { id: 'sw', label: 'Service worker' }
    })
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.ask).toHaveBeenCalledWith({
      analysis_id: 7,
      action: 'fix',
      check_id: 'sw'
    })
    const more = wrapper
      .findAll('q-btn-stub')
      .find(button => button.attributes('label') === 'Voir plus')
    await more.trigger('click')
    await flushPromises()
    expect(api.history).toHaveBeenLastCalledWith(7, 2)
  })
  it('prevents sends when daily quota is exhausted', async () => {
    api.status.mockResolvedValue({
      data: { data: { available: true, remaining_today: 0 } }
    })
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('form').trigger('submit')
    expect(api.ask).not.toHaveBeenCalled()
  })
  it('shows retryable provider errors and preserves the form', async () => {
    api.ask.mockRejectedValue({ response: { status: 503 } })
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('temporairement indisponible')
    expect(wrapper.find('form').exists()).toBe(true)
  })
  it('ignores a late answer after the displayed analysis changes', async () => {
    let resolve
    api.ask.mockReturnValue(
      new Promise(done => {
        resolve = done
      })
    )
    const wrapper = mountPanel()
    await flushPromises()
    await wrapper.find('form').trigger('submit')
    await wrapper.setProps({ analysisId: 8 })
    await flushPromises()
    resolve({ data: { data: record } })
    await flushPromises()
    expect(wrapper.find('.answer-text').exists()).toBe(false)
  })
})
