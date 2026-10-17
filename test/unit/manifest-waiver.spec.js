import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { setLocale } from '@/i18n'

const mocks = vi.hoisted(() => ({
  submissionSettings: vi.fn(),
  submissionReadiness: vi.fn(),
  submitPublisherApplication: vi.fn(),
  notify: vi.fn(),
  dialog: vi.fn(),
  confirm: null
}))
vi.mock('@/services/admin', () => ({
  adminApi: {
    submissionSettings: mocks.submissionSettings,
    submissionReadiness: mocks.submissionReadiness,
    submitPublisherApplication: mocks.submitPublisherApplication
  }
}))
vi.mock('@/services/account', () => ({ apiMessage: error => error.message }))
vi.mock('quasar', async load => ({
  ...(await load()),
  useQuasar: () => ({ notify: mocks.notify, dialog: mocks.dialog })
}))
import AdminApplicationSubmission from '@/components/AdminApplicationSubmission.vue'
import ManifestWaiverNotice from '@/components/ManifestWaiverNotice.vue'

const QToggle = {
  name: 'QToggle',
  props: ['modelValue', 'label', 'disable'],
  emits: ['update:modelValue'],
  template:
    '<label class="q-toggle" :data-on="String(modelValue)">{{ label }}</label>'
}
let wrapper
beforeEach(async () => {
  vi.clearAllMocks()
  await setLocale('fr')
  mocks.dialog.mockImplementation(() => ({
    onOk(fn) {
      mocks.confirm = fn
      return this
    }
  }))
})
afterEach(() => wrapper?.unmount())

function render(application) {
  wrapper = mount(AdminApplicationSubmission, {
    props: {
      application: {
        id: 7,
        source_type: 'url',
        status: 'draft',
        ...application
      }
    },
    global: {
      stubs: { QToggle, 'q-toggle': QToggle, 'q-btn': true },
      config: { warnHandler() {} }
    }
  })
  const toggles = wrapper.findAllComponents(QToggle)
  return { script: toggles[0], manifest: toggles[1] }
}

describe('admin submission requirements', () => {
  it('renders both toggles from the backend payload, manifest checked by default', () => {
    let { script, manifest } = render({ sdk_check_required: true })
    expect(script.props('label')).toBe(
      'Contrôle du script obligatoire avant soumission'
    )
    expect(manifest.props('label')).toBe('Manifeste PWA obligatoire')
    expect(manifest.props('modelValue')).toBe(true)
    expect(wrapper.text()).toContain('Décochez pour permettre la soumission')
    wrapper.unmount()
    ;({ script, manifest } = render({
      sdk_check_required: false,
      manifest_required: false
    }))
    expect(script.props('modelValue')).toBe(false)
    expect(manifest.props('modelValue')).toBe(false)
  })

  it('asks for confirmation before waiving the manifest, then sends only that flag', async () => {
    mocks.submissionSettings.mockResolvedValue({
      data: { sdk_check_required: true, manifest_required: false }
    })
    const { manifest } = render({
      sdk_check_required: true,
      manifest_required: true
    })
    manifest.vm.$emit('update:modelValue', false)
    expect(mocks.dialog).toHaveBeenCalledTimes(1)
    expect(mocks.submissionSettings).not.toHaveBeenCalled()
    mocks.confirm()
    await flushPromises()
    expect(mocks.submissionSettings).toHaveBeenCalledWith(7, {
      manifest_required: false
    })
    expect(manifest.props('modelValue')).toBe(false)
    expect(mocks.notify).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'positive' })
    )
  })

  it('requires the manifest again without confirmation', async () => {
    mocks.submissionSettings.mockResolvedValue({
      data: { sdk_check_required: true, manifest_required: true }
    })
    const { manifest } = render({ manifest_required: false })
    manifest.vm.$emit('update:modelValue', true)
    await flushPromises()
    expect(mocks.dialog).not.toHaveBeenCalled()
    expect(mocks.submissionSettings).toHaveBeenCalledWith(7, {
      manifest_required: true
    })
    expect(manifest.props('modelValue')).toBe(true)
  })

  it('keeps the script toggle payload unchanged', async () => {
    mocks.submissionSettings.mockResolvedValue({
      data: { sdk_check_required: false, manifest_required: true }
    })
    const { script, manifest } = render({ sdk_check_required: true })
    script.vm.$emit('update:modelValue', false)
    await flushPromises()
    expect(mocks.dialog).not.toHaveBeenCalled()
    expect(mocks.submissionSettings).toHaveBeenCalledWith(7, {
      sdk_check_required: false
    })
    expect(script.props('modelValue')).toBe(false)
    expect(manifest.props('modelValue')).toBe(true)
    expect(wrapper.text()).toContain(
      'l’exigence du manifeste PWA n’en dépend pas'
    )
  })

  it('shows no toggles for uploaded builds', () => {
    const { script, manifest } = render({ source_type: 'build' })
    expect(script).toBeUndefined()
    expect(manifest).toBeUndefined()
  })
})

describe('developer recap', () => {
  const notice = application =>
    mount(ManifestWaiverNotice, {
      props: { application: { source_type: 'url', ...application } },
      global: { stubs: ['q-icon'] }
    })

  it('shows the waiver info line only when the manifest is optional', () => {
    expect(notice({ manifest_required: false }).text()).toBe(
      'Manifeste PWA facultatif pour cette application (décision de l’administration).'
    )
    expect(
      notice({ manifest_required: true })
        .find('[data-test="manifest-waived"]')
        .exists()
    ).toBe(false)
    expect(notice({}).find('[data-test="manifest-waived"]').exists()).toBe(
      false
    )
    expect(
      notice({ source_type: 'build', manifest_required: false })
        .find('[data-test="manifest-waived"]')
        .exists()
    ).toBe(false)
  })
})
