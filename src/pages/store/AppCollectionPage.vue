<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ eyebrow }}</span
      ><h1>{{ title }}</h1
      ><p v-if="description">{{ description }}</p></header
    >
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      ui(error)
    }}</q-banner>
    <div v-if="kind === 'category'" class="row q-col-gutter-sm q-mb-md">
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
    <AppGrid
      :apps="apps"
      :loading="loading"
      :empty="ui('Aucune application publiée ici pour le moment.')"
    />
    <div v-if="lastPage > 1" class="row justify-center q-mt-md">
      <q-pagination v-model="page" :max="lastPage" />
    </div>
    <AppFooter />
  </q-page>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import AppGrid from '@/components/AppGrid.vue'
import { catalogApi } from '@/services/catalog'
import { apiMessage } from '@/services/account'

// One page for a category (paginated catalogue) and for an editorial collection.
const route = useRoute()
const kind = computed(() =>
  route.path.startsWith('/collections') ? 'collection' : 'category'
)
const apps = ref([]),
  loading = ref(true),
  error = ref(''),
  title = ref(''),
  description = ref(''),
  page = ref(1),
  lastPage = ref(1),
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

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (kind.value === 'collection') {
      const { data } = await catalogApi.collection(route.params.slug)
      title.value = data.title
      description.value = data.description
      apps.value = data.applications
      lastPage.value = 1
    } else {
      const [{ data: category }, { data: list }] = await Promise.all([
        catalogApi.category(route.params.slug),
        catalogApi.apps({
          category: route.params.slug,
          sort_by: sortBy.value,
          page: page.value
        })
      ])
      title.value = category.name
      description.value = category.description
      apps.value = list.data
      lastPage.value = list.last_page
    }
    document.title = `${title.value} · PWA Store`
  } catch (e) {
    error.value =
      e.response?.status === 404
        ? ui('Cette page n’existe pas.')
        : apiMessage(e)
    apps.value = []
  } finally {
    loading.value = false
  }
}
watch(
  () => route.params.slug,
  () => {
    page.value = 1
    load()
  },
  { immediate: true }
)
watch([page, sortBy], load)
</script>
