<template>
  <section>
    <p class="text-muted">{{
      ui(
        'Vos suggestions sont privées : seul l’éditeur de l’application (ou l’équipe PWA Store pour vos messages sur la plateforme) peut les lire.'
      )
    }}</p>
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      error
    }}</q-banner>
    <q-linear-progress v-if="loading" indeterminate />
    <p v-if="!loading && !items.length" class="text-muted">{{
      ui('Vous n’avez pas encore envoyé de suggestion.')
    }}</p>
    <q-list v-if="items.length" bordered separator class="rounded-borders">
      <q-expansion-item v-for="item in items" :key="item.id" @show="open(item)">
        <template #header>
          <q-item-section>
            <q-item-label
              ><strong>{{ item.title }}</strong></q-item-label
            >
            <q-item-label caption
              >{{ item.application?.name || ui('PWA Store') }} ·
              {{
                new Date(item.created_at).toLocaleDateString(currentLocale())
              }}
              <span v-if="item.developer_reply">
                · {{ ui('Réponse reçue') }}</span
              ></q-item-label
            >
          </q-item-section>
          <q-item-section side>
            <q-badge
              :color="SUGGESTION_STATUS_COLORS[item.status]"
              :label="SUGGESTION_STATUS_LABELS[item.status]"
            />
          </q-item-section>
        </template>
        <q-card flat>
          <q-card-section>
            <q-linear-progress v-if="!details[item.id]" indeterminate />
            <SuggestionDetail v-else :suggestion="details[item.id]" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn
              v-if="item.application"
              flat
              no-caps
              :label="ui('Voir l’application')"
              :to="`/apps/${item.application?.id}`"
            />
            <q-btn
              flat
              no-caps
              color="negative"
              :label="ui('Supprimer')"
              :loading="removing === item.id"
              @click="remove(item)"
            />
          </q-card-actions>
        </q-card>
      </q-expansion-item>
    </q-list>
    <q-pagination
      v-if="lastPage > 1"
      v-model="page"
      :max="lastPage"
      class="q-mt-md"
      @update:model-value="load"
    />
  </section>
</template>
<script setup>
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import SuggestionDetail from '@/components/SuggestionDetail.vue'
import { apiMessage } from '@/services/account'
import {
  SUGGESTION_STATUS_COLORS,
  SUGGESTION_STATUS_LABELS,
  suggestionsApi
} from '@/services/suggestions'

const $q = useQuasar()
const items = ref([]),
  details = reactive({}),
  loading = ref(true),
  error = ref(''),
  page = ref(1),
  lastPage = ref(1),
  removing = ref(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await suggestionsApi.mine(page.value)
    items.value = data.data
    lastPage.value = data.meta?.last_page || 1
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}

async function open(item) {
  if (details[item.id]) return
  try {
    details[item.id] = (await suggestionsApi.show(item.id)).data.data
  } catch (e) {
    error.value = apiMessage(e)
  }
}

function remove(item) {
  $q.dialog({
    get title() {
      return ui('Supprimer cette suggestion ?')
    },
    get message() {
      return ui('Elle et ses fichiers joints seront définitivement effacés.')
    },
    cancel: true
  }).onOk(async () => {
    removing.value = item.id
    try {
      await suggestionsApi.remove(item.id)
      delete details[item.id]
      await load()
    } catch (e) {
      error.value = apiMessage(e)
    } finally {
      removing.value = null
    }
  })
}

onMounted(load)
</script>
