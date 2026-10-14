<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Administration') }}</span
      ><h1>{{ ui('Modération des avis') }}</h1
      ><p>{{
        ui(
          'Un avis masqué disparaît de la fiche et de la note moyenne. Son auteur voit le motif dans son espace.'
        )
      }}</p></header
    >
    <AdminNav />
    <div class="row q-col-gutter-sm q-mb-md items-center">
      <div class="col-12 col-md-4">
        <q-input
          v-model="filters.search"
          outlined
          dense
          clearable
          debounce="400"
          :label="ui('Texte de l’avis')"
          @update:model-value="reload"
        />
      </div>
      <div class="col-6 col-md-3">
        <q-select
          v-model="filters.status"
          :options="statusOptions"
          emit-value
          map-options
          clearable
          outlined
          dense
          :label="ui('Statut')"
          @update:model-value="reload"
        />
      </div>
      <div class="col-6 col-md-3">
        <q-toggle
          v-model="filters.reported"
          :label="ui('Signalés uniquement')"
          @update:model-value="reload"
        />
      </div>
    </div>
    <q-banner v-if="error" class="workspace-alert q-mb-md" role="alert">{{
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
    <q-list bordered separator class="rounded-borders">
      <q-item v-for="review in reviews" :key="review.id">
        <q-item-section>
          <q-item-label
            ><strong>{{ review.application?.name }}</strong> ·
            {{ review.rating }}/5 · {{ review.user?.name }}
            <q-badge v-if="review.open_reports_count" color="negative"
              >{{ review.open_reports_count }}
              {{ ui('signalement(s)') }}</q-badge
            >
            <q-badge v-if="review.status === 'hidden'" color="grey-7">{{
              ui('Masqué')
            }}</q-badge></q-item-label
          >
          <q-item-label>{{
            review.comment || ui('Sans commentaire')
          }}</q-item-label>
          <q-item-label v-if="review.moderation_reason" caption
            >{{ ui('Motif :') }} {{ review.moderation_reason }}</q-item-label
          >
        </q-item-section>
        <q-item-section side>
          <q-btn
            flat
            no-caps
            :color="review.status === 'visible' ? 'negative' : 'positive'"
            :label="
              review.status === 'visible' ? ui('Masquer') : ui('Rétablir')
            "
            :disable="busy"
            @click="moderate(review)"
          />
        </q-item-section>
      </q-item>
      <q-item v-if="!loading && !error && !list.error.value && !reviews.length"
        ><q-item-section>{{
          ui('Aucun avis pour ce filtre.')
        }}</q-item-section></q-item
      >
    </q-list>
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
import { ui } from '@/i18n/text'

import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import AdminNav from '@/components/AdminNav.vue'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'

const list = useLoadMore(async page => {
  const { data } = await adminApi.reviews({
    page: page,
    search: filters.search || undefined,
    status: filters.status || undefined,
    reported: filters.reported ? 1 : undefined
  })
  return data
})

const $q = useQuasar()
const reviews = list.items,
  loading = list.loading,
  busy = ref(false),
  error = ref('')
const filters = reactive({ search: '', status: null, reported: false })
const statusOptions = [
  {
    value: 'visible',
    get label() {
      return ui('Visibles')
    }
  },
  {
    value: 'hidden',
    get label() {
      return ui('Masqués')
    }
  }
]
const load = () => {
  error.value = ''
  return list.reload()
}

function reload() {
  return load()
}
function moderate(review) {
  const status = review.status === 'visible' ? 'hidden' : 'visible'
  $q.dialog({
    title:
      status === 'hidden' ? ui('Masquer cet avis') : ui('Rétablir cet avis'),
    get message() {
      return ui('Indiquez le motif, conservé dans le journal.')
    },
    prompt: { model: '', type: 'textarea', isValid: v => v.trim().length >= 3 },
    cancel: true,
    persistent: true
  }).onOk(async reason => {
    busy.value = true
    try {
      await adminApi.moderateReview(review.id, { status, reason })
      await load()
    } catch (e) {
      error.value = apiMessage(e)
    } finally {
      busy.value = false
    }
  })
}
onMounted(load)
</script>
