<template>
  <q-page class="workspace-page">
    <router-link to="/developer/feedback" class="back-link">
      <q-icon name="arrow_back" aria-hidden="true" />
      {{ ui('Tous les retours') }}
    </router-link>

    <div
      v-if="loading"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton height="110px" class="q-mb-md" />
      <q-skeleton height="160px" class="q-mb-md" />
      <q-skeleton height="200px" />
    </div>

    <EmptyState
      v-else-if="notFound"
      icon="search_off"
      :title="ui('Retour introuvable.')"
      :text="
        ui(
          'Ce retour n’existe pas, ne concerne pas l’une de vos applications ou les retours utilisateurs ne sont pas disponibles.'
        )
      "
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        :label="ui('Tous les retours')"
        to="/developer/feedback"
      />
    </EmptyState>

    <EmptyState
      v-else-if="error"
      tone="error"
      icon="cloud_off"
      :title="ui('Impossible de charger ce retour.')"
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

    <template v-else-if="detail">
      <header class="workspace-card detail-head">
        <AppIcon :src="detail.application?.icon_url" alt="" class="app-icon" />
        <div class="head-text">
          <span class="eyebrow">{{ detail.application?.name }}</span>
          <h1>{{ detail.title }}</h1>
          <div class="chips">
            <span
              class="fb-chip"
              :class="`tone-${feedbackStatusColor(detail.status)}`"
              >{{ feedbackStatusLabel(detail.status) }}</span
            >
            <span
              v-if="detail.priority"
              class="fb-chip"
              :class="`tone-${feedbackPriorityColor(detail.priority)}`"
              ><q-icon name="flag" aria-hidden="true" />
              {{ feedbackPriorityLabel(detail.priority) }}</span
            >
            <span v-if="detail.topic" class="fb-chip"
              ><q-icon name="sell" aria-hidden="true" />
              {{ feedbackTopicLabel(detail.topic) }}</span
            >
            <span v-if="detail.version" class="fb-chip">{{
              ui('Version {v}', { v: detail.version })
            }}</span>
          </div>
          <small class="muted"
            >{{ ui('Par {name}', { name: authorLabel(detail) }) }} ·
            {{ feedbackDate(detail.created_at, true) }}</small
          >
        </div>
      </header>

      <p class="privacy-note">
        <q-icon name="lock" aria-hidden="true" />
        <span>{{
          ui(
            'Ce retour est privé : il n’est jamais publié automatiquement. Le tri (priorité, thème, version, doublons) reste interne.'
          )
        }}</span>
      </p>

      <div class="detail-grid">
        <div class="main-col">
          <section class="workspace-card block">
            <h2>{{ ui('Message de l’utilisateur') }}</h2>
            <SuggestionDetail :suggestion="bodyView" />
          </section>

          <section class="workspace-card block reply-block">
            <h2 id="reply-label">{{
              ui('Réponse privée — visible uniquement par l’auteur')
            }}</h2>
            <p class="muted small">{{
              ui(
                'L’auteur est prévenu de votre réponse. Elle n’est jamais publiée. Laissez le champ vide pour retirer une réponse.'
              )
            }}</p>
            <q-input
              v-model="reply"
              outlined
              type="textarea"
              autogrow
              :maxlength="REPLY_MAX"
              counter
              aria-labelledby="reply-label"
              :label="ui('Votre réponse')"
            />
            <div class="actions">
              <q-btn
                unelevated
                no-caps
                color="primary"
                icon="send"
                class="save-reply"
                :label="ui('Enregistrer la réponse')"
                :loading="savingReply"
                :disable="!replyChanged"
                @click="saveReply"
              />
            </div>
          </section>

          <section class="workspace-card block">
            <h2>{{ ui('Historique') }}</h2>
            <p v-if="!detail.history?.length" class="muted small">{{
              ui('Aucune modification pour le moment.')
            }}</p>
            <ol v-else class="timeline">
              <li
                v-for="event in detail.history"
                :key="event.id"
                class="timeline-item"
              >
                <strong class="history-text">{{ historyText(event) }}</strong>
                <small class="muted">
                  {{ historyActor(event) }}
                  <template v-if="historyNote(event)"
                    >· {{ historyNote(event) }}</template
                  >
                  · {{ feedbackDate(event.created_at, true) }}
                </small>
              </li>
            </ol>
          </section>
        </div>

        <aside class="side-col">
          <section class="workspace-card block">
            <h2>{{ ui('Tri') }}</h2>
            <q-form class="triage-form" @submit.prevent="saveTriage">
              <q-select
                v-model="form.status"
                :options="statusOptions()"
                emit-value
                map-options
                outlined
                dense
                :label="ui('Statut')"
              />
              <q-select
                v-model="form.priority"
                :options="priorityOptions({ none: false })"
                emit-value
                map-options
                outlined
                dense
                clearable
                :label="ui('Priorité')"
              />
              <q-select
                v-model="form.topic"
                :options="topicOptions({ none: false })"
                emit-value
                map-options
                outlined
                dense
                clearable
                :label="ui('Thème')"
              />
              <q-input
                v-model="form.version"
                outlined
                dense
                :maxlength="VERSION_MAX"
                :label="ui('Version concernée (facultatif)')"
                :hint="ui('Par exemple : 2.4.1')"
              />
              <q-btn
                type="submit"
                unelevated
                no-caps
                color="primary"
                class="save-triage"
                :label="ui('Enregistrer le tri')"
                :loading="savingTriage"
                :disable="!triageChanged"
              />
            </q-form>
          </section>

          <section class="workspace-card block duplicates">
            <h2>{{ ui('Doublons') }}</h2>
            <p v-if="dupError" class="form-error dup-error" role="alert">{{
              dupError
            }}</p>

            <div v-if="detail.duplicate_of" class="primary-link">
              <p class="small">{{ ui('Ce retour est un doublon de :') }}</p>
              <router-link
                :to="`/developer/feedback/${detail.duplicate_of.id}`"
                class="dup-title"
                >{{ detail.duplicate_of.title }}</router-link
              >
              <span class="fb-chip">{{
                feedbackStatusLabel(detail.duplicate_of.status)
              }}</span>
              <q-btn
                flat
                no-caps
                dense
                color="primary"
                icon="link_off"
                class="unlink"
                :label="ui('Ce n’est pas un doublon')"
                :loading="dupBusy === 'unlink'"
                @click="unlink"
              />
            </div>

            <template v-else-if="detail.duplicates?.length">
              <p class="small">{{ ui('Retours regroupés sous celui-ci :') }}</p>
              <ul class="plain-list">
                <li
                  v-for="dup in detail.duplicates"
                  :key="dup.id"
                  class="dup-row"
                >
                  <router-link
                    :to="`/developer/feedback/${dup.id}`"
                    class="dup-title"
                    >{{ dup.title }}</router-link
                  >
                  <small class="muted"
                    >{{ feedbackStatusLabel(dup.status) }} ·
                    {{ feedbackDate(dup.created_at) }}</small
                  >
                  <q-btn
                    flat
                    no-caps
                    dense
                    color="primary"
                    icon="link_off"
                    class="detach"
                    :label="ui('Détacher')"
                    :aria-label="
                      ui('Détacher « {title} »', { title: dup.title })
                    "
                    :loading="dupBusy === dup.id"
                    @click="detach(dup.id)"
                  />
                </li>
              </ul>
              <p class="muted small">{{
                ui(
                  'Planifié, En cours, Résolu et Refusé sont repris par ses doublons.'
                )
              }}</p>
            </template>
            <p v-else class="muted small">{{
              ui('Ce retour n’est lié à aucun autre.')
            }}</p>

            <h3>{{ ui('Suggestions similaires') }}</h3>
            <div
              v-if="similarLoading"
              role="status"
              aria-busy="true"
              :aria-label="ui('Chargement…')"
            >
              <q-skeleton height="48px" class="q-mb-xs" />
              <q-skeleton height="48px" />
            </div>
            <p v-else-if="similarError" class="muted small">{{
              ui('Les suggestions similaires n’ont pas pu être chargées.')
            }}</p>
            <p v-else-if="!similar.length" class="muted small">{{
              ui('Aucune suggestion similaire trouvée.')
            }}</p>
            <ul v-else class="plain-list">
              <li v-for="item in similar" :key="item.id" class="similar-row">
                <router-link
                  :to="`/developer/feedback/${item.id}`"
                  class="dup-title"
                  >{{ item.title }}</router-link
                >
                <small class="muted"
                  >{{ feedbackStatusLabel(item.status) }} ·
                  {{ similarityLabel(item.score) }}</small
                >
                <template v-if="item.duplicate_of_id">
                  <small class="group-of">
                    {{ ui('Fait partie du groupe de') }}
                    <router-link
                      :to="`/developer/feedback/${item.duplicate_of_id}`"
                      >#{{ item.duplicate_of_id }}</router-link
                    >
                  </small>
                  <q-btn
                    v-if="
                      detail.duplicate_of?.id !== item.duplicate_of_id &&
                      detail.id !== item.duplicate_of_id
                    "
                    flat
                    no-caps
                    dense
                    color="primary"
                    icon="content_copy"
                    class="mark-primary"
                    :label="
                      ui('Marquer comme doublon du n° {id}', {
                        id: item.duplicate_of_id
                      })
                    "
                    :loading="dupBusy === `mark-${item.duplicate_of_id}`"
                    @click="markDuplicate(item.duplicate_of_id)"
                  />
                </template>
                <q-btn
                  v-else-if="detail.duplicate_of?.id !== item.id"
                  flat
                  no-caps
                  dense
                  color="primary"
                  icon="content_copy"
                  class="mark-duplicate"
                  :label="ui('Marquer comme doublon de celle-ci')"
                  :aria-label="
                    ui('Marquer comme doublon de « {title} »', {
                      title: item.title
                    })
                  "
                  :loading="dupBusy === `mark-${item.id}`"
                  @click="markDuplicate(item.id)"
                />
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </template>
  </q-page>
</template>
<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import SuggestionDetail from '@/components/SuggestionDetail.vue'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { feedbackApi } from '@/services/feedback'
import {
  REPLY_MAX,
  VERSION_MAX,
  authorLabel,
  feedbackDate,
  feedbackPriorityColor,
  feedbackPriorityLabel,
  feedbackStatusColor,
  feedbackStatusLabel,
  feedbackTopicLabel,
  historyActor,
  historyNote,
  historyText,
  priorityOptions,
  similarityLabel,
  statusOptions,
  topicOptions,
  triageChanges
} from '@/utils/feedback'

const $q = useQuasar()
const route = useRoute()
const feedbackId = computed(() => route.params.id)

const detail = ref(null),
  loading = ref(true),
  notFound = ref(false),
  error = ref(''),
  reply = ref(''),
  savingTriage = ref(false),
  savingReply = ref(false),
  dupBusy = ref(null),
  dupError = ref(''),
  similar = ref([]),
  similarLoading = ref(false),
  similarError = ref(false)
const form = reactive({
  status: null,
  priority: null,
  topic: null,
  version: ''
})

// The body and attachments are rendered by SuggestionDetail (same sanitizer and private
// downloads as before); the reply has its own editor here.
const bodyView = computed(() => ({ ...detail.value, developer_reply: null }))
const triageChanged = computed(
  () => Object.keys(triageChanges(detail.value, form)).length > 0
)
const replyChanged = computed(
  () => reply.value.trim() !== (detail.value?.developer_reply || '').trim()
)

function fill(data) {
  form.status = data?.status || null
  form.priority = data?.priority || null
  form.topic = data?.topic || null
  form.version = data?.version || ''
  reply.value = data?.developer_reply || ''
}

// Each load gets a number: only the latest may fill the page, so a late answer for
// feedback 7 never lands on feedback 8 (and a reply never goes to the wrong author).
let requestSeq = 0
async function load() {
  const seq = ++requestSeq
  loading.value = true
  notFound.value = false
  error.value = ''
  dupError.value = ''
  detail.value = null
  similar.value = []
  // Nothing from the previous feedback keeps spinning.
  savingTriage.value = false
  savingReply.value = false
  dupBusy.value = null
  similarLoading.value = false
  similarError.value = false
  try {
    const data = (await feedbackApi.show(feedbackId.value)).data.data
    if (seq !== requestSeq) return
    detail.value = data
    fill(data)
    void loadSimilar(seq)
  } catch (e) {
    if (seq !== requestSeq) return
    if (e.response?.status === 404) notFound.value = true
    else error.value = apiMessage(e)
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

async function loadSimilar(seq = requestSeq) {
  const id = detail.value?.id
  if (!id) return
  similarLoading.value = true
  similarError.value = false
  try {
    const { data } = await feedbackApi.similar(id)
    if (seq !== requestSeq) return
    similar.value = Array.isArray(data?.data) ? data.data : []
  } catch {
    if (seq !== requestSeq) return
    similar.value = []
    similarError.value = true
  } finally {
    if (seq === requestSeq) similarLoading.value = false
  }
}

/**
 * Shows a fresh detail (a PATCH answer) without losing what the developer is typing: triage
 * fields edited but not saved keep their value, and so does an unsent reply draft. `saved`
 * lists what this request just saved, which follows the server.
 */
function applyDetail(data, { saved = [], replySaved = false } = {}) {
  const dirty = Object.keys(triageChanges(detail.value, form)).filter(
    field => !saved.includes(field)
  )
  const edited = { ...form }
  const draft = replyChanged.value && !replySaved ? reply.value : null
  detail.value = data
  fill(data)
  for (const field of dirty) form[field] = edited[field]
  if (draft !== null) reply.value = draft
}

// A feedback that disappeared (deleted, or its app is no longer the developer's) shows the
// "not found" state, never the server's raw message.
function gone() {
  detail.value = null
  similar.value = []
  notFound.value = true
}

// PATCH answers the full detail; it only fills the page if it is still the same feedback.
async function patch(payload, options) {
  const id = detail.value?.id
  const seq = requestSeq
  const { data } = await feedbackApi.update(id, payload)
  if (seq !== requestSeq || detail.value?.id !== id) return false
  applyDetail(data.data, options)
  return true
}
const current = seq => seq === requestSeq

async function saveTriage() {
  const changes = triageChanges(detail.value, form)
  if (!Object.keys(changes).length || savingTriage.value) return
  const seq = requestSeq
  savingTriage.value = true
  try {
    if (!(await patch(changes, { saved: Object.keys(changes) }))) return
    $q.notify({ type: 'positive', message: ui('Tri enregistré.') })
  } catch (e) {
    if (!current(seq)) return
    if (e.response?.status === 404) gone()
    else $q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    if (current(seq)) savingTriage.value = false
  }
}

async function saveReply() {
  if (savingReply.value) return
  const seq = requestSeq
  savingReply.value = true
  const text = reply.value.trim()
  try {
    if (!(await patch({ reply: text }, { replySaved: true }))) return
    $q.notify({
      type: 'positive',
      message: text
        ? ui('Réponse enregistrée. L’auteur est prévenu.')
        : ui('Réponse retirée.')
    })
  } catch (e) {
    if (!current(seq)) return
    if (e.response?.status === 404) gone()
    else $q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    if (current(seq)) savingReply.value = false
  }
}

// Duplicate rules (same app, no chain, not itself) come back as 422 on duplicate_of_id:
// the message is shown in the duplicates section. Linked to a planned, in-progress,
// resolved or declined feedback, this one takes its status: the PATCH answer shows it.
async function changeDuplicate(busy, payload, done) {
  if (dupBusy.value) return
  const seq = requestSeq
  dupBusy.value = busy
  dupError.value = ''
  try {
    if (!(await patch(payload))) return
    $q.notify({ type: 'positive', message: done })
    void loadSimilar(seq)
  } catch (e) {
    if (!current(seq)) return
    if (e.response?.status === 404) gone()
    else dupError.value = apiMessage(e)
  } finally {
    if (current(seq)) dupBusy.value = null
  }
}
const markDuplicate = targetId =>
  changeDuplicate(
    `mark-${targetId}`,
    { duplicate_of_id: targetId },
    ui('Retour marqué comme doublon.')
  )
const unlink = () =>
  changeDuplicate(
    'unlink',
    { duplicate_of_id: null },
    ui('Ce retour n’est plus marqué comme doublon.')
  )

function dropDuplicate(childId) {
  const duplicates = (detail.value?.duplicates || []).filter(
    dup => dup.id !== childId
  )
  detail.value = {
    ...detail.value,
    duplicates,
    duplicates_count: duplicates.length
  }
}

// Detaching a grouped duplicate updates that other feedback; this one only loses it from
// its list (no extra request, nothing typed here is lost).
async function detach(childId) {
  if (dupBusy.value) return
  const seq = requestSeq
  dupBusy.value = childId
  dupError.value = ''
  try {
    await feedbackApi.update(childId, { duplicate_of_id: null })
    if (!current(seq)) return
    dropDuplicate(childId)
    $q.notify({ type: 'positive', message: ui('Doublon détaché.') })
    void loadSimilar(seq)
  } catch (e) {
    if (!current(seq)) return
    if (e.response?.status === 404) {
      dropDuplicate(childId)
      dupError.value = ui('Ce doublon n’est plus disponible.')
    } else dupError.value = apiMessage(e)
  } finally {
    if (current(seq)) dupBusy.value = null
  }
}

watch(feedbackId, load, { immediate: true })
defineExpose({
  detail,
  form,
  reply,
  similar,
  loading,
  savingReply,
  dupError,
  saveTriage,
  saveReply,
  markDuplicate,
  unlink,
  detach
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
.dup-title:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.detail-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
  border: 1px solid var(--outline);
}
.app-icon {
  flex: none;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  object-fit: cover;
}
.head-text {
  display: grid;
  gap: 6px;
  min-width: 0;
}
.head-text h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 750;
  line-height: 1.25;
  overflow-wrap: anywhere;
}
.eyebrow {
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.privacy-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 14px;
  padding: 10px 12px;
  font-size: 14px;
  background: var(--primary-soft, var(--surface-low));
  border-radius: 12px;
}
.privacy-note .q-icon {
  flex: none;
  margin-top: 2px;
  color: var(--pwa-link);
}
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 340px);
  gap: 14px;
  align-items: start;
}
.main-col,
.side-col {
  display: grid;
  gap: 14px;
  min-width: 0;
}
.block {
  display: grid;
  gap: 10px;
  border: 1px solid var(--outline);
}
.block h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 750;
}
.block h3 {
  margin: 8px 0 0;
  font-size: 15px;
  font-weight: 700;
}
.reply-block {
  border-color: var(--pwa-primary);
}
.actions {
  display: flex;
  justify-content: flex-end;
}
.triage-form {
  display: grid;
  gap: 12px;
}
.small {
  margin: 0;
  font-size: 13px;
}
.muted {
  color: var(--muted);
}
.form-error {
  margin: 0;
  color: var(--q-negative);
}
.plain-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.primary-link,
.dup-row,
.similar-row {
  display: grid;
  justify-items: start;
  gap: 4px;
}
.dup-title {
  color: var(--text);
  font-weight: 650;
  overflow-wrap: anywhere;
}
.timeline {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0 0 0 18px;
  border-left: 2px solid var(--outline);
  list-style: none;
}
.timeline-item {
  display: grid;
  gap: 2px;
  position: relative;
}
.timeline-item::before {
  content: '';
  position: absolute;
  top: 6px;
  left: -24px;
  width: 10px;
  height: 10px;
  background: var(--pwa-primary);
  border-radius: 50%;
}
.history-text {
  font-weight: 650;
}
.fb-chip {
  --chip: var(--muted);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  color: var(--text);
  font-size: 12px;
  font-weight: 650;
  background: color-mix(in srgb, var(--chip) 14%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--chip) 35%, transparent);
  border-radius: 999px;
}
.tone-primary {
  --chip: var(--q-primary);
}
.tone-positive,
.tone-teal-7 {
  --chip: var(--q-positive);
}
.tone-orange-8 {
  --chip: var(--q-warning);
}
.tone-negative {
  --chip: var(--q-negative);
}
@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
