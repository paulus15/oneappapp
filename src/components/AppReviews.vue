<template>
  <section class="reviews" aria-labelledby="reviews-title">
    <div class="summary">
      <div class="average">
        <strong>{{ data.total ? data.average.toFixed(1) : '—' }}</strong>
        <q-rating
          :model-value="data.average"
          max="5"
          size="14px"
          color="orange-6"
          icon="star"
          icon-half="star_half"
          readonly
        />
        <small>{{ data.total }} avis</small>
      </div>
      <div class="bars" aria-hidden="true">
        <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="bar">
          <span>{{ star }}</span>
          <q-linear-progress
            :value="
              data.total ? (data.distribution[star] || 0) / data.total : 0
            "
            color="orange-6"
            track-color="grey-4"
            rounded
          />
        </div>
      </div>
    </div>

    <div class="row items-center justify-between q-mb-sm">
      <h2 id="reviews-title">Notes et avis</h2>
      <q-select
        v-model="sort"
        :options="sortOptions"
        emit-value
        map-options
        dense
        outlined
        class="sort"
        aria-label="Trier les avis"
      />
    </div>

    <q-card v-if="canReview" flat bordered class="workspace-card q-mb-md">
      <q-form @submit="save">
        <h3>{{ data.mine ? 'Votre avis' : 'Donner votre avis' }}</h3>
        <q-rating v-model="form.rating" max="5" size="26px" color="orange-6" />
        <q-input
          v-model="form.comment"
          type="textarea"
          autogrow
          outlined
          maxlength="2000"
          counter
          label="Votre commentaire (facultatif)"
          class="q-mt-sm"
        />
        <p v-if="data.mine?.status === 'hidden'" class="text-negative"
          >Votre avis a été masqué par la modération :
          {{ data.mine.moderation_reason }}</p
        >
        <div class="workspace-actions">
          <q-btn
            type="submit"
            color="primary"
            no-caps
            :label="data.mine ? 'Mettre à jour' : 'Publier mon avis'"
            :loading="busy"
          />
          <q-btn
            v-if="data.mine"
            flat
            no-caps
            color="negative"
            label="Supprimer"
            :disable="busy"
            @click="remove"
          />
        </div>
      </q-form>
    </q-card>
    <p v-else-if="!auth.isAuthenticated" class="text-muted">
      <router-link :to="{ path: '/login', query: { redirect: route.fullPath } }"
        >Connectez-vous</router-link
      >
      pour donner votre avis.
    </p>
    <p v-else-if="!auth.user?.email_verified_at" class="text-muted"
      >Confirmez votre adresse e-mail pour donner votre avis.</p
    >

    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      error
    }}</q-banner>
    <p v-if="!loading && !data.data.length" class="text-muted"
      >Aucun avis pour le moment.</p
    >
    <q-list separator>
      <q-item v-for="review in data.data" :key="review.id" class="review">
        <q-item-section>
          <div class="row items-center justify-between">
            <strong>{{ review.user?.name || 'Utilisateur' }}</strong>
            <q-rating
              :model-value="review.rating"
              max="5"
              size="12px"
              color="orange-6"
              readonly
            />
          </div>
          <small class="text-muted">{{ date(review.updated_at) }}</small>
          <p v-if="review.comment" class="comment">{{ review.comment }}</p>
          <div v-if="review.reply" class="reply">
            <strong>Réponse de l’éditeur</strong>
            <p>{{ review.reply.body }}</p>
          </div>
          <div class="row items-center q-gutter-xs">
            <template v-if="isPublisher">
              <q-btn
                flat
                dense
                no-caps
                color="primary"
                :label="review.reply ? 'Modifier la réponse' : 'Répondre'"
                @click="reply(review)"
              />
              <q-btn
                v-if="review.reply"
                flat
                dense
                no-caps
                color="negative"
                label="Retirer la réponse"
                @click="removeReply(review)"
              />
            </template>
            <ReportButton
              v-if="review.user_id !== auth.user?.id"
              target-type="review"
              :target-id="review.id"
              dense
            />
          </div>
        </q-item-section>
      </q-item>
    </q-list>
    <div v-if="data.last_page > 1" class="row justify-center q-mt-sm">
      <q-pagination v-model="page" :max="data.last_page" />
    </div>
  </section>
</template>
<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import ReportButton from '@/components/ReportButton.vue'
import { useAuthStore } from '@/stores/auth'
import { communityApi } from '@/services/community'
import { apiMessage } from '@/services/account'

const props = defineProps({ app: { type: Object, required: true } })
const emit = defineEmits(['changed'])
const $q = useQuasar(),
  auth = useAuthStore(),
  route = useRoute()
const data = ref({
  data: [],
  total: 0,
  average: 0,
  distribution: {},
  last_page: 1,
  mine: null
})
const loading = ref(true),
  busy = ref(false),
  error = ref(''),
  page = ref(1),
  sort = ref('recent')
const form = reactive({ rating: 5, comment: '' })
const sortOptions = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'best', label: 'Meilleures notes' },
  { value: 'worst', label: 'Notes les plus basses' }
]
const isPublisher = computed(() => props.app.developer_id === auth.user?.id)
const canReview = computed(
  () =>
    auth.isAuthenticated && !!auth.user?.email_verified_at && !isPublisher.value
)
const date = value => new Date(value).toLocaleDateString('fr-FR')

async function load() {
  loading.value = true
  try {
    data.value = (
      await communityApi.reviews(props.app.id, {
        page: page.value,
        sort: sort.value
      })
    ).data
    if (data.value.mine)
      Object.assign(form, {
        rating: data.value.mine.rating,
        comment: data.value.mine.comment || ''
      })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
async function run(action, message) {
  busy.value = true
  error.value = ''
  try {
    await action()
    if (message) $q.notify({ type: 'positive', message })
    await load()
    emit('changed')
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
function save() {
  return run(
    () =>
      communityApi.saveReview({
        application_id: props.app.id,
        rating: form.rating,
        comment: form.comment || null
      }),
    'Avis enregistré.'
  )
}
function remove() {
  $q.dialog({
    title: 'Supprimer votre avis ?',
    cancel: true
  }).onOk(() =>
    run(async () => {
      await communityApi.deleteReview(data.value.mine.id)
      Object.assign(form, { rating: 5, comment: '' })
    }, 'Avis supprimé.')
  )
}
function reply(review) {
  $q.dialog({
    title: 'Répondre à cet avis',
    message: 'Votre réponse sera publique, sous l’avis.',
    prompt: {
      model: review.reply?.body || '',
      type: 'textarea',
      isValid: v => v.trim().length >= 2
    },
    cancel: true
  }).onOk(body =>
    run(() => communityApi.reply(review.id, body), 'Réponse publiée.')
  )
}
function removeReply(review) {
  return run(() => communityApi.deleteReply(review.id), 'Réponse retirée.')
}
watch(() => props.app.id, load, { immediate: true })
watch([page, sort], load)
</script>
<style scoped>
.summary {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.average {
  display: grid;
  justify-items: center;
  min-width: 96px;
}
.average strong {
  font-size: 34px;
  line-height: 1;
}
.average small {
  color: var(--muted);
}
.bars {
  flex: 1;
  min-width: 180px;
  display: grid;
  gap: 4px;
}
.bar {
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}
h2 {
  font-size: 18px;
  font-weight: 750;
  margin: 0;
}
h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 6px;
}
.sort {
  min-width: 190px;
}
.review {
  padding: 12px 0;
}
.comment {
  margin: 6px 0;
  white-space: pre-line;
}
.reply {
  margin: 8px 0;
  padding: 10px 12px;
  border-left: 3px solid var(--pwa-primary);
  background: var(--surface-low);
  border-radius: 8px;
}
.reply p {
  margin: 4px 0 0;
}
</style>
