import { ref } from 'vue'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'

// Provided by AdminLayout: pages rendered inside it drop their own AdminNav tabs.
export const ADMIN_LAYOUT_KEY = Symbol('admin-layout')

// Shared between the sidebar badges and the dashboard: a refresh updates both.
const overview = ref(null),
  loading = ref(false),
  error = ref('')
let seq = 0

export async function loadAdminOverview() {
  const current = ++seq
  loading.value = true
  error.value = ''
  try {
    const { data } = await adminApi.overview()
    if (current !== seq) return
    overview.value = data?.data || null
  } catch (e) {
    if (current !== seq) return
    error.value = apiMessage(e)
  } finally {
    if (current === seq) loading.value = false
  }
}

export function resetAdminOverview() {
  seq++
  overview.value = null
  loading.value = false
  error.value = ''
}

export function useAdminOverview() {
  return { overview, loading, error, load: loadAdminOverview }
}
