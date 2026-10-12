<template>
  <div class="workspace-grid">
    <q-card flat bordered class="workspace-card">
      <h2>{{ ui('Préférences') }}</h2>
      <q-banner v-if="error" class="workspace-alert" role="alert">{{
        ui(error)
      }}</q-banner>
      <template v-if="prefs">
        <q-toggle
          :model-value="prefs.recently_viewed"
          :label="ui('Mémoriser les applications que je consulte')"
          :disable="busy"
          @update:model-value="v => save({ recently_viewed: v })"
        />
        <p class="text-caption text-muted">{{
          ui(
            'Désactivé par défaut. Si vous le désactivez, l’historique est effacé.'
          )
        }}</p>
        <h3>{{ ui('Notifications') }}</h3>
        <q-toggle
          v-for="(label, key) in notificationLabels"
          :key="key"
          :model-value="prefs.notifications[key]"
          :label="label"
          :disable="busy"
          @update:model-value="v => save({ notifications: { [key]: v } })"
        />
        <p class="text-caption text-muted">{{
          ui(
            'Les e-mails de sécurité (codes de confirmation, changement de mot de passe) sont toujours envoyés.'
          )
        }}</p>
      </template>
    </q-card>

    <q-card v-if="prefs?.recently_viewed" flat bordered class="workspace-card">
      <div class="row items-center justify-between">
        <h2>{{ ui('Récemment consultées') }}</h2>
        <q-btn
          flat
          dense
          no-caps
          :label="ui('Effacer')"
          :disable="!recent.length"
          @click="clear"
        />
      </div>
      <AppGrid :apps="recent" :empty="ui('Aucune application consultée.')" />
    </q-card>

    <q-card flat bordered class="workspace-card">
      <h2>{{ ui('Mes données') }}</h2>
      <p>{{
        ui(
          'Téléchargez une copie des données que PWA Store conserve sur votre compte (format JSON).'
        )
      }}</p>
      <q-btn
        outline
        no-caps
        color="primary"
        icon="download"
        :label="ui('Exporter mes données')"
        :loading="exporting"
        @click="exportData"
      />
      <p class="text-caption text-muted q-mt-sm">{{
        ui(
          'Pour supprimer votre compte, utilisez « Désactiver mon compte » dans l’onglet Profil et sécurité.'
        )
      }}</p>
    </q-card>
  </div>
</template>
<script setup>
import { ui } from '@/i18n/text'

import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import AppGrid from '@/components/AppGrid.vue'
import { communityApi } from '@/services/community'
import { apiMessage } from '@/services/account'

const $q = useQuasar()
const prefs = ref(null),
  recent = ref([]),
  busy = ref(false),
  exporting = ref(false),
  error = ref('')
const notificationLabels = {
  get in_app() {
    return ui('Notifications dans l’application')
  },
  get email() {
    return ui('Notifications par e-mail')
  },
  get reviews_digest() {
    return ui('Résumé quotidien des avis reçus (développeurs)')
  },
  get product_news() {
    return ui('Nouveautés de PWA Store')
  }
}
async function loadRecent() {
  recent.value = prefs.value?.recently_viewed
    ? (await communityApi.recent()).data.data
    : []
}
async function save(change) {
  busy.value = true
  error.value = ''
  try {
    prefs.value = (await communityApi.savePreferences(change)).data
    await loadRecent()
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
async function clear() {
  await communityApi.clearRecent()
  recent.value = []
}
async function exportData() {
  exporting.value = true
  try {
    const { data } = await communityApi.exportData()
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = 'pwa-store-mes-donnees.json'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch (e) {
    $q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    exporting.value = false
  }
}
onMounted(async () => {
  try {
    prefs.value = (await communityApi.preferences()).data
    await loadRecent()
  } catch (e) {
    error.value = apiMessage(e)
  }
})
</script>
<style scoped>
h2 {
  font-size: 18px;
  font-weight: 750;
  margin: 0 0 10px;
}
h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 16px 0 4px;
}
</style>
