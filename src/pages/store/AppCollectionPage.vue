<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ eyebrow }}</span
      ><h1>{{ title }}</h1
      ><p v-if="description">{{ description }}</p></header
    >
    <EmptyState
      v-if="error"
      tone="error"
      :icon="notFound ? 'search_off' : 'cloud_off'"
      :title="notFound ? ui('Page introuvable') : ui('Chargement impossible')"
      :text="ui(error)"
    >
      <q-btn
        v-if="!notFound"
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        :label="ui('Réessayer')"
        @click="reload"
      />
      <q-btn
        v-else
        outline
        no-caps
        color="primary"
        :label="ui('Retour à l’accueil')"
        to="/"
      />
    </EmptyState>
    <div
      v-if="kind === 'category' && !error"
      class="row q-col-gutter-sm q-mb-md"
    >
      <div class="col-12 col-sm-6 col-md-4">
        <q-select
          v-model="sortBy"
          :options="sortOptions"
          emit-value
          map-options
          outlined
          dense
          :label="ui('Trier par')"
        />
      </div>
    </div>
    <template v-if="!error">
      <AppGrid
        :apps="apps"
        :loading="loading"
        :empty="ui('Aucune application publiée ici pour le moment.')"
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
import { usePageSeo } from '@/composables/usePageSeo'
import { ui } from '@/i18n/text'

import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import AppGrid from '@/components/AppGrid.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { catalogApi } from '@/services/catalog'
import { apiMessage } from '@/services/account'

// One page for a category (paginated catalogue) and for an editorial collection.
const route = useRoute()
const kind = computed(() =>
  route.path.startsWith('/collections') ? 'collection' : 'category'
)
const error = ref(''),
  notFound = ref(false),
  title = ref(''),
  description = ref(''),
  sortBy = ref('downloads')
const eyebrow = computed(() =>
  kind.value === 'collection' ? ui('Sélection') : ui('Catégorie')
)
const sortOptions = [
  {
    get label() {
      return ui('Les plus téléchargées')
    },
    value: 'downloads'
  },
  {
    get label() {
      return ui('Les mieux notées')
    },
    value: 'rating'
  },
  {
    get label() {
      return ui('Nouveautés')
    },
    value: 'latest'
  },
  {
    get label() {
      return ui('Nom')
    },
    value: 'name'
  }
]

usePageSeo(() => ({
  ...(!loading.value && title.value
    ? {
        title: `${title.value} | PWAStore`,
        name: title.value,
        description: description.value
      }
    : {}),
  noindex: !!error.value
}))

// Metadata travels with its page so late replies cannot change the active heading.
const {
  items: apps,
  total,
  hasMore,
  loading,
  loadingMore,
  moreError,
  error: loadError,
  last,
  reload,
  loadMore
} = useLoadMore(async page => {
  if (kind.value === 'collection') {
    const { data } = await catalogApi.collection(route.params.slug)
    const applications = data.applications || []
    return {
      data: applications,
      last_page: 1,
      total: applications.length,
      heading: data.title,
      description: data.description
    }
  }
  const [header, list] = await Promise.all([
    page === 1 ? catalogApi.category(route.params.slug) : null,
    catalogApi.apps({
      category: route.params.slug,
      sort_by: sortBy.value,
      page
    })
  ])
  return {
    ...list.data,
    ...(header
      ? { heading: header.data.name, description: header.data.description }
      : {})
  }
})
watch([last, loadError], () => {
  notFound.value = loadError.value && last.value?.response?.status === 404
  error.value = loadError.value
    ? notFound.value
      ? ui('Cette page n’existe pas.')
      : apiMessage(last.value)
    : ''
  if (last.value?.heading !== undefined) {
    title.value = last.value.heading
    description.value = last.value.description
  }
})
watch(
  () => [route.path, sortBy.value],
  () => {
    title.value = ''
    description.value = ''
    reload()
  },
  { immediate: true }
)
</script>
