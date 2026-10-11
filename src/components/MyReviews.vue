<template>
  <section>
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      error
    }}</q-banner>
    <q-linear-progress v-if="loading" indeterminate />
    <p v-if="!loading && !reviews.length" class="text-muted"
      >Vous n’avez pas encore publié d’avis.</p
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
          >{{ new Date(review.updated_at).toLocaleDateString('fr-FR') }}
          <span v-if="review.status === 'hidden'" class="text-negative">
            · masqué par la modération</span
          ></small
        >
        <p v-if="review.comment">{{ review.comment }}</p>
        <div v-if="review.reply" class="reply"
          ><strong>Réponse de l’éditeur</strong>
          <p>{{ review.reply.body }}</p></div
        >
      </q-card>
    </div>
    <q-pagination
      v-if="lastPage > 1"
      v-model="page"
      :max="lastPage"
      @update:model-value="load"
    />
    <h2 class="q-mt-lg">Mes signalements</h2>
    <p v-if="!reports.length" class="text-muted">Aucun signalement envoyé.</p>
    <q-list v-else bordered separator class="rounded-borders">
      <q-item v-for="report in reports" :key="report.id">
        <q-item-section>
          <q-item-label
            >{{ REPORT_REASONS[report.reason] }} ·
            {{
              new Date(report.created_at).toLocaleDateString('fr-FR')
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
  </section>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { communityApi, REPORT_REASONS } from '@/services/community'
import { apiMessage } from '@/services/account'

const reviews = ref([]),
  reports = ref([]),
  loading = ref(true),
  error = ref(''),
  page = ref(1),
  lastPage = ref(1)
const reportStatus = {
  open: 'En cours d’examen',
  resolved: 'Traité',
  dismissed: 'Classé sans suite'
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [mine, sent] = await Promise.all([
      communityApi.myReviews(page.value),
      communityApi.myReports()
    ])
    reviews.value = mine.data.data
    lastPage.value = mine.data.last_page
    reports.value = sent.data.data
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
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
