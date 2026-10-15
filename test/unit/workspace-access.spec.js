import { reactive } from 'vue'
import { describe, expect, it, vi } from 'vitest'

const { state } = vi.hoisted(() => ({ state: {} }))
vi.mock('quasar', () => ({ useQuasar: () => ({ screen: state.screen }) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => state.auth }))
import { useWorkspaceAccess } from '@/composables/useWorkspaceAccess'

describe('workspace access across screen sizes', () => {
  it('preserves developer capabilities when resizing and hides access when revoked', () => {
    state.screen = reactive({ width: 1280 })
    state.auth = reactive({ isDeveloper: true })
    const access = useWorkspaceAccess()
    expect(access.developerView.value).toBe(true)
    state.screen.width = 390
    expect(access.isMobile.value).toBe(true)
    expect(access.developerView.value).toBe(true)
    state.auth.isDeveloper = false
    expect(access.developerView.value).toBe(false)
  })
})
