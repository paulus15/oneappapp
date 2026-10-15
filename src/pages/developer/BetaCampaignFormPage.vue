<template>
  <q-page class="workspace-page beta-form-page">
    <router-link :to="backTo" class="back-link">
      <q-icon name="arrow_back" aria-hidden="true" />
      {{ editing ? ui('Retour à la campagne') : ui('Toutes les campagnes') }}
    </router-link>
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Tests bêta') }}</span
      ><h1>{{
        editing ? ui('Modifier la campagne') : ui('Nouvelle campagne de test')
      }}</h1></header
    >

    <div
      v-if="loading"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton height="260px" class="q-mb-md" />
      <q-skeleton height="200px" />
    </div>
    <EmptyState
      v-else-if="notFound"
      icon="search_off"
      :title="ui('Campagne introuvable.')"
      :text="
        ui(
          'Cette campagne n’existe pas ou ne concerne pas l’une de vos applications.'
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
      v-else-if="loadError"
      tone="error"
      icon="cloud_off"
      :title="ui('Impossible de charger cette campagne.')"
      :text="loadError"
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
    <EmptyState
      v-else-if="detail?.status === 'closed'"
      icon="lock"
      :title="ui('Cette campagne est clôturée.')"
      :text="ui('Une campagne clôturée ne peut plus être modifiée.')"
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        :to="backTo"
        :label="ui('Retour à la campagne')"
      />
    </EmptyState>

    <EmptyState
      v-else-if="detail?.status === 'pending'"
      icon="hourglass_top"
      :title="ui('Cette campagne est en cours de validation.')"
      :text="
        ui(
          'Elle ne peut pas être modifiée pendant la validation. Retirez-la de la validation pour la modifier : elle redeviendra un brouillon.'
        )
      "
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="undo"
        class="withdraw-review"
        :label="ui('Retirer de la validation')"
        :loading="withdrawing"
        @click="withdrawReview"
      />
      <q-btn flat no-caps :to="backTo" :label="ui('Retour à la campagne')" />
    </EmptyState>

    <form v-else class="campaign-form" novalidate @submit.prevent="save">
      <q-banner
        v-if="reapproval"
        class="workspace-alert reapproval-warning"
        role="status"
      >
        <template #avatar><q-icon name="warning" color="warning" /></template>
        {{
          ui(
            'Cette campagne est approuvée. Modifier le nom, la description, les objectifs, les conditions, les pays, les questions, l’adresse de la version bêta ou les instructions la renvoie en validation : elle sera masquée du catalogue et l’accès des testeurs acceptés est suspendu jusqu’à la nouvelle validation. Les dates, le nombre de places et l’acceptation automatique se modifient librement.'
          )
        }}
      </q-banner>

      <section class="workspace-card form-section">
        <h2>{{ ui('Présentation publique') }}</h2>
        <div class="workspace-form">
          <q-select
            v-model="form.application_id"
            :options="appOptions"
            emit-value
            map-options
            outlined
            :disable="editing"
            :label="ui('Application testée')"
            :error="shown('application_id')"
            :error-message="problems.application_id"
          />
          <q-input
            v-model="form.name"
            outlined
            :label="ui('Nom de la campagne')"
            :maxlength="BETA_LIMITS.name"
            counter
            :error="shown('name')"
            :error-message="problems.name"
          />
          <q-input
            v-model="form.description"
            outlined
            type="textarea"
            autogrow
            :label="ui('Description')"
            :hint="ui('Texte simple, visible par tous.')"
            :maxlength="BETA_LIMITS.description"
            counter
            :error="shown('description')"
            :error-message="problems.description"
          />
          <q-input
            v-model="form.objectives"
            outlined
            type="textarea"
            autogrow
            :label="ui('Objectifs du test')"
            :maxlength="BETA_LIMITS.objectives"
            counter
            :error="shown('objectives')"
            :error-message="problems.objectives"
          />
          <q-input
            v-model="form.eligibility"
            outlined
            type="textarea"
            autogrow
            :label="ui('Conditions de participation (facultatif)')"
            :hint="
              ui(
                'Par exemple : téléphone Android récent, utilisateur de l’application.'
              )
            "
            :maxlength="BETA_LIMITS.eligibility"
            counter
            :error="shown('eligibility')"
            :error-message="problems.eligibility"
          />
          <CountrySelect
            v-model="form.countries"
            multiple
            value-field="code"
            label="Pays ciblés (aucun = tous les pays)"
          />
          <div class="row-fields">
            <q-input
              v-model="form.starts_at"
              outlined
              type="date"
              stack-label
              :label="ui('Début')"
              :error="shown('starts_at')"
              :error-message="problems.starts_at"
            />
            <q-input
              v-model="form.ends_at"
              outlined
              type="date"
              stack-label
              :label="ui('Fin')"
              :hint="ui('{n} jours au maximum.', { n: BETA_LIMITS.maxDays })"
              :error="shown('ends_at')"
              :error-message="problems.ends_at"
            />
            <q-input
              v-model.number="form.max_participants"
              outlined
              type="number"
              :min="BETA_LIMITS.minParticipants"
              :max="BETA_LIMITS.maxParticipants"
              :label="ui('Nombre de places')"
              :error="shown('max_participants')"
              :error-message="problems.max_participants"
            />
          </div>
        </div>
      </section>

      <section class="workspace-card form-section">
        <h2>{{ ui('Questions aux candidats') }}</h2>
        <BetaQuestionBuilder
          :questions="form.questions"
          :problems="showErrors ? problems : {}"
        />
      </section>

      <section class="workspace-card form-section">
        <h2>
          <q-icon name="lock" aria-hidden="true" />
          {{ ui('Accès privé des testeurs') }}
        </h2>
        <p class="text-muted">{{
          ui(
            'Visible uniquement par les testeurs acceptés, jamais sur la page publique.'
          )
        }}</p>
        <div class="workspace-form">
          <q-input
            v-model="form.beta_url"
            outlined
            type="url"
            inputmode="url"
            :label="ui('Adresse de la version bêta')"
            placeholder="https://beta.exemple.com"
            :error="
              shown('beta_url') || (!!form.beta_url && !!problems.beta_url)
            "
            :error-message="problems.beta_url"
          />
          <div>
            <p class="editor-label">{{ ui('Instructions (facultatif)') }}</p>
            <q-editor
              v-model="form.instructions"
              min-height="8rem"
              :toolbar="toolbar"
              :placeholder="
                ui('Comment se connecter, quoi tester en priorité…')
              "
              :aria-label="ui('Instructions (facultatif)')"
            />
            <p v-if="shown('instructions')" class="field-error" role="alert">{{
              problems.instructions
            }}</p>
          </div>
          <q-toggle
            v-model="form.auto_accept"
            :label="
              ui(
                'Accepter automatiquement les candidats tant qu’il reste des places'
              )
            "
          />
        </div>
      </section>

      <q-banner
        v-if="saveError"
        class="workspace-alert save-error"
        role="alert"
        >{{ saveError }}</q-banner
      >
      <p v-if="showErrors && problemCount" class="field-error" role="alert">{{
        ui('Corrigez les champs signalés avant d’enregistrer.')
      }}</p>
      <div class="form-actions">
        <q-btn flat no-caps :to="backTo" :label="ui('Annuler')" />
        <q-btn
          type="submit"
          unelevated
          no-caps
          color="primary"
          class="save-campaign"
          :label="editing ? ui('Enregistrer') : ui('Créer le brouillon')"
          :loading="saving"
        />
      </div>
    </form>

    <q-dialog v-model="confirmOpen">
      <q-card class="confirm-card">
        <q-card-section>
          <h2>{{ ui('Renvoyer la campagne en validation ?') }}</h2>
          <p>{{
            ui(
              'Vous modifiez des informations vérifiées d’une campagne approuvée. Elle sera masquée du catalogue jusqu’à la nouvelle validation. L’accès des testeurs acceptés est suspendu jusqu’à la nouvelle validation.'
            )
          }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps :label="ui('Annuler')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="confirm-save"
            :label="ui('Enregistrer quand même')"
            :loading="saving"
            @click="persist"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import CountrySelect from '@/components/CountrySelect.vue'
import EmptyState from '@/components/EmptyState.vue'
import BetaQuestionBuilder from '@/components/beta/BetaQuestionBuilder.vue'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { betaDevApi } from '@/services/beta'
import {
  BETA_LIMITS,
  campaignChanges,
  campaignForm,
  campaignPayload,
  campaignProblems,
  needsReapproval
} from '@/utils/beta'

const $q = useQuasar(),
  route = useRoute(),
  router = useRouter()
const campaignId = computed(() => route.params.id || null)
const editing = computed(() => !!campaignId.value)
const backTo = computed(() =>
  editing.value ? `/developer/beta/${campaignId.value}` : '/developer/beta'
)

const toolbar = [
  ['bold', 'italic', 'underline', 'strike'],
  ['unordered', 'ordered', 'quote'],
  ['link', 'removeFormat'],
  ['undo', 'redo']
]
const form = reactive(campaignForm())
const detail = ref(null),
  apps = ref([]),
  loading = ref(false),
  notFound = ref(false),
  loadError = ref(''),
  saving = ref(false),
  saveError = ref(''),
  showErrors = ref(false),
  confirmOpen = ref(false),
  withdrawing = ref(false)

// A draft may stay incomplete; a campaign already submitted or reviewed may not.
const complete = computed(
  () => !!detail.value && !['draft'].includes(detail.value.status)
)
const problems = computed(() =>
  campaignProblems(form, { complete: complete.value })
)
const problemCount = computed(() => Object.keys(problems.value).length)
const shown = field => showErrors.value && !!problems.value[field]
// Shown before saving: public edits send an approved campaign back to review.
const reapproval = computed(() => needsReapproval(detail.value, form))

// Unsaved changes: compared with what was loaded (or the empty form).
const snapshot = ref(JSON.stringify(campaignPayload(form)))
const dirty = computed(
  () => JSON.stringify(campaignPayload(form)) !== snapshot.value
)
let leaving = false
const LEAVE_TEXT = () =>
  ui('Vous avez des modifications non enregistrées. Quitter quand même ?')
onBeforeRouteLeave?.(() => {
  if (leaving || !dirty.value) return true
  return window.confirm(LEAVE_TEXT())
})
function beforeUnload(event) {
  if (!dirty.value || leaving) return
  event.preventDefault()
  event.returnValue = ''
}
window.addEventListener('beforeunload', beforeUnload)
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
function leaveTo(path) {
  leaving = true
  router.push(path)
}

let seq = 0
async function load() {
  if (!editing.value) return
  const current = ++seq
  loading.value = true
  notFound.value = false
  loadError.value = ''
  try {
    const { data } = await betaDevApi.show(campaignId.value)
    if (current !== seq) return
    detail.value = data?.data || null
    Object.assign(form, campaignForm(detail.value))
    snapshot.value = JSON.stringify(campaignPayload(form))
  } catch (e) {
    if (current !== seq) return
    if (e.response?.status === 404) notFound.value = true
    else loadError.value = apiMessage(e)
  } finally {
    if (current === seq) loading.value = false
  }
}

function save() {
  if (saving.value) return
  showErrors.value = true
  saveError.value = ''
  if (problemCount.value) return
  if (reapproval.value) {
    confirmOpen.value = true
    return
  }
  void persist()
}

async function persist() {
  if (saving.value) return
  saving.value = true
  saveError.value = ''
  try {
    if (editing.value) {
      const changes = campaignChanges(detail.value, form)
      if (!Object.keys(changes).length) {
        confirmOpen.value = false
        $q.notify({
          type: 'info',
          message: ui('Aucune modification à enregistrer.')
        })
        leaveTo(`/developer/beta/${campaignId.value}`)
        return
      }
      const { data } = await betaDevApi.update(campaignId.value, changes)
      confirmOpen.value = false
      detail.value = data?.data || detail.value
      $q.notify(
        data?.meta?.requires_review
          ? {
              type: 'warning',
              message: ui(
                'Modifications enregistrées. La campagne repasse en validation avant d’être de nouveau visible.'
              )
            }
          : { type: 'positive', message: ui('Modifications enregistrées.') }
      )
      leaveTo(`/developer/beta/${campaignId.value}`)
    } else {
      const { data } = await betaDevApi.create(campaignPayload(form))
      $q.notify({
        type: 'positive',
        message: ui(
          'Brouillon créé. Envoyez-le en validation quand il est prêt.'
        )
      })
      const id = data?.data?.id
      leaveTo(id ? `/developer/beta/${id}` : '/developer/beta')
    }
  } catch (e) {
    confirmOpen.value = false
    if (e.response?.status === 404 && editing.value) notFound.value = true
    else saveError.value = apiMessage(e)
  } finally {
    saving.value = false
  }
}

async function withdrawReview() {
  if (withdrawing.value) return
  withdrawing.value = true
  try {
    const { data } = await betaDevApi.withdraw(campaignId.value)
    detail.value = data?.data || { ...detail.value, status: 'draft' }
    Object.assign(form, campaignForm(detail.value))
    snapshot.value = JSON.stringify(campaignPayload(form))
    $q.notify({
      type: 'positive',
      message: ui('La campagne est de nouveau un brouillon modifiable.')
    })
  } catch (e) {
    $q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    withdrawing.value = false
  }
}

// Archived, suspended or rejected applications cannot get a new campaign.
const UNAVAILABLE = ['archived', 'suspended', 'rejected']
const selectable = app =>
  !UNAVAILABLE.includes(app?.status) && !app?.archived_at && !app?.suspended_at

// The campaign's own application stays listed when editing.
const appOptions = computed(() =>
  apps.value
    .filter(app => selectable(app) || app.id === form.application_id)
    .map(app => ({ value: app.id, label: app.name }))
)

watch(campaignId, () => void load())
onMounted(async () => {
  void load()
  try {
    const { data } = await betaDevApi.apps()
    apps.value = Array.isArray(data) ? data : data?.data || []
    if (!editing.value && !form.application_id) {
      const wanted = Number(route.query?.app)
      if (apps.value.some(app => app.id === wanted && selectable(app))) {
        form.application_id = wanted
        snapshot.value = JSON.stringify(campaignPayload(form))
      }
    }
  } catch {
    // Without the list, the developer can still edit an existing campaign.
  }
})

defineExpose({
  form,
  detail,
  save,
  persist,
  confirmOpen,
  reapproval,
  problems,
  dirty,
  appOptions,
  withdrawReview
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
.back-link:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.campaign-form {
  display: grid;
  gap: 16px;
}
.form-section {
  border: 1px solid var(--outline);
}
.form-section h2 {
  display: flex;
  align-items: center;
  gap: 6px;
}
.row-fields {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 12px;
}
.editor-label {
  margin: 0 0 6px;
  font-weight: 600;
}
.field-error {
  margin: 6px 0 0;
  color: var(--q-negative);
  font-size: 13px;
}
.form-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.confirm-card {
  width: min(480px, 100vw);
}
.confirm-card h2 {
  margin: 0 0 8px;
}
</style>
