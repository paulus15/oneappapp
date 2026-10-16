<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Portail développeur') }}</span
      ><h1>{{ ui('Intégrations') }}</h1
      ><p>{{
        ui(
          'Connectez PWA Store à vos outils : jetons d’accès pour l’API, webhooks pour être prévenu des événements, et la documentation pour démarrer.'
        )
      }}</p></header
    >

    <q-tabs
      v-model="tab"
      align="left"
      no-caps
      inline-label
      outside-arrows
      mobile-arrows
    >
      <q-tab name="tokens" icon="key" :label="ui('Jetons d’accès')" />
      <q-tab name="webhooks" icon="webhook" :label="ui('Webhooks')" />
      <q-tab name="docs" icon="menu_book" :label="ui('Documentation')" />
    </q-tabs>
    <q-tab-panels v-model="tab" animated keep-alive class="panels">
      <q-tab-panel name="tokens" class="q-pa-none">
        <IntegrationTokens :apps="apps" />
      </q-tab-panel>
      <q-tab-panel name="webhooks" class="q-pa-none">
        <IntegrationWebhooks :apps="apps" />
      </q-tab-panel>
      <q-tab-panel name="docs" class="q-pa-none">
        <IntegrationDocs />
      </q-tab-panel>
    </q-tab-panels>
  </q-page>
</template>
<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IntegrationDocs from '@/components/integrations/IntegrationDocs.vue'
import IntegrationTokens from '@/components/integrations/IntegrationTokens.vue'
import IntegrationWebhooks from '@/components/integrations/IntegrationWebhooks.vue'
import { ui } from '@/i18n/text'
import { integrationsApi } from '@/services/integrations'

const TABS = ['tokens', 'webhooks', 'docs']
const route = useRoute()
const router = useRouter()
const fromQuery = () =>
  TABS.includes(route.query?.tab) ? route.query.tab : 'tokens'

const tab = ref(fromQuery()),
  apps = ref([])

// The tab lives in the address, so "Documentation" can be linked directly.
watch(tab, value => {
  if (route.query?.tab === value) return
  void router.replace({
    query: { ...route.query, tab: value === 'tokens' ? undefined : value }
  })
})
watch(
  () => route.query?.tab,
  () => {
    const wanted = fromQuery()
    if (wanted !== tab.value) tab.value = wanted
  }
)

onMounted(async () => {
  try {
    const { data } = await integrationsApi.apps()
    const list = Array.isArray(data) ? data : data?.data
    apps.value = Array.isArray(list) ? list : []
  } catch {
    // The scope selectors still offer "Toutes mes applications".
  }
})
defineExpose({ tab, apps })
</script>
<style scoped>
.panels {
  margin-top: 16px;
  background: transparent;
}
</style>
