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
    state.tools = ref({ feedback_hub: false, monitor: false, growth: true })
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
      '/developer/suggestions'
    ])
    expect(wrapper.find('a').attributes('aria-current')).toBe('page')
    expect(wrapper.text()).not.toContain('PWA Monitor')
    // Growth is flagged on but has no page yet: it stays hidden.
    expect(wrapper.text()).not.toContain('PWA Growth')
    state.tools.value.monitor = true
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('a').map(link => link.attributes('href'))).toEqual([
      '/developer/lab',
      '/developer/monitor',
      '/developer/suggestions'
    ])
    expect(wrapper.text()).toContain('PWA Monitor')
  })
})
