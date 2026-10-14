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
      v-if="!loading && !error && !list.error.value && !reviews.length"
      icon="inbox"
      :title="ui('Aucun avis pour ce filtre.')"
    />
    <div class="workspace-grid">
      <q-card
        v-for="review in reviews"
        :id="`review-${review.id}`"
        :key="review.id"
        flat
        bordered
        class="workspace-card"
        :class="{ 'is-highlighted': review.id === highlightId }"
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
    <LoadMore
      v-if="!loading && !list.error.value"
      auto
      :has-more="list.hasMore.value"
      :loading="list.loadingMore.value"
      :error="list.moreError.value"
      :shown="reviews.length"
      :total="list.total.value"
      @load="list.loadMore"
    />
  </q-page>
</template>
<script setup>
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'
import { communityApi } from '@/services/community'

const list = useLoadMore(async page => {
  const { data } = await api.get('/developer/reviews', {
    params: {
      page: page,
      application_id: applicationId.value || undefined,
      unanswered: unanswered.value ? 1 : undefined
    }
  })
  return data
})

const $q = useQuasar()
// E-mail links point to one review: /developer/reviews?id=…
const highlightId = Number(useRoute().query.id) || null
const reviews = list.items,
  appOptions = ref([]),
  loading = list.loading,
  error = ref(''),
  applicationId = ref(null),
  unanswered = ref(false)

const load = () => {
  error.value = ''
  return list.reload()
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
  load()
})
onMounted(async () => {
  try {
    const { data } = await api.get('/developer/apps')
    appOptions.value = data.map(a => ({ value: a.id, label: a.name }))
  } catch {
    /* The review list stays available without filter options. */
  }
  await load()
  if (highlightId) {
    await nextTick()
    document
      .getElementById(`review-${highlightId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
})
</script>
<style scoped>
.is-highlighted {
  outline: 2px solid var(--pwa-primary);
  outline-offset: 2px;
}
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
