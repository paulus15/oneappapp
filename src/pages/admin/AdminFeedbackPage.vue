<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Administration') }}</span
      ><h1>{{ ui('Retours sur la plateforme') }}</h1
      ><p>{{
        ui(
          'Idées, problèmes et remarques envoyés par les utilisateurs sur PWA Store. Ils ne sont jamais publiés ; votre réponse n’est visible que par leur auteur.'
        )
      }}</p></header
    >
    <AdminNav />
    <div class="row q-col-gutter-sm q-mb-md items-center">
      <div class="col-12 col-md-4">
        <q-select
          v-model="category"
          :options="categoryOptions"
          emit-value
          map-options
          outlined
          dense
          clearable
          :label="ui('Tous les types')"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-select
          v-model="status"
          :options="statusOptions"
          emit-value
          map-options
          outlined
          dense
          clearable
          :label="ui('Tous les statuts')"
        />
      </div>
    </div>
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      error
    }}</q-banner>
    <q-linear-progress v-if="loading" indeterminate />
    <p v-if="!loading && !items.length" class="text-muted">{{
      ui('Aucun retour pour ce filtre.')
    }}</p>
    <div class="workspace-grid">
      <q-card
        v-for="item in items"
        :key="item.id"
        flat
        bordered
        class="workspace-card cursor-pointer"
        role="button"
        tabindex="0"
        @click="openDetail(item.id)"
        @keyup.enter="openDetail(item.id)"
      >
        <div class="row items-center justify-between no-wrap">
          <strong class="ellipsis">{{ item.title }}</strong>
          <q-badge
            :color="SUGGESTION_STATUS_COLORS[item.status]"
            :label="SUGGESTION_STATUS_LABELS[item.status]"
          />
        </div>
        <small class="text-muted"
          >{{ categoryLabel(item) }} · {{ authorName(item) }} ·
          {{ new Date(item.created_at).toLocaleDateString(currentLocale()) }}
        </small>
        <small v-if="item.attachments_count" class="text-muted">
          <q-icon name="attach_file" />
          {{ ui('{n} fichier(s) joint(s)', { n: item.attachments_count }) }}
        </small>
      </q-card>
    </div>
    <q-pagination
      v-if="lastPage > 1"
      v-model="page"
      :max="lastPage"
      class="q-mt-md"
    />

    <q-dialog v-model="dialog" :maximized="$q.screen.lt.sm">
      <q-card class="detail-card">
        <q-linear-progress v-if="!current" indeterminate />
        <template v-else>
          <q-card-section>
            <div class="row items-start justify-between no-wrap">
              <div>
                <h2>{{ current.title }}</h2>
                <small class="text-muted"
                  >{{ categoryLabel(current) }} · {{ authorName(current) }} ·
                  {{
                    new Date(current.created_at).toLocaleString(currentLocale())
                  }}</small
                >
              </div>
              <q-btn flat round dense icon="close" v-close-popup />
            </div>
          </q-card-section>
          <q-card-section>
            <SuggestionDetail :suggestion="current" />
          </q-card-section>
          <q-separator />
          <q-card-section class="workspace-form">
            <q-select
              v-model="form.status"
              :options="statusOptions"
              emit-value
              map-options
              outlined
              dense
              :label="ui('Statut')"
            />
            <q-input
              v-model="form.reply"
              outlined
              type="textarea"
              autogrow
              maxlength="2000"
              counter
              :label="ui('Réponse privée à l’auteur (facultatif)')"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps :label="ui('Fermer')" v-close-popup />
            <q-btn
              unelevated
              no-caps
              color="primary"
              :label="ui('Enregistrer')"
              :loading="saving"
              @click="save"
            />
          </q-card-actions>
        </template>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script setup>
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import AdminNav from '@/components/AdminNav.vue'
import SuggestionDetail from '@/components/SuggestionDetail.vue'
import { apiMessage } from '@/services/account'
import {
  FEEDBACK_CATEGORY_LABELS,
  SUGGESTION_STATUS_COLORS,
  SUGGESTION_STATUS_LABELS,
  suggestionsApi
} from '@/services/suggestions'
import { SUGGESTION_STATUSES } from '@/utils/suggestions'

const $q = useQuasar(),
  route = useRoute()
const items = ref([]),
  counts = ref({}),
  loading = ref(true),
  error = ref(''),
  page = ref(1),
  lastPage = ref(1),
  category = ref(null),
  status = ref(null),
  dialog = ref(false),
  current = ref(null),
  saving = ref(false),
  form = reactive({ status: 'read', reply: '' })

const statusOptions = computed(() =>
  SUGGESTION_STATUSES.map(value => ({
    value,
    label: counts.value[value]
      ? `${SUGGESTION_STATUS_LABELS[value]} (${counts.value[value]})`
      : SUGGESTION_STATUS_LABELS[value]
  }))
)
const categoryOptions = computed(() =>
  Object.keys(FEEDBACK_CATEGORY_LABELS).map(value => ({
    value,
    label: FEEDBACK_CATEGORY_LABELS[value]
  }))
)
const categoryLabel = item =>
  FEEDBACK_CATEGORY_LABELS[item.category] || FEEDBACK_CATEGORY_LABELS.other
const authorName = item => item.author?.name || ui('Compte supprimé')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await suggestionsApi.platform({
      page: page.value,
      category: category.value || undefined,
      status: status.value || undefined
    })
    items.value = data.data
    counts.value = data.counts || {}
    lastPage.value = data.meta?.last_page || 1
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}

// Two quick clicks: only the last opened item may fill the dialog (no reply to the wrong author).
let openedId = null
async function openDetail(id) {
  openedId = id
  current.value = null
  dialog.value = true
  try {
    const { data } = await suggestionsApi.show(id)
    if (openedId !== id) return
    current.value = data.data
    form.status = data.data.status
    form.reply = data.data.developer_reply || ''
    // Opening a new message marks it as read on the server.
    const listed = items.value.find(item => item.id === id)
    if (listed && listed.status !== data.data.status) await load()
  } catch (e) {
    if (openedId !== id) return
    dialog.value = false
    error.value = apiMessage(e)
  }
}

async function save() {
  saving.value = true
  try {
    const { data } = await suggestionsApi.update(current.value.id, {
      status: form.status,
      reply: form.reply
    })
    current.value = data.data
    $q.notify({
      type: 'positive',
      get message() {
        return ui('Retour mis à jour. L’auteur est prévenu.')
      }
    })
    await load()
  } catch (e) {
    $q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    saving.value = false
  }
}

watch([category, status], () => {
  page.value = 1
  load()
})
watch(page, load)
onMounted(async () => {
  await load()
  const id = Number(route.query.id)
  if (id) openDetail(id)
})
</script>
<style scoped>
.detail-card {
  width: min(760px, 100vw);
}
h2 {
  font-size: 18px;
  font-weight: 750;
  margin: 0 0 4px;
}
.workspace-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
