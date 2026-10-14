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
    <EmptyState
      v-if="list.error.value"
      tone="error"
      icon="cloud_off"
      :title="ui('Chargement impossible')"
      :text="ui('Les données n’ont pas pu être chargées.')"
      ><q-btn
        flat
        no-caps
        color="primary"
        :label="ui('Réessayer')"
        @click="load"
    /></EmptyState>
    <EmptyState
      v-if="!loading && !error && !list.error.value && !items.length"
      icon="inbox"
      :title="ui('Vous n’avez pas encore envoyé de suggestion.')"
    />
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
    <LoadMore
      v-if="!loading && !list.error.value"
      auto
      :has-more="list.hasMore.value"
      :loading="list.loadingMore.value"
      :error="list.moreError.value"
      :shown="items.length"
      :total="list.total.value"
      @load="list.loadMore"
    />
  </section>
</template>
<script setup>
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useLoadMore } from '@/composables/useLoadMore'
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

const list = useLoadMore(async page => {
  const { data } = await suggestionsApi.mine(page)
  return data
})

const $q = useQuasar()
const items = list.items,
  details = reactive({}),
  loading = list.loading,
  error = ref(''),
  removing = ref(null)

const load = () => {
  error.value = ''
  return list.reload()
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
