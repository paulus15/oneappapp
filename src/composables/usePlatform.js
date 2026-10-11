import { ref } from 'vue'
import { api } from '@/boot/axios'

// Platform capabilities, fetched once per session.
const platform = ref(null)
let pending = null

export function usePlatform() {
  if (!platform.value && !pending)
    pending = api
      .get('/platform')
      .then(({ data }) => (platform.value = data))
      .catch(() => (platform.value = { build_hosting: false }))
      .finally(() => (pending = null))
  return { platform }
}
