<template>
  <q-page class="workspace-page">
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      ui(error)
    }}</q-banner>
    <q-skeleton v-if="loading" height="140px" class="q-mb-md" />
    <template v-else-if="profile">
      <header class="workspace-heading"
        ><span class="eyebrow"
          ><q-icon :name="profile.managed_by_admin ? 'business' : 'verified'" />
          {{
            profile.managed_by_admin ? ui('Éditeur ·') : ui('Éditeur vérifié ·')
          }}
          {{
            profile.type === 'organization'
              ? ui('Organisation')
              : profile.managed_by_admin
                ? ui('Individuel')
                : ui('Développeur')
          }}</span
        ><h1>{{ profile.public_name }}</h1
        ><p v-if="profile.description">{{ profile.description }}</p
        ><p class="text-muted"
          ><span v-if="profile.country">{{ profile.country.name }}</span
          ><span v-if="profile.country && website"> · </span
          ><a
            v-if="website"
            :href="website"
            target="_blank"
            rel="noopener noreferrer nofollow"
            >{{ host(website) }}</a
          ></p
        ></header
      >
      <h2 class="section-title">{{ ui('Applications publiées') }}</h2>
      <AppGrid
        :apps="applications"
        :empty="ui('Aucune application publiée.')"
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
import { catalogApi } from '@/services/catalog'
import { apiMessage } from '@/services/account'
import { safeExternalUrl } from '@/utils/listing'
import { provideListingSource } from '@/composables/useListingSource'

const route = useRoute()
provideListingSource('developer_page')
const profile = ref(null),
  applications = ref([]),
  loading = ref(true),
  error = ref('')
usePageSeo(() => ({
  ...(profile.value && !loading.value
    ? {
        title: `${profile.value.public_name} | PWAStore`,
        name: profile.value.public_name,
        description: profile.value.description
      }
    : {}),
  noindex: !!error.value
}))
// Older profiles may hold a non-http link: never render it as a clickable href.
const website = computed(() => safeExternalUrl(profile.value?.website))
const host = url => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
watch(
  () => [route.params.id, route.meta.entity],
  async ([id, entity], _previous, onCleanup) => {
    let stale = false
    onCleanup(() => {
      stale = true
    })
    loading.value = true
    error.value = ''
    try {
      const { data } = await (entity
        ? catalogApi.entity(id)
        : catalogApi.publisher(id))
      if (stale) return
      profile.value = data.profile
      applications.value = data.applications
    } catch (e) {
      if (stale) return
      profile.value = null
      error.value =
        e.response?.status === 404
          ? ui('Cet éditeur n’existe pas ou n’est plus vérifié.')
          : apiMessage(e)
    } finally {
      if (!stale) loading.value = false
    }
  },
  { immediate: true }
)
</script>
<style scoped>
.section-title {
  font-size: 18px;
  font-weight: 750;
  margin: 8px 0 12px;
}
.eyebrow .q-icon {
  color: var(--pwa-primary);
}
</style>
