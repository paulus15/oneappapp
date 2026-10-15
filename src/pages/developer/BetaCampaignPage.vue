<template>
  <q-page class="workspace-page">
    <router-link to="/developer/beta" class="back-link">
      <q-icon name="arrow_back" aria-hidden="true" />
      {{ ui('Toutes les campagnes') }}
    </router-link>

    <div
      v-if="loading"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton height="110px" class="q-mb-md" />
      <q-skeleton height="240px" />
    </div>
    <EmptyState
      v-else-if="notFound"
      icon="search_off"
      :title="ui('Campagne introuvable.')"
      :text="
        ui(
          'Cette campagne n’existe pas, ne concerne pas l’une de vos applications ou les tests bêta ne sont pas disponibles.'
        )
      "
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        to="/developer/beta"
        :label="ui('Toutes les campagnes')"
      />
    </EmptyState>
    <EmptyState
      v-else-if="error"
      tone="error"
      icon="cloud_off"
      :title="ui('Impossible de charger cette campagne.')"
      :text="error"
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        :label="ui('Réessayer')"
        @click="load()"
      />
    </EmptyState>

    <template v-else-if="campaign">
      <header class="workspace-card detail-head">
        <AppIcon
          :src="campaign.application?.icon_url"
          alt=""
          class="app-icon"
        />
        <div class="head-text">
          <span class="eyebrow">{{ campaign.application?.name }}</span>
          <h1>{{ campaign.name }}</h1>
          <div class="chips">
            <span
              class="chip"
              :class="`tone-${campaignStatusColor(campaign.status)}`"
              >{{ campaignStatusLabel(campaign.status) }}</span
            >
            <span class="muted">{{
              dateRange(campaign.starts_at, campaign.ends_at)
            }}</span>
          </div>
          <ul class="counts" role="list">
            <li>{{ betaPlural('applied', campaign.counts?.applied) }}</li>
            <li>
              {{ betaPlural('accepted', campaign.counts?.accepted) }}
              <span class="muted">/ {{ campaign.max_participants }}</span>
            </li>
            <li>{{ betaPlural('feedback', campaign.counts?.feedback) }}</li>
          </ul>
        </div>
      </header>

      <q-tabs
        v-model="tab"
        dense
        no-caps
        align="left"
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab name="participants" icon="group" :label="ui('Participants')" />
        <q-tab name="feedback" icon="forum" :label="ui('Retours')" />
        <q-tab name="settings" icon="tune" :label="ui('Paramètres')" />
      </q-tabs>

      <!-- Participants -->
      <section v-if="tab === 'participants'" :aria-label="ui('Participants')">
        <div class="status-chips" role="group" :aria-label="ui('Statut')">
          <button
            type="button"
            class="pill"
            :aria-pressed="!participantStatus"
            @click="participantStatus = null"
            >{{ ui('Tous') }}</button
          >
          <button
            v-for="option in participantOptions"
            :key="option.value"
            type="button"
            class="pill"
            :data-status="option.value"
            :aria-pressed="participantStatus === option.value"
            @click="participantStatus = option.value"
            >{{ option.label }}</button
          >
        </div>
        <div
          v-if="participants.loading.value"
          role="status"
          aria-busy="true"
          :aria-label="ui('Chargement…')"
        >
          <q-skeleton v-for="n in 3" :key="n" height="90px" class="q-mb-sm" />
        </div>
        <EmptyState
          v-else-if="participants.error.value"
          tone="error"
          icon="cloud_off"
          :title="ui('Les participants n’ont pas pu être chargés.')"
        >
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="refresh"
            :label="ui('Réessayer')"
            @click="participants.reload()"
          />
        </EmptyState>
        <EmptyState
          v-else-if="!participants.items.value.length"
          icon="group"
          :title="
            participantStatus
              ? ui('Aucun participant avec ce statut.')
              : ui('Aucune candidature pour le moment.')
          "
          :text="
            participantStatus
              ? ''
              : ui(
                  'Les candidatures apparaîtront ici une fois la campagne approuvée et publiée.'
                )
          "
        />
        <template v-else>
          <p v-if="!canAccept" class="accept-hint muted" role="status">
            <q-icon name="info" aria-hidden="true" />
            {{
              ui(
                'Vous pourrez accepter des testeurs quand la campagne sera approuvée et tant qu’elle n’est pas terminée.'
              )
            }}
          </p>
          <ul class="rows" role="list">
            <li
              v-for="person in participants.items.value"
              :key="person.id"
              class="workspace-card row"
              :data-participant="person.id"
            >
              <div class="row-head">
                <strong>{{ person.label }}</strong>
                <span v-if="person.country" class="muted"
                  >{{ flagEmoji(person.country) }} {{ person.country }}</span
                >
                <span
                  class="chip"
                  :class="`tone-${participantStatusColor(person.status)}`"
                  >{{ participantStatusLabel(person.status) }}</span
                >
                <small class="muted">{{
                  ui('Candidature du {date}', {
                    date: betaDate(person.applied_at)
                  })
                }}</small>
                <small v-if="person.feedback_count" class="muted">{{
                  betaPlural('feedback', person.feedback_count)
                }}</small>
              </div>
              <dl v-if="person.answers?.length" class="answers">
                <template
                  v-for="answer in person.answers"
                  :key="answer.question_id"
                >
                  <dt>{{ answer.label }}</dt>
                  <dd>{{ answerText(answer) }}</dd>
                </template>
              </dl>
              <div class="row-actions">
                <q-btn
                  v-if="
                    canAccept && ['applied', 'rejected'].includes(person.status)
                  "
                  unelevated
                  dense
                  no-caps
                  color="positive"
                  icon="check"
                  class="accept"
                  :label="ui('Accepter')"
                  @click="askDecision(person, 'accepted')"
                />
                <q-btn
                  v-if="person.status === 'applied'"
                  flat
                  dense
                  no-caps
                  color="negative"
                  icon="close"
                  class="reject"
                  :label="ui('Refuser')"
                  @click="askDecision(person, 'rejected')"
                />
                <q-btn
                  v-if="person.status === 'accepted'"
                  flat
                  dense
                  no-caps
                  color="negative"
                  icon="person_remove"
                  class="remove"
                  :label="ui('Exclure')"
                  @click="askDecision(person, 'removed')"
                />
              </div>
            </li>
          </ul>
          <LoadMore
            :has-more="participants.hasMore.value"
            :loading="participants.loadingMore.value"
            :error="participants.moreError.value"
            :shown="participants.items.value.length"
            :total="participants.total.value"
            :page-size="LIST_PAGE_SIZE"
            @load="participants.loadMore()"
          />
        </template>
      </section>

      <!-- Feedback -->
      <section v-else-if="tab === 'feedback'" :aria-label="ui('Retours')">
        <div class="filter-row">
          <q-select
            v-model="feedbackType"
            :options="typeOptions"
            emit-value
            map-options
            outlined
            dense
            clearable
            :label="ui('Tous les types')"
          />
          <q-select
            v-model="feedbackStatus"
            :options="feedbackOptions"
            emit-value
            map-options
            outlined
            dense
            clearable
            :label="ui('Tous les statuts')"
          />
        </div>
        <div
          v-if="feedback.loading.value"
          role="status"
          aria-busy="true"
          :aria-label="ui('Chargement…')"
        >
          <q-skeleton v-for="n in 3" :key="n" height="80px" class="q-mb-sm" />
        </div>
        <EmptyState
          v-else-if="feedback.error.value"
          tone="error"
          icon="cloud_off"
          :title="ui('Les retours n’ont pas pu être chargés.')"
        >
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="refresh"
            :label="ui('Réessayer')"
            @click="feedback.reload()"
          />
        </EmptyState>
        <EmptyState
          v-else-if="!feedback.items.value.length"
          icon="forum"
          :title="
            feedbackType || feedbackStatus
              ? ui('Aucun retour ne correspond à ces filtres.')
              : ui('Aucun retour pour le moment.')
          "
          :text="
            feedbackType || feedbackStatus
              ? ''
              : ui(
                  'Les testeurs acceptés peuvent envoyer des retours privés depuis « Mes tests ».'
                )
          "
        />
        <template v-else>
          <ul class="rows" role="list">
            <li
              v-for="item in feedback.items.value"
              :key="item.id"
              class="workspace-card row"
            >
              <div class="row-head">
                <button
                  type="button"
                  class="row-title open-feedback"
                  @click="openFeedback(item.id)"
                  >{{ item.title }}</button
                >
                <span class="chip">{{ feedbackTypeLabel(item.type) }}</span>
                <span
                  class="chip"
                  :class="`tone-${feedbackStatusColor(item.status)}`"
                  >{{ feedbackStatusLabel(item.status) }}</span
                >
              </div>
              <p v-if="item.excerpt" class="excerpt">{{ item.excerpt }}</p>
              <small class="muted meta">
                <span>{{ item.participant_label }}</span>
                <span>{{ betaDate(item.created_at) }}</span>
                <span v-if="item.attachments_count"
                  ><q-icon name="attach_file" aria-hidden="true" />
                  {{ betaPlural('images', item.attachments_count) }}</span
                >
                <span v-if="item.replied_at"
                  ><q-icon name="reply" aria-hidden="true" />
                  {{ ui('Répondu') }}</span
                >
              </small>
            </li>
          </ul>
          <LoadMore
            :has-more="feedback.hasMore.value"
            :loading="feedback.loadingMore.value"
            :error="feedback.moreError.value"
            :shown="feedback.items.value.length"
            :total="feedback.total.value"
            :page-size="LIST_PAGE_SIZE"
            @load="feedback.loadMore()"
          />
        </template>
      </section>

      <!-- Settings -->
      <section v-else class="settings" :aria-label="ui('Paramètres')">
        <div
          v-if="campaign.status === 'rejected'"
          class="workspace-card rejected-box"
          role="status"
        >
          <h2>{{ ui('Campagne refusée par l’équipe PWA Store') }}</h2>
          <p v-if="campaign.review_reason" class="reason">{{
            campaign.review_reason
          }}</p>
          <p>{{
            ui('Corrigez la campagne puis renvoyez-la en validation.')
          }}</p>
        </div>
        <div
          v-else-if="campaign.status === 'pending'"
          class="workspace-card"
          role="status"
        >
          <p>{{
            ui(
              'La campagne est en cours de validation par l’équipe PWA Store. Elle ne peut pas être modifiée pendant ce temps : retirez-la de la validation pour la corriger.'
            )
          }}</p>
        </div>
        <div
          v-else-if="campaign.status === 'draft'"
          class="workspace-card"
          role="status"
        >
          <p>{{
            ui(
              'Brouillon : la campagne n’est pas visible. Envoyez-la en validation quand elle est prête.'
            )
          }}</p>
        </div>

        <dl class="workspace-card facts">
          <dt>{{ ui('Statut') }}</dt>
          <dd>{{ campaignStatusLabel(campaign.status) }}</dd>
          <dt>{{ ui('Dates') }}</dt>
          <dd>{{ dateRange(campaign.starts_at, campaign.ends_at) }}</dd>
          <dt>{{ ui('Nombre de places') }}</dt>
          <dd>{{ campaign.max_participants }}</dd>
          <dt>{{ ui('Acceptation') }}</dt>
          <dd>{{
            campaign.auto_accept
              ? ui('Automatique tant qu’il reste des places')
              : ui('Manuelle')
          }}</dd>
          <dt>{{ ui('Adresse de la version bêta (privée)') }}</dt>
          <dd class="mono">{{ campaign.beta_url || '—' }}</dd>
          <template v-if="campaign.instructions">
            <dt>{{ ui('Instructions (privées)') }}</dt>
            <dd class="instructions">
              <SuggestionDetail :suggestion="instructionsView" />
            </dd>
          </template>
          <template v-if="campaign.submitted_at">
            <dt>{{ ui('Envoyée en validation') }}</dt>
            <dd>{{ betaDate(campaign.submitted_at, true) }}</dd>
          </template>
          <template v-if="campaign.reviewed_at">
            <dt>{{ ui('Décision de l’équipe') }}</dt>
            <dd>{{ betaDate(campaign.reviewed_at, true) }}</dd>
          </template>
        </dl>

        <div class="settings-actions">
          <q-btn
            v-if="!['closed', 'pending'].includes(campaign.status)"
            outline
            no-caps
            color="primary"
            icon="edit"
            class="edit-campaign"
            :to="`/developer/beta/${campaign.id}/edit`"
            :label="
              campaign.status === 'rejected'
                ? ui('Corriger la campagne')
                : ui('Modifier')
            "
          />
          <q-btn
            v-if="['draft', 'rejected'].includes(campaign.status)"
            unelevated
            no-caps
            color="primary"
            icon="send"
            class="submit-campaign"
            :label="
              campaign.status === 'rejected'
                ? ui('Renvoyer en validation')
                : ui('Envoyer en validation')
            "
            :loading="acting === 'submit'"
            @click="submit"
          />
          <q-btn
            v-if="campaign.status === 'pending'"
            outline
            no-caps
            color="primary"
            icon="undo"
            class="withdraw-campaign"
            :label="ui('Retirer de la validation')"
            @click="withdrawOpen = true"
          />
          <q-btn
            v-if="['approved', 'pending'].includes(campaign.status)"
            flat
            no-caps
            color="negative"
            icon="lock"
            class="close-campaign"
            :label="ui('Clôturer la campagne')"
            @click="closeOpen = true"
          />
        </div>
        <ul
          v-if="submitProblems.length"
          class="form-error submit-problems"
          role="alert"
        >
          <li v-for="message in submitProblems" :key="message">{{
            message
          }}</li>
        </ul>
      </section>
    </template>

    <!-- Withdraw from review -->
    <q-dialog v-model="withdrawOpen">
      <q-card class="confirm-card">
        <q-card-section>
          <h2>{{ ui('Retirer la campagne de la validation ?') }}</h2>
          <p>{{
            ui(
              'Elle redevient un brouillon que vous pouvez modifier, puis renvoyer en validation.'
            )
          }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps :label="ui('Annuler')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="confirm-withdraw"
            :label="ui('Retirer de la validation')"
            :loading="acting === 'withdraw'"
            @click="withdrawReview"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Participant decision -->
    <q-dialog v-model="decisionOpen">
      <q-card class="confirm-card">
        <q-card-section>
          <h2>{{ decisionTitle }}</h2>
          <p>{{ decisionText }}</p>
          <p v-if="decisionError" class="form-error" role="alert">{{
            decisionError
          }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps :label="ui('Annuler')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            :color="decision?.status === 'accepted' ? 'positive' : 'negative'"
            class="confirm-decision"
            :label="ui('Confirmer')"
            :loading="deciding"
            @click="decide"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Close campaign -->
    <q-dialog v-model="closeOpen">
      <q-card class="confirm-card">
        <q-card-section>
          <h2>{{ ui('Clôturer cette campagne ?') }}</h2>
          <p>{{
            ui(
              'Elle disparaît du catalogue, les candidatures sont fermées et les testeurs ne peuvent plus envoyer de retour. Cette action est définitive.'
            )
          }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps :label="ui('Annuler')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="negative"
            class="confirm-close"
            :label="ui('Clôturer')"
            :loading="acting === 'close'"
            @click="closeCampaign"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Feedback detail drawer -->
    <q-dialog
      v-model="drawerOpen"
      position="right"
      full-height
      :maximized="$q.screen.lt.sm"
    >
      <q-card
        class="feedback-drawer"
        role="region"
        :aria-label="ui('Détail du retour')"
      >
        <q-card-section class="drawer-top">
          <h2>{{ current?.title || ui('Retour') }}</h2>
          <q-btn
            flat
            round
            dense
            icon="close"
            :aria-label="ui('Fermer')"
            v-close-popup
          />
        </q-card-section>
        <q-card-section v-if="currentLoading">
          <q-skeleton height="200px" />
        </q-card-section>
        <q-card-section v-else-if="currentError">
          <EmptyState
            compact
            tone="error"
            icon="cloud_off"
            :title="currentError"
          >
            <q-btn
              flat
              no-caps
              color="primary"
              :label="ui('Réessayer')"
              @click="openFeedback(currentId)"
            />
          </EmptyState>
        </q-card-section>
        <template v-else-if="current">
          <q-card-section class="drawer-meta">
            <span class="chip">{{ feedbackTypeLabel(current.type) }}</span>
            <span class="muted">{{ current.participant_label }}</span>
            <span class="muted">{{ betaDate(current.created_at, true) }}</span>
            <span v-if="current.device" class="muted"
              ><q-icon name="devices" aria-hidden="true" />
              {{ current.device }}</span
            >
          </q-card-section>
          <q-card-section>
            <SuggestionDetail
              :suggestion="bodyView"
              :fetch-attachment="betaTesterApi.attachment"
            />
            <div v-if="current.steps" class="steps">
              <h3>{{ ui('Étapes pour reproduire') }}</h3>
              <p>{{ current.steps }}</p>
            </div>
          </q-card-section>
          <q-card-section class="workspace-form">
            <q-select
              v-model="triage.status"
              :options="feedbackOptions"
              emit-value
              map-options
              outlined
              dense
              :label="ui('Statut')"
            />
            <q-input
              v-model="triage.reply"
              outlined
              type="textarea"
              autogrow
              :maxlength="BETA_LIMITS.reply"
              counter
              :label="ui('Réponse privée — visible uniquement par le testeur')"
            />
            <p v-if="saveError" class="form-error" role="alert">{{
              saveError
            }}</p>
            <div class="row justify-end">
              <q-btn
                unelevated
                no-caps
                color="primary"
                class="save-feedback"
                :label="ui('Enregistrer')"
                :disable="!feedbackChanged"
                :loading="savingFeedback"
                @click="saveFeedback"
              />
            </div>
          </q-card-section>
        </template>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import SuggestionDetail from '@/components/SuggestionDetail.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { betaDevApi, betaTesterApi } from '@/services/beta'
import { flagEmoji } from '@/utils/countries'
import {
  BETA_LIMITS,
  LIST_PAGE_SIZE,
  campaignForm,
  campaignProblems,
  hasEnded,
  answerText,
  attachmentView,
  betaDate,
  betaPlural,
  campaignStatusColor,
  campaignStatusLabel,
  dateRange,
  feedbackStatusColor,
  feedbackStatusLabel,
  feedbackStatusOptions,
  feedbackTypeLabel,
  feedbackTypeOptions,
  participantStatusColor,
  participantStatusLabel,
  participantStatusOptions
} from '@/utils/beta'

const $q = useQuasar(),
  route = useRoute(),
  router = useRouter()
const campaignId = computed(() => route.params.id)
const TABS = ['participants', 'feedback', 'settings']
const tabFromQuery = () =>
  TABS.includes(route.query?.tab) ? route.query.tab : 'participants'
const tab = ref(tabFromQuery())

const campaign = ref(null),
  loading = ref(true),
  notFound = ref(false),
  error = ref(''),
  acting = ref(null),
  closeOpen = ref(false),
  withdrawOpen = ref(false),
  submitProblems = ref([])

// Testers can be accepted only while the campaign is approved and not over.
const canAccept = computed(
  () =>
    campaign.value?.status === 'approved' && !hasEnded(campaign.value?.ends_at)
)
const instructionsView = computed(() => ({
  id: `instructions-${campaign.value?.id}`,
  body: campaign.value?.instructions || '',
  attachments: [],
  developer_reply: null
}))

const participantStatus = ref(null),
  feedbackType = ref(null),
  feedbackStatus = ref(null)
const participantOptions = computed(() => participantStatusOptions())
const typeOptions = computed(() => feedbackTypeOptions())
const feedbackOptions = computed(() => feedbackStatusOptions())

const participants = useLoadMore(
  async page =>
    (
      await betaDevApi.participants(campaignId.value, {
        status: participantStatus.value,
        page
      })
    ).data
)
const feedback = useLoadMore(
  async page =>
    (
      await betaDevApi.feedback(campaignId.value, {
        type: feedbackType.value,
        status: feedbackStatus.value,
        page
      })
    ).data
)

// Only the latest load fills the page: a late answer for campaign 3 never shows on 4.
let seq = 0
async function load({ quiet = false } = {}) {
  const current = ++seq
  if (!quiet) {
    loading.value = true
    campaign.value = null
  }
  notFound.value = false
  error.value = ''
  try {
    const { data } = await betaDevApi.show(campaignId.value)
    if (current !== seq) return
    campaign.value = data?.data || null
    if (!campaign.value) notFound.value = true
  } catch (e) {
    if (current !== seq) return
    if (e.response?.status === 404) notFound.value = true
    else if (!quiet) error.value = apiMessage(e)
  } finally {
    if (current === seq) loading.value = false
  }
}

function loadTab() {
  if (tab.value === 'participants') void participants.reload()
  else if (tab.value === 'feedback') void feedback.reload()
}

// ---------- Participants ----------
const decisionOpen = ref(false),
  decision = ref(null),
  deciding = ref(false),
  decisionError = ref('')
const decisionTitle = computed(() => {
  const name = decision.value?.person?.label || ''
  return {
    accepted: ui('Accepter {name} ?', { name }),
    rejected: ui('Refuser {name} ?', { name }),
    removed: ui('Exclure {name} du test ?', { name })
  }[decision.value?.status]
})
const decisionText = computed(
  () =>
    ({
      accepted: ui(
        'Le testeur aura accès à la version bêta et à vos instructions à partir du début du test, tant que la campagne reste approuvée.'
      ),
      rejected: ui(
        'Le candidat est prévenu que sa candidature n’est pas retenue.'
      ),
      removed: ui(
        'Le testeur perd immédiatement l’accès à la version bêta. Ses retours déjà envoyés restent visibles.'
      )
    })[decision.value?.status]
)
function askDecision(person, status) {
  decision.value = { person, status }
  decisionError.value = ''
  decisionOpen.value = true
}
async function decide() {
  const current = decision.value
  if (!current || deciding.value) return
  deciding.value = true
  decisionError.value = ''
  const campaignSeq = seq
  try {
    const { data } = await betaDevApi.decide(current.person.id, current.status)
    if (campaignSeq !== seq) return
    Object.assign(current.person, data?.data || { status: current.status })
    decisionOpen.value = false
    $q.notify({ type: 'positive', message: ui('Décision enregistrée.') })
    void load({ quiet: true })
  } catch (e) {
    if (campaignSeq !== seq) return
    decisionError.value = isFullCampaign(e, current.status)
      ? ui(
          'La campagne est complète : augmentez le nombre de places ou excluez un testeur avant d’en accepter un autre.'
        )
      : apiMessage(e)
  } finally {
    deciding.value = false
  }
}

// The "full" refusal is a 422 on an acceptance that is not a state error (`status`) and
// whose message speaks about places; anything else shows the server's own message.
function isFullCampaign(e, wanted) {
  if (e.response?.status !== 422 || wanted !== 'accepted') return false
  const errors = e.response?.data?.errors || {}
  if (errors.status) return false
  return /complet|full|places|max_participants/i.test(
    [
      e.response?.data?.message,
      ...Object.keys(errors),
      ...Object.values(errors).flat()
    ].join(' ')
  )
}

// ---------- Feedback drawer ----------
const drawerOpen = ref(false),
  currentId = ref(null),
  current = ref(null),
  currentLoading = ref(false),
  currentError = ref(''),
  savingFeedback = ref(false),
  saveError = ref('')
const triage = reactive({ status: null, reply: '' })
const bodyView = computed(() => ({
  id: current.value?.id,
  body: current.value?.body || '',
  attachments: attachmentView(current.value?.attachments),
  developer_reply: null
}))
const feedbackChanged = computed(
  () =>
    !!current.value &&
    (triage.status !== current.value.status ||
      triage.reply.trim() !== (current.value.developer_reply || '').trim())
)
// Unsaved status/reply per feedback: switching or closing the drawer keeps the draft.
const drafts = reactive({})
function fillTriage(data) {
  triage.status = data?.status || null
  triage.reply = data?.developer_reply || ''
  const draft = data?.id ? drafts[data.id] : null
  if (draft) Object.assign(triage, draft)
}
function keepDraft() {
  const id = current.value?.id
  if (!id) return
  if (feedbackChanged.value) drafts[id] = { ...triage }
  else delete drafts[id]
}

let feedbackSeq = 0
async function openFeedback(id) {
  keepDraft()
  const mine = ++feedbackSeq
  currentId.value = id
  drawerOpen.value = true
  current.value = null
  currentLoading.value = true
  currentError.value = ''
  saveError.value = ''
  savingFeedback.value = false
  try {
    const { data } = await betaDevApi.feedbackDetail(id)
    if (mine !== feedbackSeq) return
    current.value = data?.data || null
    fillTriage(current.value)
  } catch (e) {
    if (mine !== feedbackSeq) return
    currentError.value =
      e.response?.status === 404 ? ui('Retour introuvable.') : apiMessage(e)
  } finally {
    if (mine === feedbackSeq) currentLoading.value = false
  }
}

/** Only the changed fields: { status?, reply? }. */
function feedbackPayload() {
  const payload = {}
  if (triage.status && triage.status !== current.value?.status)
    payload.status = triage.status
  const reply = triage.reply.trim()
  if (reply !== (current.value?.developer_reply || '').trim())
    payload.reply = reply
  return payload
}
async function saveFeedback() {
  const payload = feedbackPayload()
  if (!Object.keys(payload).length || savingFeedback.value) return
  const mine = feedbackSeq,
    id = current.value.id
  savingFeedback.value = true
  saveError.value = ''
  try {
    const { data } = await betaDevApi.updateFeedback(id, payload)
    if (mine !== feedbackSeq) return
    delete drafts[id]
    current.value = data?.data || { ...current.value, ...payload }
    fillTriage(current.value)
    const row = feedback.items.value.find(item => item.id === id)
    if (row) {
      row.status = current.value.status
      if (payload.reply !== undefined)
        row.replied_at = payload.reply ? new Date().toISOString() : null
    }
    $q.notify({
      type: 'positive',
      message:
        payload.reply !== undefined && payload.reply
          ? ui('Réponse enregistrée. Le testeur est prévenu.')
          : ui('Retour mis à jour.')
    })
    // The "new feedback" counters follow the status change.
    if (payload.status) void load({ quiet: true })
  } catch (e) {
    if (mine !== feedbackSeq) return
    saveError.value = apiMessage(e)
  } finally {
    if (mine === feedbackSeq) savingFeedback.value = false
  }
}

// ---------- Settings ----------
async function submit() {
  if (acting.value) return
  // Same completeness rules as the API, before asking it.
  submitProblems.value = Object.values(
    campaignProblems(campaignForm(campaign.value), { complete: true })
  )
  if (submitProblems.value.length) return
  acting.value = 'submit'
  try {
    const { data } = await betaDevApi.submit(campaignId.value)
    if (data?.data) campaign.value = data.data
    else void load({ quiet: true })
    $q.notify({
      type: 'positive',
      message: ui(
        'Campagne envoyée en validation. Vous serez prévenu de la décision.'
      )
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    acting.value = null
  }
}
async function withdrawReview() {
  if (acting.value) return
  acting.value = 'withdraw'
  try {
    const { data } = await betaDevApi.withdraw(campaignId.value)
    if (data?.data) campaign.value = data.data
    else void load({ quiet: true })
    withdrawOpen.value = false
    $q.notify({
      type: 'positive',
      message: ui('La campagne est de nouveau un brouillon modifiable.')
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    acting.value = null
  }
}
async function closeCampaign() {
  if (acting.value) return
  acting.value = 'close'
  try {
    const { data } = await betaDevApi.close(campaignId.value)
    if (data?.data) campaign.value = data.data
    else void load({ quiet: true })
    closeOpen.value = false
    $q.notify({ type: 'positive', message: ui('Campagne clôturée.') })
  } catch (e) {
    $q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    acting.value = null
  }
}

watch(tab, value => {
  loadTab()
  // The tab is part of the address (shareable, back button).
  if (route.query?.tab !== value)
    router.replace?.({ query: { ...route.query, tab: value } })
})
watch(
  () => route.query?.tab,
  () => {
    tab.value = tabFromQuery()
  }
)
watch(drawerOpen, open => {
  if (!open) keepDraft()
})
watch(participantStatus, () => void participants.reload())
watch([feedbackType, feedbackStatus], () => void feedback.reload())
watch(campaignId, id => {
  if (!id) return
  drawerOpen.value = false
  feedbackSeq++
  void load()
  loadTab()
})
onMounted(() => {
  void load()
  loadTab()
})

defineExpose({
  campaign,
  tab,
  participantStatus,
  feedbackType,
  feedbackStatus,
  askDecision,
  decide,
  decisionOpen,
  decisionError,
  openFeedback,
  triage,
  saveFeedback,
  current,
  submit,
  submitProblems,
  withdrawReview,
  withdrawOpen,
  canAccept,
  closeCampaign
})
</script>
<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  color: var(--pwa-link);
  font-weight: 650;
  text-decoration: none;
}
.back-link:focus-visible,
.pill:focus-visible,
.row-title:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.detail-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;
  border: 1px solid var(--outline);
}
.app-icon {
  flex: none;
  width: 56px;
  height: 56px;
  overflow: hidden;
  border-radius: 14px;
}
.head-text {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.chips,
.counts,
.row-head,
.meta,
.drawer-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.muted {
  color: var(--muted);
}
.status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.pill {
  min-height: 36px;
  padding: 4px 14px;
  color: var(--text);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 999px;
  cursor: pointer;
}
.pill[aria-pressed='true'] {
  color: #fff;
  background: var(--q-primary);
  border-color: var(--q-primary);
}
.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.rows {
  display: grid;
  gap: 10px;
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
}
.row {
  display: grid;
  gap: 8px;
  border: 1px solid var(--outline);
}
.row-title {
  padding: 0;
  color: var(--text);
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  text-align: left;
  background: none;
  border: 0;
  cursor: pointer;
}
.row-title:hover {
  color: var(--pwa-link);
  text-decoration: underline;
}
.excerpt {
  margin: 0;
}
.answers {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin: 0;
}
.answers dd {
  white-space: pre-line;
}
.row-actions,
.accept-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
}
.submit-problems {
  padding-left: 18px;
}
.settings-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.settings {
  display: grid;
  gap: 14px;
}
.rejected-box {
  border: 1px solid var(--q-negative);
}
.reason {
  color: var(--text);
  white-space: pre-line;
}
.facts {
  margin: 0;
  border: 1px solid var(--outline);
}
.mono {
  font-family: ui-monospace, monospace;
  overflow-wrap: anywhere;
}
.chip {
  --chip: var(--muted);
  padding: 2px 9px;
  font-size: 12px;
  font-weight: 650;
  background: color-mix(in srgb, var(--chip) 14%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--chip) 35%, transparent);
  border-radius: 999px;
}
.tone-primary {
  --chip: var(--q-primary);
}
.tone-positive {
  --chip: var(--q-positive);
}
.tone-orange-8 {
  --chip: var(--q-warning);
}
.tone-negative {
  --chip: var(--q-negative);
}
.confirm-card {
  width: min(460px, 100vw);
}
.confirm-card h2 {
  margin: 0 0 8px;
}
.form-error {
  margin: 8px 0 0;
  color: var(--q-negative);
}
.feedback-drawer {
  width: min(560px, 100vw);
  max-width: 100vw;
}
.drawer-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.drawer-top h2 {
  margin: 0;
}
.steps p {
  margin: 0;
  white-space: pre-line;
}
.steps h3 {
  margin: 12px 0 4px;
}
</style>
