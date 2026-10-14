<template>
  <section>
    <EmptyState
      v-if="reviewList.error.value"
      tone="error"
      icon="cloud_off"
      :title="ui('Chargement impossible')"
      ><q-btn flat :label="ui('Réessayer')" @click="reviewList.reload"
    /></EmptyState>
    <q-linear-progress v-if="loading" indeterminate />
    <p
      v-if="!loading && !reviewList.error.value && !reviews.length"
      class="text-muted"
      >{{ ui('Vous n’avez pas encore publié d’avis.') }}</p
    >
    <div class="workspace-grid">
      <q-card
        v-for="review in reviews"
        :key="review.id"
        flat
        bordered
        class="workspace-card"
      >
        <div class="row items-center justify-between">
          <router-link :to="`/apps/${review.application.id}`"
            ><strong>{{ review.application.name }}</strong></router-link
          >
          <q-rating
            :model-value="review.rating"
            max="5"
            size="14px"
            color="orange-6"
            readonly
          />
        </div>
        <small class="text-muted"
          >{{ new Date(review.updated_at).toLocaleDateString(currentLocale()) }}
          <span v-if="review.status === 'hidden'" class="text-negative">
            {{ ui('· masqué par la modération') }}</span
          ></small
        >
        <p v-if="review.comment">{{ review.comment }}</p>
        <div v-if="review.reply" class="reply"
          ><strong>{{ ui('Réponse de l’éditeur') }}</strong>
          <p>{{ review.reply.body }}</p></div
        >
      </q-card>
    </div>
    <LoadMore
      v-if="!loading"
      auto
      :has-more="reviewList.hasMore.value"
      :loading="reviewList.loadingMore.value"
      :error="reviewList.moreError.value"
      :shown="reviews.length"
      :total="reviewList.total.value"
      @load="reviewList.loadMore"
    />
    <h2 class="q-mt-lg">{{ ui('Mes signalements') }}</h2>
    <q-linear-progress v-if="reportList.loading.value" indeterminate />
    <EmptyState
      v-else-if="reportList.error.value"
      tone="error"
      icon="cloud_off"
      :title="ui('Chargement impossible')"
      ><q-btn flat :label="ui('Réessayer')" @click="reportList.reload"
    /></EmptyState>
    <p v-else-if="!reports.length" class="text-muted">{{
      ui('Aucun signalement envoyé.')
    }}</p>
    <q-list v-else bordered separator class="rounded-borders">
      <q-item v-for="report in reports" :key="report.id">
        <q-item-section>
          <q-item-label
            >{{ REPORT_REASONS[report.reason] }} ·
            {{
              new Date(report.created_at).toLocaleDateString(currentLocale())
            }}</q-item-label
          >
          <q-item-label caption
            >{{ reportStatus[report.status] }}
            <span v-if="report.resolution">
              — {{ report.resolution }}</span
            ></q-item-label
          >
        </q-item-section>
      </q-item>
    </q-list>
    <LoadMore
      v-if="!reportList.loading.value"
      auto
      :has-more="reportList.hasMore.value"
      :loading="reportList.loadingMore.value"
      :error="reportList.moreError.value"
      :shown="reports.length"
      :total="reportList.total.value"
      @load="reportList.loadMore"
    />
  </section>
</template>
<script setup>
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { onMounted } from 'vue'
import { communityApi, REPORT_REASONS } from '@/services/community'

const reviewList = useLoadMore(
  async page => (await communityApi.myReviews(page)).data
)
const reportList = useLoadMore(
  async page => (await communityApi.myReports(page)).data
)
const reviews = reviewList.items,
  reports = reportList.items,
  loading = reviewList.loading
const reportStatus = {
  get open() {
    return ui('En cours d’examen')
  },
  get resolved() {
    return ui('Traité')
  },
  get dismissed() {
    return ui('Classé sans suite')
  }
}
const load = () => Promise.all([reviewList.reload(), reportList.reload()])
onMounted(load)
</script>
<style scoped>
h2 {
  font-size: 18px;
  font-weight: 750;
}
.reply {
  margin-top: 8px;
  padding: 8px 10px;
  border-left: 3px solid var(--pwa-primary);
  background: var(--surface-low);
  border-radius: 8px;
}
.reply p {
  margin: 4px 0 0;
}
</style>
