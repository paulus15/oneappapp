import { computed, ref, shallowRef, getCurrentScope, onScopeDispose } from 'vue'

// Laravel paginators answer { data, last_page, total }; API resources nest them under `meta`.
export function pageOf(body) {
  const items = Array.isArray(body?.data) ? body.data : []
  const lastPage = Number(body?.last_page ?? body?.meta?.last_page) || 1
  const total = Number(body?.total ?? body?.meta?.total ?? items.length) || 0
  return { items, lastPage: Math.max(1, lastPage), total }
}

/**
 * Server-side pages shown as one growing list ("Voir plus").
 * `fetchPage(page)` returns the response body of one page. `reload()` starts over (filters
 * changed); `loadMore()` appends the next page. Late answers of an older list are ignored.
 */
export function useLoadMore(fetchPage) {
  const items = ref([]),
    total = ref(0),
    page = ref(0),
    lastPage = ref(1),
    loading = ref(false),
    loadingMore = ref(false),
    error = ref(false),
    moreError = ref(false),
    // The last raw page, for extra fields (counts…).
    last = shallowRef(null)
  const hasMore = computed(() => page.value > 0 && page.value < lastPage.value)
  let generation = 0
  if (getCurrentScope())
    onScopeDispose(() => {
      generation++
    })

  async function load(next, append) {
    const current = generation
    try {
      const body = await fetchPage(next)
      if (current !== generation) return
      const result = pageOf(body)
      const seen = new Set(append ? items.value.map(item => item?.id) : [])
      items.value = append
        ? [
            ...items.value,
            ...result.items.filter(
              item => item?.id == null || !seen.has(item.id)
            )
          ]
        : result.items
      total.value = result.total
      lastPage.value = result.lastPage
      page.value = next
      last.value = body
    } catch (e) {
      if (current !== generation) return
      if (append) moreError.value = true
      else {
        items.value = []
        total.value = 0
        lastPage.value = 1
        page.value = 0
        error.value = true
      }
      // Kept for callers that show the server message.
      last.value = e
    }
  }

  async function reload() {
    generation++
    loading.value = true
    items.value = []
    total.value = 0
    page.value = 0
    last.value = null
    loadingMore.value = false
    error.value = false
    moreError.value = false
    const current = generation
    await load(1, false)
    if (current === generation) loading.value = false
  }

  async function loadMore() {
    if (loading.value || loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    moreError.value = false
    const current = generation
    await load(page.value + 1, true)
    if (current === generation) loadingMore.value = false
  }

  return {
    items,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    moreError,
    last,
    reload,
    loadMore
  }
}
