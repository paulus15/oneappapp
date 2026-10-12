import { beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/boot/axios', () => ({ api: { get, post } }))
import ExternalResourcesReport from '@/components/ExternalResourcesReport.vue'
const resource = {
  id: 10,
  hostname: 'api.example.com',
  normalized_url: 'https://api.example.com/v1',
  resource_type: 'connect',
  classification: 'business_api',
  risk_level: 'review',
  occurrences: 3,
  source_files: ['app.js', 'config.json'],
  review_status: 'pending',
  observations: []
}
const report = {
  resources: [resource],
  domain_count: 1,
  resource_count: 1,
  occurrence_count: 3,
  limitation: 'Analyse statique limitée.',
  analyzed: true,
  comparison: {
    added_domains: ['api.example.com'],
    removed_domains: [],
    changed_types: [],
    new_risks: []
  },
  can_review: false
}
function mountReport() {
  return mount(ExternalResourcesReport, {
    props: { version: { id: 8, detected_domains: ['api.example.com'] } },
    global: {
      stubs: {
        QExpansionItem: {
          props: ['label', 'caption'],
          template:
            '<section><button @click="$emit(\'before-show\')">{{ label }}</button><span>{{ caption }}</span><slot /></section>'
        },
        QBtn: { props: ['label'], template: '<button>{{ label }}</button>' },
        QDialog: { template: '<div />' },
        QCard: { template: '<article><slot /></article>' },
        QBanner: { template: '<div role="alert"><slot /></div>' },
        QSelect: true,
        QBadge: { template: '<span><slot /></span>' },
        QLinearProgress: true
      }
    }
  })
}
beforeEach(() => {
  get.mockReset()
  post.mockReset()
})
it('loads the exact version report and shows provenance and new domains to the developer', async () => {
  get.mockResolvedValue({ data: report })
  const wrapper = mountReport()
  expect(get).not.toHaveBeenCalled()
  await wrapper.find('button').trigger('click')
  await flushPromises()
  expect(get).toHaveBeenCalledWith('/versions/8/external-resources')
  expect(wrapper.text()).toContain('app.js, config.json')
  expect(wrapper.text()).toContain('3 occurrences')
  expect(wrapper.text()).toContain('Nouveau domaine')
  expect(wrapper.text()).not.toContain('Examiner / ajouter une observation')
})
it('shows review controls only when the server grants review access', async () => {
  get.mockResolvedValue({ data: { ...report, can_review: true } })
  const wrapper = mountReport()
  await wrapper.find('button').trigger('click')
  await flushPromises()
  expect(wrapper.text()).toContain('Examiner / ajouter une observation')
})
it('displays API errors instead of inventing an empty successful analysis', async () => {
  get.mockRejectedValue({
    response: { data: { message: 'Rapport indisponible' } }
  })
  const wrapper = mountReport()
  await wrapper.find('button').trigger('click')
  await flushPromises()
  expect(wrapper.find('[role="alert"]').text()).toContain(
    'Rapport indisponible'
  )
})
