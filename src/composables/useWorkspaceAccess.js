import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
export function useWorkspaceAccess() {
  const q = useQuasar(),
    auth = useAuthStore()
  const isMobile = computed(() => q.screen.width < 768)
  return {
    isMobile,
    developerView: computed(
      () =>
        !isMobile.value &&
        auth.isDeveloper &&
        (!!auth.user?.developer_profile || auth.user?.role === 'developer')
    )
  }
}
