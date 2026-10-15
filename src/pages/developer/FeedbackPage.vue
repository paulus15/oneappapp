<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Portail développeur') }}</span
      ><h1>{{ ui('Retours utilisateurs') }}</h1
      ><p>{{
        ui(
          'Les suggestions et signalements envoyés par les utilisateurs de vos applications : triez-les, suivez leur traitement et répondez à leur auteur.'
        )
      }}</p></header
    >
    <DeveloperToolsNav />

    <p class="privacy-note">
      <q-icon name="lock" aria-hidden="true" />
      <span>{{
        ui(
          'Ces retours sont privés : ils ne sont jamais publiés automatiquement. Votre réponse n’est visible que par leur auteur.'
        )
      }}</span>
    </p>

    <div class="scope">
      <q-select
        v-model="applicationId"
        :options="appOptions"
        emit-value
        map-options
        outlined
        dense
        clearable
        class="app-select"
        :label="ui('Toutes mes applications')"
      />
      <div class="periods" role="group" :aria-label="ui('Période')">
        <button
          v-for="days in FEEDBACK_PERIODS"
          :key="days"
          type="button"
          class="pill period"
          :aria-pressed="period === days"
          @click="period = days"
          >{{ ui('{n} j', { n: days }) }}</button
        >
      </div>
    </div>

    <div
      v-if="summaryLoading"
      class="kpis"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton v-for="n in 5" :key="n" height="96px" class="kpi-skeleton" />
    </div>
    <EmptyState
      v-else-if="summaryError"
      compact
      tone="error"
      icon="cloud_off"
      class="q-mb-md"
      :title="ui('Les indicateurs n’ont pas pu être chargés.')"
      :text="summaryError"
    >
      <q-btn
        flat
        no-caps
        color="primary"
        icon="refresh"
        :label="ui('Réessayer')"
        @click="loadSummary()"
      />
    </EmptyState>
    <section
      v-else-if="summary"
      class="kpis"
      :aria-label="ui('Indicateurs sur {n} jours', { n: period })"
    >
      <div v-for="card in kpis" :key="card.key" class="workspace-card kpi">
        <span class="kpi-label">{{ card.label }}</span>
        <strong :class="`kpi-${card.key}`">{{ card.value }}</strong>
        <small v-if="card.hint" class="kpi-hint">{{ card.hint }}</small>
      </div>
      <p class="kpi-help muted">{{
        ui(
          'Les nombres portent sur les retours reçus pendant les {n} derniers jours, doublons compris, selon leur statut actuel. Le temps moyen porte sur les retours résolus pendant cette période.',
          { n: summary.period_days || period }
        )
      }}</p>
    </section>

    <section class="workspace-section filters" :aria-label="ui('Filtres')">
      <div class="status-chips" role="group" :aria-label="ui('Statut')">
        <button
          type="button"
          class="pill status-chip"
          :aria-pressed="!filters.status"
          @click="filters.status = null"
          >{{ ui('Tous') }}</button
        >
        <button
          v-for="option in statusChips"
          :key="option.value"
          type="button"
          class="pill status-chip"
          :data-status="option.value"
          :aria-pressed="filters.status === option.value"
          @click="filters.status = option.value"
        >
          {{ option.label }}
          <span v-if="option.count !== null" class="count">{{
            option.count
          }}</span>
        </button>
      </div>
      <div class="filter-row">
        <q-input
          v-model="searchInput"
          outlined
          dense
          clearable
          type="search"
          maxlength="100"
          class="search"
          :label="ui('Rechercher dans les retours')"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <q-select
          v-model="filters.priority"
          :options="priorityOptions()"
          emit-value
          map-options
          outlined
          dense
          clearable
          :label="ui('Priorité')"
        />
        <q-select
          v-model="filters.topic"
          :options="topicOptions()"
          emit-value
          map-options
          outlined
          dense
          clearable
          :label="ui('Thème')"
        />
        <q-select
          v-model="filters.duplicates"
          :options="duplicateOptions()"
          emit-value
          map-options
          outlined
          dense
          :label="ui('Doublons')"
        />
        <q-select
          v-model="filters.sort"
          :options="sortOptions()"
          emit-value
          map-options
          outlined
          dense
          :label="ui('Trier par')"
        />
      </div>
      <small class="muted">{{
        ui(
          'Nombres sur les statuts : retours reçus sur la période, doublons compris. La liste n’est pas limitée à la période.'
        )
      }}</small>
    </section>

    <div
      v-if="selection.length"
      class="bulk-bar workspace-card"
      role="region"
      :aria-label="ui('Action groupée')"
    >
      <strong class="bulk-count">{{
        pluralText('selected', selection.length)
      }}</strong>
      <q-select
        v-model="bulkField"
        :options="bulkFieldOptions()"
        emit-value
        map-options
        outlined
        dense
        :label="ui('Modifier')"
        class="bulk-select"
      />
      <q-select
        v-model="bulkValue"
        :options="bulkValueOptions(bulkField)"
        emit-value
        map-options
        outlined
        dense
        :label="ui('Nouvelle valeur')"
        class="bulk-select"
      />
      <q-btn
        unelevated
        no-caps
        color="primary"
        class="bulk-apply"
        :label="ui('Appliquer')"
        :disable="!canApply"
        @click="openConfirm"
      />
      <q-btn
        flat
        no-caps
        class="bulk-clear"
        :label="ui('Désélectionner')"
        @click="clearSelection"
      />
      <small class="muted">{{
        ui('{n} retours au maximum par action groupée.', { n: BULK_MAX })
      }}</small>
    </div>

    <div
      v-if="list.loading.value"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton v-for="n in 3" :key="n" height="110px" class="q-mb-sm" />
    </div>
    <EmptyState
      v-else-if="list.error.value"
      tone="error"
      icon="cloud_off"
      :title="ui('Les retours n’ont pas pu être chargés.')"
      :text="listErrorText"
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        :label="ui('Réessayer')"
        class="retry-list"
        @click="list.reload()"
      />
    </EmptyState>
    <EmptyState
      v-else-if="!items.length && filtered"
      icon="filter_alt_off"
      :title="ui('Aucun retour ne correspond à ces filtres.')"
      :text="ui('Modifiez la recherche ou les filtres pour élargir la liste.')"
    >
      <q-btn
        flat
        no-caps
        color="primary"
        class="reset-filters"
        :label="ui('Effacer les filtres')"
        @click="resetFilters"
      />
    </EmptyState>
    <EmptyState
      v-else-if="!items.length"
      icon="forum"
      :title="ui('Aucun retour pour le moment.')"
      :text="
        ui(
          'Les suggestions privées envoyées depuis la fiche de vos applications apparaîtront ici.'
        )
      "
    />
    <template v-else>
      <div class="list-head">
        <label class="select-all">
          <input
            type="checkbox"
            :checked="allVisibleSelected"
            :indeterminate.prop="someVisibleSelected"
            @change="toggleAllVisible"
          />
          <span>{{ ui('Tout sélectionner') }}</span>
        </label>
      </div>
      <ul class="feedback-list" role="list">
        <li
          v-for="item in items"
          :key="item.id"
          class="workspace-card feedback-row"
          :class="{ selected: selection.includes(item.id) }"
        >
          <input
            type="checkbox"
            class="row-check"
            :checked="selection.includes(item.id)"
            :aria-label="ui('Sélectionner « {title} »', { title: item.title })"
            @change="toggle(item.id)"
          />
          <div class="row-body">
            <div class="row-head">
              <router-link
                :to="`/developer/feedback/${item.id}`"
                class="row-title"
                >{{ item.title }}</router-link
              >
              <span
                class="fb-chip"
                :class="`tone-${feedbackStatusColor(item.status)}`"
                >{{ feedbackStatusLabel(item.status) }}</span
              >
              <span
                v-if="item.priority"
                class="fb-chip"
                :class="`tone-${feedbackPriorityColor(item.priority)}`"
                ><q-icon name="flag" aria-hidden="true" />
                {{ feedbackPriorityLabel(item.priority) }}</span
              >
              <span v-if="item.topic" class="fb-chip"
                ><q-icon name="sell" aria-hidden="true" />
                {{ feedbackTopicLabel(item.topic) }}</span
              >
              <span v-if="item.duplicates_count" class="fb-chip dup-badge"
                ><q-icon name="content_copy" aria-hidden="true" />
                {{ pluralText('duplicates', item.duplicates_count) }}</span
              >
              <span v-if="item.duplicate_of_id" class="fb-chip"
                ><q-icon name="link" aria-hidden="true" />
                {{ ui('Doublon') }}</span
              >
            </div>
            <p v-if="item.excerpt" class="excerpt">{{ item.excerpt }}</p>
            <small class="muted meta">
              <span>{{ item.application?.name }}</span>
              <span>{{ authorLabel(item) }}</span>
              <span>{{ feedbackDate(item.created_at) }}</span>
              <span v-if="item.version">{{
                ui('Version {v}', { v: item.version })
              }}</span>
              <span v-if="item.attachments_count"
                ><q-icon name="attach_file" aria-hidden="true" />
                {{ pluralText('attachments', item.attachments_count) }}</span
              >
            </small>
          </div>
        </li>
      </ul>
      <LoadMore
        :has-more="list.hasMore.value"
        :loading="list.loadingMore.value"
        :error="list.moreError.value"
        :shown="items.length"
        :total="list.total.value"
        :page-size="FEEDBACK_PAGE_SIZE"
        @load="list.loadMore()"
      />
    </template>

    <q-dialog v-model="confirmOpen">
      <q-card class="confirm-card">
        <q-card-section>
          <h2>{{ ui('Confirmer l’action groupée') }}</h2>
          <p class="confirm-text">{{ confirmText }}</p>
          <p v-if="bulkError" class="form-error" role="alert">{{
            bulkError
          }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps :label="ui('Annuler')" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="confirm-bulk"
            :label="ui('Appliquer')"
            :loading="bulkRunning"
            @click="runBulk"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import DeveloperToolsNav from '@/components/DeveloperToolsNav.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { currentLocale, i18n } from '@/i18n'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { feedbackApi } from '@/services/feedback'
import {
  BULK_MAX,
  DEFAULT_FILTERS,
  DEFAULT_PERIOD,
  FEEDBACK_PAGE_SIZE,
  FEEDBACK_PERIODS,
  SEARCH_DEBOUNCE_MS,
  authorLabel,
  bulkChangeLabel,
  bulkFieldOptions,
  bulkPayload,
  bulkResultMessage,
  bulkValueOptions,
  duplicateOptions,
  feedbackDate,
  feedbackListParams,
  feedbackPriorityColor,
  feedbackPriorityLabel,
  feedbackStatusColor,
  feedbackStatusLabel,
  feedbackTopicLabel,
  formatResolution,
  hasActiveFilters,
  pluralText,
  priorityOptions,
  resolutionHint,
  sortOptions,
  statusOptions,
  topicOptions
} from '@/utils/feedback'

const $q = useQuasar()

const appOptions = ref([]),
  applicationId = ref(null),
  period = ref(DEFAULT_PERIOD),
  summary = ref(null),
  summaryLoading = ref(true),
  summaryError = ref(''),
  searchInput = ref(''),
  selection = ref([]),
  bulkField = ref('status'),
  bulkValue = ref(null),
  confirmOpen = ref(false),
  bulkRunning = ref(false),
  bulkError = ref('')
const filters = reactive({ ...DEFAULT_FILTERS })

const list = useLoadMore(
  async page =>
    (
      await feedbackApi.list(
        feedbackListParams(filters, {
          applicationId: applicationId.value,
          page
        })
      )
    ).data
)
const items = list.items
const listErrorText = computed(() =>
  list.last.value instanceof Error ? apiMessage(list.last.value) : ''
)
const filtered = computed(() => hasActiveFilters(filters))

const kpis = computed(() => {
  const data = summary.value || {}
  const count = value => (Number(value) || 0).toLocaleString(currentLocale())
  return [
    {
      key: 'received',
      label: ui('Retours reçus'),
      value: count(data.received)
    },
    {
      key: 'pending',
      label: ui('En attente'),
      value: count(data.pending),
      hint: ui('Nouveaux ou à étudier')
    },
    {
      key: 'in_progress',
      label: ui('En cours'),
      value: count(data.in_progress)
    },
    { key: 'resolved', label: ui('Résolus'), value: count(data.resolved) },
    {
      key: 'average',
      label: ui('Temps moyen de traitement'),
      value: formatResolution(data.avg_resolution_hours),
      hint: resolutionHint(data.avg_resolution_hours)
    }
  ]
})
const statusChips = computed(() =>
  statusOptions().map(option => ({
    ...option,
    count: summary.value?.by_status
      ? Number(summary.value.by_status[option.value]) || 0
      : null
  }))
)

// Each summary request gets a number: a late answer for a previous app or period is ignored.
let summarySeq = 0
async function loadSummary() {
  const seq = ++summarySeq
  summaryLoading.value = true
  summaryError.value = ''
  try {
    const { data } = await feedbackApi.summary({
      applicationId: applicationId.value,
      period: period.value
    })
    if (seq !== summarySeq) return
    summary.value = data?.data || null
  } catch (e) {
    if (seq !== summarySeq) return
    summary.value = null
    summaryError.value = apiMessage(e)
  } finally {
    if (seq === summarySeq) summaryLoading.value = false
  }
}

// The search waits for a pause in typing before asking the server.
let searchTimer = null
watch(searchInput, value => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    filters.q = String(value || '').trim()
  }, SEARCH_DEBOUNCE_MS)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

function resetFilters() {
  clearTimeout(searchTimer)
  searchInput.value = ''
  Object.assign(filters, DEFAULT_FILTERS)
}

// Selection: at most BULK_MAX feedbacks, as the API accepts.
function warnCap() {
  $q.notify({
    type: 'warning',
    message: ui('{n} retours au maximum par action groupée.', { n: BULK_MAX })
  })
}
function toggle(id) {
  if (selection.value.includes(id))
    selection.value = selection.value.filter(other => other !== id)
  else if (selection.value.length >= BULK_MAX) warnCap()
  else selection.value = [...selection.value, id]
}
const allVisibleSelected = computed(
  () =>
    items.value.length > 0 &&
    items.value
      .slice(0, BULK_MAX)
      .every(item => selection.value.includes(item.id))
)
// Some but not all of the selectable rows: the box shows the "mixed" state.
const someVisibleSelected = computed(
  () =>
    !allVisibleSelected.value &&
    items.value.some(item => selection.value.includes(item.id))
)
function toggleAllVisible() {
  if (allVisibleSelected.value) {
    clearSelection()
    return
  }
  const next = [...selection.value]
  for (const item of items.value) {
    if (next.includes(item.id)) continue
    if (next.length >= BULK_MAX) {
      warnCap()
      break
    }
    next.push(item.id)
  }
  selection.value = next
}
function clearSelection() {
  selection.value = []
}

watch(bulkField, () => {
  bulkValue.value = null
})
const canApply = computed(
  () => !!bulkPayload(selection.value, bulkField.value, bulkValue.value)
)
const confirmText = computed(() =>
  i18n.global.t(
    'feedback.confirm',
    {
      change: bulkChangeLabel(bulkField.value, bulkValue.value),
      n: selection.value.length
    },
    selection.value.length
  )
)
function openConfirm() {
  if (!canApply.value) return
  bulkError.value = ''
  confirmOpen.value = true
}
async function runBulk() {
  const payload = bulkPayload(selection.value, bulkField.value, bulkValue.value)
  if (!payload || bulkRunning.value) return
  bulkRunning.value = true
  bulkError.value = ''
  try {
    const { data } = await feedbackApi.bulk(payload)
    confirmOpen.value = false
    clearSelection()
    $q.notify({
      type: 'positive',
      message: bulkResultMessage(payload.ids.length, data?.data)
    })
    void list.reload()
    void loadSummary()
  } catch (e) {
    // 404: one of the selected feedbacks is gone (deleted, or its app changed hands).
    if (e.response?.status === 404) {
      confirmOpen.value = false
      clearSelection()
      $q.notify({
        type: 'warning',
        message: ui(
          'Certains retours ne sont plus disponibles. La liste a été actualisée.'
        )
      })
      void list.reload()
      void loadSummary()
    } else bulkError.value = apiMessage(e)
  } finally {
    bulkRunning.value = false
  }
}

watch(
  [applicationId, () => ({ ...filters })],
  () => {
    clearSelection()
    void list.reload()
  },
  { deep: true }
)
watch(applicationId, () => void loadSummary())
watch(period, () => void loadSummary())

onMounted(async () => {
  void loadSummary()
  void list.reload()
  try {
    const { data } = await feedbackApi.apps()
    const apps = Array.isArray(data) ? data : data?.data || []
    appOptions.value = apps.map(app => ({ value: app.id, label: app.name }))
  } catch {
    // The page still works without the application filter.
  }
})

defineExpose({
  filters,
  searchInput,
  selection,
  bulkField,
  bulkValue,
  confirmOpen,
  applicationId,
  period,
  toggle,
  toggleAllVisible,
  openConfirm,
  runBulk,
  summary
})
</script>
<style scoped>
.privacy-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 16px;
  padding: 10px 12px;
  color: var(--text);
  font-size: 14px;
  background: var(--primary-soft, var(--surface-low));
  border-radius: 12px;
}
.privacy-note .q-icon {
  flex: none;
  margin-top: 2px;
  color: var(--pwa-link);
}
.scope {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.app-select {
  flex: 1 1 260px;
  max-width: 360px;
}
.periods,
.status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
.pill:focus-visible,
.row-title:focus-visible,
.row-check:focus-visible,
.select-all input:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.pill .count {
  padding: 0 7px;
  font-size: 12px;
  background: color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 999px;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.kpi-help {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 13px;
}
.kpi-skeleton {
  border-radius: 14px;
}
.kpi {
  display: grid;
  align-content: start;
  gap: 6px;
  border: 1px solid var(--outline);
}
.kpi-label,
.kpi small {
  color: var(--muted);
  font-size: 12px;
}
.kpi > strong {
  font-size: 24px;
  font-weight: 750;
}
.filters {
  display: grid;
  gap: 12px;
}
.filter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr));
  gap: 10px;
}
.filter-row .search {
  grid-column: 1 / -1;
}
.bulk-bar {
  position: sticky;
  top: 72px;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  border: 1px solid var(--pwa-primary);
}
.bulk-select {
  min-width: 160px;
}
.list-head {
  margin-bottom: 8px;
}
.select-all {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}
.feedback-list {
  display: grid;
  gap: 10px;
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
}
.feedback-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid var(--outline);
}
.feedback-row.selected {
  border-color: var(--pwa-primary);
}
.row-check,
.select-all input {
  width: 20px;
  height: 20px;
  margin-top: 3px;
  accent-color: var(--q-primary);
}
.row-body {
  display: grid;
  flex: 1;
  gap: 6px;
  min-width: 0;
}
.row-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.row-title {
  margin-right: 4px;
  color: var(--text);
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  overflow-wrap: anywhere;
}
.row-title:hover {
  color: var(--pwa-link);
  text-decoration: underline;
}
.excerpt {
  margin: 0;
  color: var(--text);
  font-size: 14px;
  overflow-wrap: anywhere;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}
.muted {
  color: var(--muted);
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
.confirm-card {
  width: min(460px, 100vw);
}
.confirm-card h2 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 750;
}
.form-error {
  margin: 8px 0 0;
  color: var(--q-negative);
}
</style>
