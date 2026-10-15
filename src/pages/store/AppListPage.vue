<template>
  <q-page class="workspace-page apps-page">
    <header class="workspace-heading">
      <span class="eyebrow">{{ t(`store.apps.${mode}.eyebrow`) }}</span>
      <h1>{{ t(`store.apps.${mode}.title`) }}</h1>
      <p>{{ t(`store.apps.${mode}.lead`) }}</p>
    </header>

    <div class="apps-toolbar">
      <label class="apps-search">
        <q-icon name="search" />
        <input
          v-model="search"
          type="search"
          :placeholder="t('store.apps.searchPlaceholder')"
          :aria-label="t('store.apps.searchLabel')"
          @input="debouncedSearch"
          @keyup.enter="applySearch"
        />
      </label>
      <q-select
        v-if="mode === 'all'"
        :model-value="sortBy"
        :options="sortOptions"
        :label="t('store.filters.sort')"
        dense
        outlined
        emit-value
        map-options
        class="apps-sort"
        @update:model-value="setSort"
      >
        <template #prepend><q-icon name="sort" size="xs" /></template>
      </q-select>
    </div>

    <nav
      v-if="categories.length"
      class="category-chips"
      :aria-label="t('store.apps.categoryFilter')"
    >
      <button
        type="button"
        class="chip"
        :class="{ active: !category }"
        :aria-pressed="!category"
        @click="setCategory('')"
      >
        <q-icon name="apps" />{{ t('store.apps.allCategories') }}
      </button>
      <button
        v-for="item in categories"
        :key="item.id"
        type="button"
        class="chip"
        :class="{ active: category === item.slug }"
        :aria-pressed="category === item.slug"
        :style="{
          '--chip-color': safeColor(item.color) || 'var(--pwa-primary)'
        }"
        @click="setCategory(item.slug)"
      >
        <q-icon :name="item.icon || 'category'" />{{ ui(item.name) }}
      </button>
    </nav>

    <p v-if="!loading && !error" class="apps-count" aria-live="polite">{{
      t('store.apps.count', { n: total }, total)
    }}</p>

    <EmptyState
      v-if="error"
      tone="error"
      icon="cloud_off"
      :title="ui('Catalogue indisponible')"
      :text="t('store.apps.error')"
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        :label="t('common.retry')"
        @click="reload"
      />
    </EmptyState>
    <template v-else>
      <AppGrid
        :apps="apps"
        :loading="loading"
        :empty="
          search.trim() || category
            ? t('store.apps.emptyFiltered')
            : t('store.apps.empty')
        "
        :empty-icon="search.trim() || category ? 'search_off' : 'apps'"
      />
      <LoadMore
        auto
        v-if="!loading"
        :has-more="hasMore"
        :loading="loadingMore"
        :error="moreError"
        :shown="apps.length"
        :total="total"
        :page-size="12"
        @load="loadMore"
      />
    </template>

    <AppFooter />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppFooter from '@/components/AppFooter.vue'
import AppGrid from '@/components/AppGrid.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { provideListingSource } from '@/composables/useListingSource'
import { catalogApi } from '@/services/catalog'
import { safeColor } from '@/utils/cover'
import { ui } from '@/i18n/text'

// "Applications": the whole catalogue with search, category and sort, all kept in the URL.
// The former lists (/popular, /trending, /recommended) are the same page with a fixed order.
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const MODES = {
  '/popular': 'popular',
  '/trending': 'trending',
  '/recommended': 'recommended'
}
const mode = computed(() => MODES[route.path] || 'all')
const category = computed(() => String(route.query.category || ''))
const sortBy = computed(() => String(route.query.sort || 'latest'))
// Statistics: the former home lists stay "home"; the catalogue is a search once filtered.
provideListingSource(() => {
  if (mode.value !== 'all') return 'home'
  if (String(route.query.search || '').trim()) return 'search'
  return category.value ? 'category' : 'other'
})

const search = ref(String(route.query.search || ''))
const categories = ref([])

const sortOptions = computed(() =>
  ['latest', 'downloads', 'rating', 'name'].map(value => ({
    label: t(`store.sort.${value}`),
    value
  }))
)

// Server-side pages, shown as one list that grows with "Voir plus".
const {
  items: apps,
  total,
  hasMore,
  loading,
  loadingMore,
  error,
  moreError,
  reload,
  loadMore
} = useLoadMore(async page => {
  const params = { page }
  if (mode.value === 'all') params.sort_by = sortBy.value
  else params.filter = mode.value
  if (category.value) params.category = category.value
  const query = String(route.query.search || '').trim()
  if (query) params.search = query
  return (await catalogApi.apps(params)).data
})

function update(changes) {
  const query = { ...route.query, ...changes }
  for (const key of Object.keys(query))
    if (query[key] === '' || query[key] === undefined) delete query[key]
  router.replace({ query })
}
// An old ?page= link simply starts from the first page.
const setCategory = slug => update({ category: slug, page: undefined })
const setSort = value =>
  update({ sort: value === 'latest' ? undefined : value, page: undefined })
function applySearch() {
  clearTimeout(timer)
  update({ search: search.value.trim(), page: undefined })
}
let timer
function debouncedSearch() {
  clearTimeout(timer)
  timer = setTimeout(applySearch, 350)
}
onBeforeUnmount(() => clearTimeout(timer))

watch(
  () => route.query.search,
  value => {
    if (String(value || '') !== search.value.trim())
      search.value = String(value || '')
  }
)
watch(
  () => [route.path, route.query.search, category.value, sortBy.value],
  reload,
  { immediate: true }
)

onMounted(async () => {
  try {
    const { data } = await catalogApi.categories()
    categories.value = (Array.isArray(data) ? data : []).filter(c => c?.slug)
  } catch {
    // Category chips are a shortcut; the list works without them.
  }
})
</script>

<style scoped>
.apps-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.apps-search {
  position: relative;
  min-width: 0;
  display: flex;
  flex: 1;
  align-items: center;
}
.apps-search .q-icon {
  position: absolute;
  left: 16px;
  color: var(--muted);
  font-size: 20px;
  pointer-events: none;
}
.apps-search input {
  width: 100%;
  height: 44px;
  padding: 0 16px 0 46px;
  color: var(--text);
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 999px;
  outline: none;
  font-size: 14px;
  transition:
    border-color var(--motion-fast) ease,
    box-shadow var(--motion-fast) ease;
}
.apps-search input:focus {
  border-color: var(--pwa-link);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 16%, transparent);
}
.apps-sort {
  width: 210px;
}
.category-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  margin: 0 0 12px;
  padding: 2px 0 8px;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  scrollbar-color: var(--surface-highest) transparent;
}
.chip {
  --chip-color: var(--pwa-primary);
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  color: var(--text);
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  scroll-snap-align: start;
  transition:
    background-color var(--motion-fast) ease,
    border-color var(--motion-fast) ease;
}
.chip .q-icon {
  color: var(--chip-color);
  font-size: 18px;
}
.chip:hover {
  border-color: color-mix(in srgb, var(--chip-color) 45%, var(--outline));
}
.chip.active {
  color: var(--pwa-link);
  background: color-mix(in srgb, var(--primary) 12%, var(--surface-low));
  border-color: color-mix(in srgb, var(--primary) 45%, transparent);
}
.apps-count {
  margin: 0 0 10px;
  color: var(--muted);
  font-size: 13px;
}
@media (max-width: 599px) {
  .apps-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .apps-sort {
    width: 100%;
  }
}
</style>
