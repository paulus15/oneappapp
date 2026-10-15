<template>
  <LabProWorkspace v-if="ready && pro" />
  <q-page v-else-if="ready" class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Portail développeur') }}</span
      ><h1>{{ ui('Labo PWA') }}</h1
      ><p>{{
        ui(
          'Diagnostic technique d’une PWA à partir de son adresse : accès, métadonnées, manifeste, critères d’installation, responsive et indicateurs d’accessibilité et de performance. Aucun script n’est exécuté.'
        )
      }}</p></header
    >
    <DeveloperToolsNav />
    <q-card flat bordered class="workspace-card q-mb-md">
      <q-form class="lab-form" @submit="run">
        <q-input
          v-model="url"
          outlined
          type="url"
          :label="ui('Adresse HTTPS de la PWA')"
          placeholder="https://mon-app.exemple.com/"
          :rules="[
            v => /^https:\/\//.test(v || '') || ui('Adresse HTTPS requise')
          ]"
          class="col"
        />
        <q-btn
          type="submit"
          color="primary"
          no-caps
          unelevated
          icon="science"
          :label="ui('Analyser')"
          :loading="busy"
        />
      </q-form>
      <q-banner v-if="error" class="workspace-alert" role="alert">{{
        ui(error)
      }}</q-banner>
    </q-card>

    <LabLegacyReport v-if="current" :analysis="current" />

    <section class="workspace-section">
      <h2>{{ ui('Historique') }}</h2>
      <p v-if="!history.length" class="text-muted">{{
        ui('Aucune analyse.')
      }}</p>
      <q-list v-else bordered separator class="rounded-borders">
        <q-item
          v-for="item in history"
          :key="item.id"
          clickable
          :active="current?.id === item.id"
          @click="open(item.id)"
        >
          <q-item-section>
            <q-item-label lines="1">{{ item.url }}</q-item-label>
            <q-item-label caption>{{
              new Date(item.created_at).toLocaleString(currentLocale())
            }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge :color="item.reachable ? 'primary' : 'negative'">{{
              item.reachable ? `${item.score}/100` : ui('Inaccessible')
            }}</q-badge>
          </q-item-section>
        </q-item>
      </q-list>
    </section>
  </q-page>
</template>
<script setup>
import DeveloperToolsNav from '@/components/DeveloperToolsNav.vue'
// The report goes through LabLegacyReport, which also renders a pro-1 report safely
// (Lab Pro switched off after analyses were made with it).
import LabLegacyReport from '@/components/lab/LabLegacyReport.vue'
import LabProWorkspace from '@/components/lab/LabProWorkspace.vue'
import { loadPlatform, usePlatform } from '@/composables/usePlatform'
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { computed, onMounted, ref } from 'vue'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'

// Lab Pro replaces the page only when its tool is on; otherwise the historical Lab,
// unchanged. Wait for the platform tools so the page never flashes the wrong Lab.
const { platform, tools } = usePlatform()
const ready = computed(() => platform.value != null)
const pro = computed(() => tools.value.lab_pro === true)

const url = ref(''),
  busy = ref(false),
  error = ref(''),
  current = ref(null),
  history = ref([])
async function loadHistory() {
  history.value = (await api.get('/lab/analyses')).data.data
}
async function run() {
  busy.value = true
  error.value = ''
  try {
    current.value = (await api.post('/lab/analyses', { url: url.value })).data
    await loadHistory()
  } catch (e) {
    error.value =
      e.response?.status === 429
        ? ui('Cinq analyses par minute au maximum. Patientez un instant.')
        : apiMessage(e)
  } finally {
    busy.value = false
  }
}
async function open(id) {
  current.value = (await api.get(`/lab/analyses/${id}`)).data
  url.value = current.value.url
}
onMounted(async () => {
  await loadPlatform()
  if (!pro.value) await loadHistory()
})
</script>
<style scoped>
.lab-form {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.lab-form .col {
  min-width: 240px;
  flex: 1;
}
.lab-form .q-btn {
  margin-top: 8px;
}
h2 {
  font-size: 17px;
  font-weight: 750;
  margin: 18px 0 8px;
}
</style>
