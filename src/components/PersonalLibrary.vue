<template>
  <section>
    <h2 class="library-heading">{{
      ui('Mes applications sur cet appareil')
    }}</h2>
    <p class="text-muted">{{
      ui(
        'Installations déclarées depuis ce navigateur. Le Store ne peut pas détecter toutes les PWA installées par le système.'
      )
    }}</p>
    <q-banner v-if="!device" class="workspace-alert">{{
      ui(
        'Le stockage local est indisponible : cet appareil ne peut pas être identifié.'
      )
    }}</q-banner>
    <q-banner v-if="error" class="workspace-alert" role="alert"
      >{{ ui(error)
      }}<template #action
        ><q-btn flat :label="ui('Réessayer')" @click="load" /></template
    ></q-banner>
    <q-linear-progress v-if="loading" indeterminate />
    <div v-if="!loading && device" class="workspace-grid">
      <q-card flat bordered class="workspace-card"
        ><h2>{{ ui('Installées ·') }} {{ installed.length }}</h2
        ><p v-if="!installed.length">{{
          ui(
            'Aucune installation déclarée sur cet appareil. Ouvrez une application du Store, installez-la depuis votre navigateur, puis confirmez son installation sur sa fiche.'
          )
        }}</p
        ><q-list
          ><q-item v-for="item in installed" :key="item.id"
            ><q-item-section
              ><q-item-label>{{ item.application?.name }}</q-item-label
              ><q-item-label caption
                >{{ item.version?.version_number || ui('PWA externe') }} ·
                {{ item.platform }}</q-item-label
              ><div class="workspace-actions"
                ><q-btn
                  flat
                  no-caps
                  :label="ui('Ouvrir la fiche')"
                  :to="`/apps/${item.application_id}`" /><q-btn
                  flat
                  no-caps
                  :label="ui('J’ai désinstallé cette PWA')"
                  :loading="busy === item.id"
                  @click="
                    uninstall(item)
                  " /></div></q-item-section></q-item></q-list
      ></q-card>
      <q-card flat bordered class="workspace-card"
        ><h2>{{ ui('Téléchargements ·') }} {{ downloaded.length }}</h2
        ><p v-if="!downloaded.length">{{
          ui('Aucun téléchargement enregistré sur cet appareil.')
        }}</p
        ><q-list
          ><q-item
            v-for="item in downloaded"
            :key="item.id"
            clickable
            :to="`/apps/${item.application_id}`"
            ><q-item-section
              ><q-item-label>{{ item.application?.name }}</q-item-label
              ><q-item-label caption>{{
                new Date(item.downloaded_at).toLocaleDateString(currentLocale())
              }}</q-item-label></q-item-section
            ></q-item
          ></q-list
        ><p class="text-caption">{{
          ui('Un build téléchargé n’est pas nécessairement installé.')
        }}</p></q-card
      >
    </div>
    <q-btn
      class="q-mt-lg"
      color="primary"
      no-caps
      to="/"
      :label="ui('Découvrir les applications')"
    />
  </section>
</template>
<script setup>
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { computed, onMounted, ref } from 'vue'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'
import { deviceIdentity } from '@/utils/device'
const device = deviceIdentity(),
  rows = ref([]),
  loading = ref(false),
  error = ref(''),
  busy = ref(null)
const installed = computed(() =>
    rows.value.filter(i => i.status === 'installed')
  ),
  downloaded = computed(() => rows.value.filter(i => i.downloaded_at))
async function load() {
  if (!device) return
  loading.value = true
  error.value = ''
  try {
    rows.value = (
      await api.get('/library', { params: { device_uuid: device } })
    ).data
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
async function uninstall(item) {
  busy.value = item.id
  try {
    await api.patch(`/installations/${item.id}`, { status: 'uninstalled' })
    await load()
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = null
  }
}
onMounted(load)
</script>
<style scoped>
.library-heading {
  font-size: var(--title-section);
  font-weight: 650;
  line-height: 1.3;
  margin: 0 0 16px;
}
</style>
