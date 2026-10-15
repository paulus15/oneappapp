import { computed, ref } from 'vue'
import { api } from '@/boot/axios'

// Platform capabilities, fetched once per session.
const platform = ref(null)
let pending = null

export const DEFAULT_TOOLS = Object.freeze({
  monitor: false,
  growth: false,
  feedback_hub: false,
  lab_pro: false,
  beta: false,
  integrations: false,
  assistant: false
})

function normalizePlatform(data = {}) {
  return {
    ...data,
    build_hosting: data.build_hosting === true,
    tools: Object.fromEntries(
      Object.keys(DEFAULT_TOOLS).map(key => [key, data.tools?.[key] === true])
    )
  }
}

// Share the same request between layout, pages and route guards.
export function loadPlatform({ refresh = false } = {}) {
  if (pending) return pending
  if (platform.value && !refresh) return Promise.resolve(platform.value)
  pending = api
    // Platform capabilities never depend on a visitor country. This also keeps
    // the initial maintenance check independent of country detection.
    .get('/platform', { skipCountryDetection: true })
    .then(({ data }) => (platform.value = normalizePlatform(data)))
    .catch(() => (platform.value = normalizePlatform()))
    .finally(() => (pending = null))
  return pending
}

export function usePlatform() {
  void loadPlatform()
  return {
    platform,
    tools: computed(() => platform.value?.tools || DEFAULT_TOOLS),
    refresh: () => loadPlatform({ refresh: true })
  }
}
