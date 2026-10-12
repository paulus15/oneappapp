<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Portail développeur') }}</span
      ><h1>{{ ui('Avis et retours') }}</h1
      ><p>{{
        ui(
          'Les avis publiés sur vos applications. Votre réponse apparaît sous l’avis, sur la fiche publique.'
        )
      }}</p></header
    >
    <div class="row q-col-gutter-sm q-mb-md items-center">
      <div class="col-12 col-md-4">
        <q-select
          v-model="applicationId"
          :options="appOptions"
          emit-value
          map-options
          outlined
          dense
          clearable
          :label="ui('Toutes mes applications')"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-toggle v-model="unanswered" :label="ui('Sans réponse uniquement')" />
      </div>
    </div>
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      ui(error)
    }}</q-banner>
    <q-linear-progress v-if="loading" indeterminate />
    <p v-if="!loading && !reviews.length" class="text-muted">{{
      ui('Aucun avis pour ce filtre.')
    }}</p>
    <div class="workspace-grid">
      <q-card
        v-for="review in reviews"
        :key="review.id"
        flat
        bordered
        class="workspace-card"
      >
        <div class="row items-center justify-between">
          <strong>{{ review.application.name }}</strong>
          <q-rating
            :model-value="review.rating"
            max="5"
            size="14px"
            color="orange-6"
            readonly
          />
        </div>
        <small class="text-muted"
          >{{ review.user?.name }} ·
          {{
            new Date(review.updated_at).toLocaleDateString(currentLocale())
          }}</small
        >
        <p v-if="review.comment">{{ review.comment }}</p>
        <div v-if="review.reply" class="reply"
          ><strong>{{ ui('Votre réponse') }}</strong>
          <p>{{ review.reply.body }}</p></div
        >
        <q-btn
          flat
          no-caps
          color="primary"
          :label="review.reply ? ui('Modifier la réponse') : ui('Répondre')"
          @click="reply(review)"
        />
      </q-card>
    </div>
    <q-pagination
      v-if="lastPage > 1"
      v-model="page"
      :max="lastPage"
      class="q-mt-md"
    />
  </q-page>
</template>
<script setup>
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'
import { communityApi } from '@/services/community'

const $q = useQuasar()
const reviews = ref([]),
  appOptions = ref([]),
  loading = ref(true),
  error = ref(''),
  page = ref(1),
  lastPage = ref(1),
  applicationId = ref(null),
  unanswered = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/developer/reviews', {
      params: {
        page: page.value,
        application_id: applicationId.value || undefined,
        unanswered: unanswered.value ? 1 : undefined
      }
    })
    reviews.value = data.data
    lastPage.value = data.last_page
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
function reply(review) {
  $q.dialog({
    get title() {
      return ui('Répondre à cet avis')
    },
    get message() {
      return ui('Votre réponse sera publique, sous l’avis.')
    },
    prompt: {
      model: review.reply?.body || '',
      type: 'textarea',
      isValid: v => v.trim().length >= 2
    },
    cancel: true
  }).onOk(async body => {
    try {
      await communityApi.reply(review.id, body)
      $q.notify({
        type: 'positive',
        get message() {
          return ui('Réponse publiée.')
        }
      })
      await load()
    } catch (e) {
      error.value = apiMessage(e)
    }
  })
}
watch([applicationId, unanswered], () => {
  page.value = 1
  load()
})
watch(page, load)
onMounted(async () => {
  const { data } = await api.get('/developer/apps')
  appOptions.value = data.map(a => ({ value: a.id, label: a.name }))
  await load()
})
</script>
<style scoped>
.reply {
  margin: 8px 0;
  padding: 8px 10px;
  border-left: 3px solid var(--pwa-primary);
  background: var(--surface-low);
  border-radius: 8px;
}
.reply p {
  margin: 4px 0 0;
}
</style>
