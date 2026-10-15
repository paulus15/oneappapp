import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

const { state } = vi.hoisted(() => ({ state: {} }))
vi.mock('@/composables/usePlatform', () => ({ usePlatform: () => state }))
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/developer/lab' }) }))
vi.mock('@/i18n/text', () => ({ ui: text => text }))
import DeveloperToolsNav from '@/components/DeveloperToolsNav.vue'

describe('developer tools navigation', () => {
  it('keeps diagnostics available and exposes only enabled, implemented tools', async () => {
    state.tools = ref({ feedback_hub: false, monitor: false, growth: false })
    const wrapper = mount(DeveloperToolsNav, {
      global: {
        stubs: {
          RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
          QIcon: true
        }
      }
    })
    expect(wrapper.findAll('a').map(link => link.attributes('href'))).toEqual([
      '/developer/lab'
    ])
    state.tools.value.feedback_hub = true
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('a').map(link => link.attributes('href'))).toEqual([
      '/developer/lab',
      '/developer/feedback'
    ])
    expect(wrapper.find('a').attributes('aria-current')).toBe('page')
    expect(wrapper.text()).toContain('Retours utilisateurs')
    expect(wrapper.text()).not.toContain('Feedback Hub')
    expect(wrapper.text()).not.toContain('PWA Monitor')
    expect(wrapper.text()).not.toContain('Promouvoir mon application')
    state.tools.value.monitor = true
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('a').map(link => link.attributes('href'))).toEqual([
      '/developer/lab',
      '/developer/monitor',
      '/developer/feedback'
    ])
    expect(wrapper.text()).toContain('PWA Monitor')
    // Growth comes right after Monitor once its flag is on.
    state.tools.value.growth = true
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('a').map(link => link.attributes('href'))).toEqual([
      '/developer/lab',
      '/developer/monitor',
      '/developer/growth',
      '/developer/feedback'
    ])
    expect(wrapper.text()).toContain('Promouvoir mon application')
  })
})
