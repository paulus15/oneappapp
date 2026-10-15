<template>
  <q-page class="workspace-page my-beta">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Tests bêta') }}</span
      ><h1>{{ ui('Mes tests') }}</h1
      ><p>{{
        ui(
          'Vos candidatures, l’accès aux versions bêta qui vous ont accepté et vos retours au développeur.'
        )
      }}</p
      ><div class="workspace-actions">
        <q-btn
          flat
          no-caps
          color="primary"
          icon="search"
          to="/beta"
          :label="ui('Trouver un test')" /></div
    ></header>

    <div
      v-if="list.loading.value"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton v-for="n in 3" :key="n" height="120px" class="q-mb-md" />
    </div>
    <EmptyState
      v-else-if="list.error.value"
      tone="error"
      icon="cloud_off"
      :title="ui('Vos tests n’ont pas pu être chargés.')"
      :text="errorText"
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        :label="ui('Réessayer')"
        @click="list.reload()"
      />
    </EmptyState>
    <EmptyState
      v-else-if="!items.length"
      icon="biotech"
      :title="ui('Vous ne participez à aucun test pour le moment.')"
      :text="
        ui('Parcourez les campagnes ouvertes et proposez-vous comme testeur.')
      "
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        to="/beta"
        :label="ui('Devenir testeur')"
      />
    </EmptyState>
    <template v-else>
      <ul class="participations" role="list">
        <li
          v-for="item in items"
          :key="item.id"
          class="workspace-card participation"
          :data-participation="item.id"
        >
          <div class="p-head">
            <AppIcon
              :src="item.campaign?.application?.icon_url"
              alt=""
              class="app-icon"
            />
            <div class="p-titles">
              <small class="text-muted">{{
                item.campaign?.application?.name
              }}</small>
              <router-link :to="`/beta/${item.campaign?.id}`" class="p-name">{{
                item.campaign?.name
              }}</router-link>
              <small class="text-muted">
                {{
                  ui('Candidature du {date}', {
                    date: betaDate(item.applied_at)
                  })
                }}
                <template v-if="item.campaign?.ends_at">
                  ·
                  {{
                    ui('Fin du test : {date}', {
                      date: betaDate(item.campaign.ends_at)
                    })
                  }}
                </template>
              </small>
            </div>
            <span
              class="chip"
              :class="`tone-${participantStatusColor(item.status)}`"
              >{{ participantStatusLabel(item.status) }}</span
            >
          </div>

          <p v-if="item.status === 'applied'" class="state-line">{{
            ui('Le développeur n’a pas encore répondu à votre candidature.')
          }}</p>
          <p v-else-if="item.status === 'rejected'" class="state-line">{{
            ui('Votre candidature n’a pas été retenue pour ce test.')
          }}</p>
          <p v-else-if="item.status === 'removed'" class="state-line">{{
            ui('Le développeur a mis fin à votre participation.')
          }}</p>
          <p v-else-if="item.status === 'withdrawn'" class="state-line">{{
            ui('Vous vous êtes retiré de ce test.')
          }}</p>
          <p
            v-else-if="item.status === 'accepted' && !item.access"
            class="state-line access-paused"
            role="status"
            >{{ accessPausedReason(item.campaign) }}</p
          >

          <section
            v-if="item.access"
            class="access"
            :aria-label="ui('Accès à la version bêta')"
          >
            <h2>
              <q-icon name="lock_open" aria-hidden="true" />
              {{ ui('Accès à la version bêta') }}
            </h2>
            <p class="access-note">{{
              ui('Adresse confidentielle : ne la partagez pas.')
            }}</p>
            <a
              v-if="item.access.beta_url"
              :href="item.access.beta_url"
              target="_blank"
              rel="noopener noreferrer"
              class="beta-link"
            >
              <q-icon name="open_in_new" aria-hidden="true" />
              {{ ui('Ouvrir la version bêta') }}
              <span class="sr-only">{{ ui('(nouvel onglet)') }}</span>
            </a>
            <div v-if="item.access.instructions" class="instructions">
              <h3>{{ ui('Instructions du développeur') }}</h3>
              <SuggestionDetail :suggestion="instructionsView(item)" />
            </div>
          </section>

          <div class="p-actions">
            <q-btn
              v-if="canSendFeedback(item)"
              unelevated
              no-caps
              color="primary"
              icon="rate_review"
              class="toggle-form"
              :aria-expanded="formOpen[item.id] ? 'true' : 'false'"
              :label="
                formOpen[item.id]
                  ? ui('Fermer le formulaire')
                  : ui('Envoyer un retour')
              "
              @click="toggleForm(item)"
            />
            <q-btn
              v-if="item.status === 'accepted' || item.feedback_count"
              flat
              no-caps
              color="primary"
              icon="forum"
              class="toggle-list"
              :aria-expanded="listOpen[item.id] ? 'true' : 'false'"
              :label="
                listOpen[item.id]
                  ? ui('Masquer mes retours')
                  : ui('Mes retours ({n})', { n: item.feedback_count || 0 })
              "
              @click="listOpen[item.id] = !listOpen[item.id]"
            />
            <q-btn
              v-if="['applied', 'accepted'].includes(item.status)"
              flat
              no-caps
              color="negative"
              icon="logout"
              class="withdraw"
              :label="ui('Me retirer du test')"
              @click="askWithdraw(item)"
            />
          </div>

          <!-- Kept mounted once opened: closing it never loses a draft. -->
          <BetaFeedbackForm
            v-if="formMounted[item.id] && canSendFeedback(item)"
            v-show="formOpen[item.id]"
            :participation-id="item.id"
            class="q-mt-md"
            @sent="onSent(item, $event)"
          />
          <BetaMyFeedback
            v-if="listOpen[item.id]"
            :ref="el => setFeedbackList(item.id, el)"
            :participation-id="item.id"
            class="q-mt-md"
          />
        </li>
      </ul>
      <LoadMore
        :has-more="list.hasMore.value"
        :loading="list.loadingMore.value"
        :error="list.moreError.value"
        :shown="items.length"
        :total="list.total.value"
        :page-size="TESTER_PAGE_SIZE"
        @load="list.loadMore()"
      />
    </template>

    <q-dialog v-model="withdrawOpen">
      <q-card class="confirm-card">
        <q-card-section>
          <h2>{{ ui('Vous retirer de ce test ?') }}</h2>
          <p>{{
            ui(
              'Vous n’aurez plus accès à la version bêta de « {name} ». Vos retours déjà envoyés restent visibles par le développeur.',
              { name: withdrawing?.campaign?.name || '' }
            )
          }}</p>
          <p v-if="withdrawError" class="form-error" role="alert">{{
            withdrawError
          }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps :label="ui('Annuler')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="negative"
            class="confirm-withdraw"
            :label="ui('Me retirer')"
            :loading="withdrawBusy"
            @click="withdraw"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import SuggestionDetail from '@/components/SuggestionDetail.vue'
import BetaFeedbackForm from '@/components/beta/BetaFeedbackForm.vue'
import BetaMyFeedback from '@/components/beta/BetaMyFeedback.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { betaTesterApi } from '@/services/beta'
import {
  TESTER_PAGE_SIZE,
  accessPausedReason,
  betaDate,
  participantStatusColor,
  participantStatusLabel
} from '@/utils/beta'

const $q = useQuasar()
const list = useLoadMore(
  async page => (await betaTesterApi.participations(page)).data
)
const items = list.items
const errorText = computed(() =>
  list.last.value?.response || list.last.value instanceof Error
    ? apiMessage(list.last.value)
    : ''
)
const formOpen = reactive({}),
  formMounted = reactive({}),
  listOpen = reactive({}),
  withdrawOpen = ref(false),
  withdrawing = ref(null),
  withdrawBusy = ref(false),
  withdrawError = ref('')

// Feedback while the tester is accepted, has access, and the campaign is still running.
const canSendFeedback = item =>
  item.status === 'accepted' &&
  !!item.access &&
  item.campaign?.status !== 'closed'

// The developer's instructions go through the existing sanitized renderer.
const instructionsView = item => ({
  id: `instructions-${item.id}`,
  body: item.access?.instructions || '',
  attachments: [],
  developer_reply: null
})

const feedbackLists = {}
function setFeedbackList(id, el) {
  if (el) feedbackLists[id] = el
  else delete feedbackLists[id]
}
function toggleForm(item) {
  formMounted[item.id] = true
  formOpen[item.id] = !formOpen[item.id]
}

// The new feedback goes on top of the open list; a closed list loads it when opened.
function onSent(item, feedback) {
  item.feedback_count = (Number(item.feedback_count) || 0) + 1
  formOpen[item.id] = false
  if (listOpen[item.id]) feedbackLists[item.id]?.add(feedback)
  else listOpen[item.id] = true
}

function askWithdraw(item) {
  withdrawing.value = item
  withdrawError.value = ''
  withdrawOpen.value = true
}
async function withdraw() {
  const item = withdrawing.value
  if (!item || withdrawBusy.value) return
  withdrawBusy.value = true
  withdrawError.value = ''
  try {
    const { data } = await betaTesterApi.withdraw(item.id)
    // The API answers { data: MyParticipation }.
    Object.assign(item, data?.data || {}, { status: 'withdrawn', access: null })
    formOpen[item.id] = false
    withdrawOpen.value = false
    $q.notify({
      type: 'positive',
      message: ui('Vous vous êtes retiré du test.')
    })
  } catch (e) {
    withdrawError.value = apiMessage(e)
  } finally {
    withdrawBusy.value = false
  }
}

onMounted(() => void list.reload())
defineExpose({
  items,
  formOpen,
  listOpen,
  toggleForm,
  onSent,
  askWithdraw,
  withdraw,
  withdrawOpen
})
</script>
<style scoped>
.participations {
  display: grid;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.participation {
  border: 1px solid var(--outline);
}
.p-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
}
.app-icon {
  flex: none;
  width: 52px;
  height: 52px;
  overflow: hidden;
  border-radius: 14px;
}
.p-titles {
  display: grid;
  flex: 1;
  min-width: 0;
}
.p-name {
  color: var(--text);
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
}
.p-name:hover {
  text-decoration: underline;
}
.p-name:focus-visible,
.beta-link:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.state-line {
  margin: 10px 0 0;
}
.chip {
  --chip: var(--muted);
  padding: 2px 10px;
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
.tone-negative {
  --chip: var(--q-negative);
}
.access {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  padding: 14px;
  background: color-mix(in srgb, var(--q-positive) 8%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--q-positive) 35%, transparent);
  border-radius: 12px;
}
.access h2 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}
.access-note {
  margin: 0;
  font-size: 13px;
}
.beta-link {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 6px;
  padding: 8px 16px;
  color: var(--pwa-on-primary, #fff);
  font-weight: 700;
  text-decoration: none;
  background: var(--q-primary);
  border-radius: 999px;
}
.instructions h3 {
  margin: 6px 0 4px;
}
.p-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.confirm-card {
  width: min(460px, 100vw);
}
.confirm-card h2 {
  margin: 0 0 8px;
}
.form-error {
  color: var(--q-negative);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
</style>
