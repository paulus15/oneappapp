import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { toCard } from '@/utils/appCard'

const mocks = vi.hoisted(() => ({
  publishers: vi.fn(),
  createPublisher: vi.fn(),
  updatePublisher: vi.fn(),
  publisherApplications: vi.fn(),
  assignPublisher: vi.fn(),
  notify: vi.fn()
}))
vi.mock('@/services/admin', () => ({ adminApi: mocks }))
vi.mock('@/services/account', () => ({ apiMessage: error => error.message }))
vi.mock('quasar', async load => ({
  ...(await load()),
  useQuasar: () => ({ notify: mocks.notify })
}))
import Page from '@/pages/admin/AdminPublishersPage.vue'
let wrapper
beforeEach(() => {
  vi.clearAllMocks()
  mocks.publishers.mockResolvedValue({ data: { data: [], last_page: 1 } })
  mocks.publisherApplications.mockResolvedValue({
    data: { data: [], last_page: 1 }
  })
  mocks.assignPublisher.mockResolvedValue({ data: {} })
})
afterEach(() => wrapper?.unmount())
async function mount() {
  wrapper = shallowMount(Page, { global: { config: { warnHandler() {} } } })
  await flushPromises()
}
describe('admin publishing identities', () => {
  it('creates an entity using public fields without any developer account', async () => {
    mocks.createPublisher.mockResolvedValue({
      data: { id: 4, type: 'organization', public_name: 'Company' }
    })
    await mount()
    wrapper.vm.form.public_name = 'Company'
    await wrapper.vm.save()
    expect(mocks.createPublisher).toHaveBeenCalledWith({
      type: 'organization',
      public_name: 'Company',
      description: null,
      website: null
    })
    expect(wrapper.vm.form.id).toBe(4)
  })
  it('links and unlinks using explicit entity IDs and null', async () => {
    await mount()
    wrapper.vm.edit({ id: 4, type: 'individual', public_name: 'Publisher' })
    await wrapper.vm.assign(17, 4)
    expect(mocks.assignPublisher).toHaveBeenLastCalledWith(17, 4)
    await wrapper.vm.assign(17, null)
    expect(mocks.assignPublisher).toHaveBeenLastCalledWith(17, null)
  })
  it('displays entity names on app cards with the existing developer as fallback', () => {
    const app = {
      id: 17,
      developer: { developer_profile: { public_name: 'Developer' } }
    }
    expect(toCard(app).publisher).toBe('Developer')
    expect(
      toCard({ ...app, publisher: { public_name: 'Independent company' } })
        .publisher
    ).toBe('Independent company')
  })
})
