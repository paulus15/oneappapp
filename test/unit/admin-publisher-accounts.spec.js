import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  publisherAccounts: vi.fn(),
  linkPublisherAccount: vi.fn(),
  unlinkPublisherAccount: vi.fn(),
  notify: vi.fn()
}))
vi.mock('@/services/admin', () => ({ adminApi: mocks }))
vi.mock('@/services/account', () => ({ apiMessage: error => error.message }))
vi.mock('quasar', async load => ({
  ...(await load()),
  useQuasar: () => ({ notify: mocks.notify })
}))
import Accounts from '@/components/AdminPublisherAccounts.vue'
let wrapper
beforeEach(() => {
  vi.resetAllMocks()
  mocks.publisherAccounts.mockResolvedValue({
    data: { data: [], last_page: 1 }
  })
  mocks.linkPublisherAccount.mockResolvedValue({})
  mocks.unlinkPublisherAccount.mockResolvedValue({})
})
afterEach(() => wrapper?.unmount())
async function mount() {
  wrapper = shallowMount(Accounts, {
    props: { publisherId: 4 },
    global: { config: { warnHandler() {} } }
  })
  await flushPromises()
}
describe('accounts linked to an entity', () => {
  it('lists linked accounts and searches available accounts within the selected entity', async () => {
    await mount()
    expect(mocks.publisherAccounts).toHaveBeenCalledWith(4, {
      linked: 1,
      page: 1
    })
    const account = {
      id: 8,
      name: 'Jane',
      email: 'jane@example.org',
      role: 'user'
    }
    mocks.publisherAccounts.mockResolvedValue({
      data: { data: [account], last_page: 1 }
    })
    await wrapper.vm.findAccounts('jane', callback => callback(), vi.fn())
    expect(mocks.publisherAccounts).toHaveBeenLastCalledWith(4, {
      linked: 0,
      search: 'jane'
    })
    expect(wrapper.vm.options).toEqual([account])
  })
  it('links and detaches accounts then reloads the member list', async () => {
    await mount()
    await wrapper.vm.link(8)
    expect(mocks.linkPublisherAccount).toHaveBeenCalledWith(4, 8)
    await wrapper.vm.unlink(8)
    expect(mocks.unlinkPublisherAccount).toHaveBeenCalledWith(4, 8)
    expect(mocks.publisherAccounts).toHaveBeenCalledTimes(3)
  })
  it('reports a rejected link and keeps the selection for retry', async () => {
    await mount()
    wrapper.vm.account = { id: 8 }
    mocks.linkPublisherAccount.mockRejectedValue(
      new Error('Permission refusée')
    )
    await wrapper.vm.link(8)
    expect(wrapper.vm.error).toBe('Permission refusée')
    expect(wrapper.vm.account.id).toBe(8)
    expect(wrapper.vm.saving).toBe(false)
    expect(mocks.notify).not.toHaveBeenCalled()
  })
  it('ignores stale account search responses', async () => {
    await mount()
    let resolveOld
    mocks.publisherAccounts.mockReturnValueOnce(
      new Promise(resolve => {
        resolveOld = resolve
      })
    )
    const updateOld = vi.fn(),
      abortOld = vi.fn()
    const old = wrapper.vm.findAccounts('old', updateOld, abortOld)
    await wrapper.vm.findAccounts('new', callback => callback(), vi.fn())
    resolveOld({ data: { data: [{ id: 99 }], last_page: 1 } })
    await old
    expect(updateOld).not.toHaveBeenCalled()
    expect(abortOld).toHaveBeenCalledOnce()
    expect(wrapper.vm.options).toEqual([])
  })
})
