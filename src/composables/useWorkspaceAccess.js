import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
export function useWorkspaceAccess() {
  const q = useQuasar(),
    auth = useAuthStore()
  const isMobile = computed(() => q.screen.width < 768)
  return {
    isMobile,
    // Server capabilities govern access on every screen size.
    developerView: computed(() => auth.isDeveloper)
  }
}
