import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({ updateDeveloper: vi.fn(), notify: vi.fn() }))
vi.mock('@/services/account', () => ({
  accountApi: mocks,
  apiMessage: error => error.message
}))
vi.mock('quasar', async load => ({
  ...(await load()),
  useQuasar: () => ({ notify: mocks.notify })
}))
import Editor from '@/components/AdminDeveloperEdit.vue'
let wrapper
beforeEach(() => {
  vi.clearAllMocks()
  wrapper = shallowMount(Editor, { global: { config: { warnHandler() {} } } })
})
afterEach(() => wrapper.unmount())
const profile = {
  id: 7,
  user_id: 9,
  type: 'organization',
  status: 'verified',
  public_name: 'Studio',
  country_id: 1,
  business_email: 'old@example.test'
}

it('saves editable company fields without sending status or ownership and refreshes the list', async () => {
  wrapper.vm.edit(profile)
  const state = wrapper.vm.$.setupState
  state.form.business_email = 'new@example.test'
  state.form.reason = ' Correction demandée '
  await state.save()
  expect(mocks.updateDeveloper).toHaveBeenCalledWith(
    7,
    expect.objectContaining({
      business_email: 'new@example.test',
      country_id: 1,
      reason: 'Correction demandée'
    })
  )
  expect(mocks.updateDeveloper.mock.calls[0][1]).not.toHaveProperty('status')
  expect(mocks.updateDeveloper.mock.calls[0][1]).not.toHaveProperty('user_id')
  expect(profile.business_email).toBe('old@example.test')
  expect(wrapper.emitted('saved')).toHaveLength(1)
  expect(state.open).toBe(false)
})

it('keeps the form and entered values on failure and clears them for the next profile', async () => {
  mocks.updateDeveloper.mockRejectedValueOnce(new Error('Adresse invalide'))
  wrapper.vm.edit(profile)
  const state = wrapper.vm.$.setupState
  state.form.business_email = 'invalid'
  await state.save()
  expect(state.error).toBe('Adresse invalide')
  expect(state.open).toBe(true)
  expect(state.busy).toBe(false)
  expect(state.form.business_email).toBe('invalid')
  expect(wrapper.emitted('saved')).toBeUndefined()
  wrapper.vm.edit({ id: 8, type: 'individual' })
  expect(state.error).toBe('')
  expect(state.form.business_email).toBe('')
  expect(state.form.country_id).toBeNull()
})
