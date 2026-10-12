<template>
  <q-page class="workspace-page">
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      ui(error)
    }}</q-banner>
    <q-skeleton v-if="loading" height="140px" class="q-mb-md" />
    <template v-else-if="profile">
      <header class="workspace-heading"
        ><span class="eyebrow"
          ><q-icon name="verified" /> {{ ui('Éditeur vérifié ·') }}
          {{
            profile.type === 'organization'
              ? ui('Organisation')
              : ui('Développeur')
          }}</span
        ><h1>{{ profile.public_name }}</h1
        ><p v-if="profile.description">{{ profile.description }}</p
        ><p class="text-muted"
          ><span v-if="profile.country">{{ profile.country.name }}</span
          ><span v-if="profile.country && profile.website"> · </span
          ><a
            v-if="profile.website"
            :href="profile.website"
            target="_blank"
            rel="noopener noreferrer nofollow"
            >{{ host(profile.website) }}</a
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
import { ui } from '@/i18n/text'

import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import AppGrid from '@/components/AppGrid.vue'
import { catalogApi } from '@/services/catalog'
import { apiMessage } from '@/services/account'

const route = useRoute()
const profile = ref(null),
  applications = ref([]),
  loading = ref(true),
  error = ref('')
const host = url => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
watch(
  () => route.params.id,
  async id => {
    loading.value = true
    error.value = ''
    try {
      const { data } = await catalogApi.publisher(id)
      profile.value = data.profile
      applications.value = data.applications
      document.title = `${data.profile.public_name} · PWA Store`
    } catch (e) {
      profile.value = null
      error.value =
        e.response?.status === 404
          ? ui('Cet éditeur n’existe pas ou n’est plus vérifié.')
          : apiMessage(e)
    } finally {
      loading.value = false
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
