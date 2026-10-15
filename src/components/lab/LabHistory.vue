<template>
  <section
    class="workspace-section lab-history"
    aria-labelledby="lab-history-title"
  >
    <h2 id="lab-history-title">{{ ui('Historique') }}</h2>
    <div class="history-filters">
      <q-input
        v-model="urlInput"
        class="history-url"
        outlined
        dense
        clearable
        type="search"
        :label="ui('Adresse exacte (https://…)')"
        :hint="
          ui('Correspond à l’adresse complète analysée. Validez avec Entrée.')
        "
        @keyup.enter="applyUrl"
        @blur="applyUrl"
        @clear="clearUrl"
      />
      <q-select
        v-if="apps.length"
        v-model="applicationId"
        class="history-app"
        outlined
        dense
        clearable
        emit-value
        map-options
        option-value="id"
        option-label="name"
        :options="apps"
        :label="ui('Filtrer par application')"
      />
    </div>

    <div v-if="selection.length" class="compare-bar" role="status">
      <span>{{ labPlural('selected', selection.length) }}</span>
      <q-btn
        class="compare-selected"
        unelevated
        no-caps
        color="primary"
        icon="compare_arrows"
        :disable="selection.length !== 2"
        :label="ui('Comparer la sélection')"
        @click="compareSelected"
      />
      <q-btn flat no-caps :label="ui('Annuler')" @click="selection = []" />
    </div>

    <div v-if="list.loading.value" class="history-loading" role="status">
      <q-skeleton v-for="n in 3" :key="n" type="rect" height="64px" />
      <span class="sr-only">{{ ui('Chargement…') }}</span>
    </div>
    <EmptyState
      v-else-if="list.error.value"
      compact
      tone="error"
      icon="cloud_off"
      :title="ui('L’historique n’a pas pu être chargé.')"
      :text="listError"
    >
      <q-btn
        flat
        no-caps
        color="primary"
        :label="ui('Réessayer')"
        @click="reload"
      />
    </EmptyState>
    <EmptyState
      v-else-if="!items.length && (filters.url || applicationId)"
      compact
      icon="filter_alt_off"
      :title="ui('Aucune analyse ne correspond à ces filtres.')"
    />
    <EmptyState
      v-else-if="!items.length"
      compact
      icon="science"
      :title="ui('Aucune analyse.')"
      :text="ui('Lancez une première analyse : elle apparaîtra ici.')"
    />
    <ul v-else class="history-list">
      <li
        v-for="item in items"
        :key="item.id"
        class="history-item"
        :class="{ current: currentId === item.id }"
        :data-id="item.id"
      >
        <q-checkbox
          class="history-select"
          :model-value="selection.includes(item.id)"
          :disable="
            !isProReport(item) ||
            (!selection.includes(item.id) && selection.length >= 2)
          "
          :aria-label="
            isProReport(item)
              ? ui('Sélectionner pour comparer : {url}', { url: item.url })
              : ui('Comparaison réservée aux analyses Pro : {url}', {
                  url: item.url
                })
          "
          @update:model-value="toggle(item)"
        />
        <button
          type="button"
          class="history-open"
          :aria-current="currentId === item.id ? 'true' : undefined"
          @click="$emit('open', item.id)"
        >
          <span class="history-url-text">{{ item.url }}</span>
          <span class="history-meta">
            {{ labDate(item.created_at) }}
            <span class="engine" :class="{ pro: isProReport(item) }">{{
              isProReport(item) ? ui('Pro') : ui('Classique')
            }}</span>
            <span v-if="!isProReport(item)" class="no-compare">{{
              ui('Non comparable (analyse classique)')
            }}</span>
          </span>
        </button>
        <q-badge
          class="history-score"
          :color="item.reachable ? 'primary' : 'negative'"
          >{{
            item.reachable
              ? ui('{n}/100 (indicatif)', { n: item.score })
              : ui('Inaccessible')
          }}</q-badge
        >
        <q-btn
          v-if="isProReport(item)"
          class="compare-previous"
          flat
          dense
          no-caps
          color="primary"
          icon="history"
          :label="ui('Comparer avec la précédente')"
          @click="$emit('compare', { id: item.id, with: 'previous' })"
        />
      </li>
    </ul>
    <LoadMore
      :has-more="list.hasMore.value"
      :loading="list.loadingMore.value"
      :error="list.moreError.value"
      :shown="items.length"
      :total="list.total.value"
      :page-size="LAB_PAGE_SIZE"
      @load="list.loadMore"
    />
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { labApi } from '@/services/lab'
import { LAB_PAGE_SIZE, isProReport, labDate, labPlural } from '@/utils/lab'

defineProps({
  apps: { type: Array, default: () => [] },
  currentId: { type: Number, default: null }
})
const emit = defineEmits(['open', 'compare'])

const urlInput = ref(''),
  applicationId = ref(null),
  selection = ref([])
const filters = reactive({ url: '' })

const list = useLoadMore(
  async page =>
    (
      await labApi.list({
        url: filters.url,
        applicationId: applicationId.value,
        page
      })
    ).data
)
const items = list.items
const listError = computed(() =>
  list.last.value instanceof Error ? apiMessage(list.last.value) : ''
)

// The API matches the full address: apply it on Enter or when leaving the field, not
// on every keystroke.
function applyUrl() {
  filters.url = String(urlInput.value || '').trim()
}
function clearUrl() {
  urlInput.value = ''
  applyUrl()
}
watch([() => filters.url, applicationId], () => {
  selection.value = []
  list.reload()
})

// Only Pro analyses can be compared (the API answers 422 otherwise).
function toggle(item) {
  const id = item.id
  if (!isProReport(item)) return
  if (selection.value.includes(id))
    selection.value = selection.value.filter(other => other !== id)
  else if (selection.value.length < 2)
    selection.value = [...selection.value, id]
}
// The most recent analysis is the target, the older one the base.
function compareSelected() {
  if (selection.value.length !== 2) return
  const [older, newer] = [...selection.value].sort((a, b) => a - b)
  emit('compare', { id: newer, with: older })
}

function reload() {
  return list.reload()
}
defineExpose({ reload })
reload()
</script>

<style scoped>
.lab-history h2 {
  font-size: 17px;
  font-weight: 750;
  margin: 18px 0 8px;
}
.history-filters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: 10px;
  margin-bottom: 10px;
}
.compare-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--pwa-primary) 8%, var(--surface));
  border-radius: 12px;
}
.compare-bar > span {
  flex: 1;
  min-width: 160px;
  font-weight: 650;
}
.history-loading {
  display: grid;
  gap: 8px;
}
.history-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  border-radius: 14px;
  overflow: hidden;
}
.history-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 4px 8px;
  padding: 8px 10px;
  background: var(--surface);
}
.history-item + .history-item {
  border-top: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
}
.history-item.current {
  background: color-mix(in srgb, var(--pwa-primary) 8%, var(--surface));
}
.history-open {
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: 4px;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: none;
  border: 0;
  border-radius: 8px;
}
.history-open:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.history-url-text {
  overflow: hidden;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--muted);
  font-size: 12.5px;
}
.engine {
  padding: 0 6px;
  border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
  border-radius: 6px;
}
.engine.pro {
  color: var(--pwa-primary);
  border-color: var(--pwa-primary);
}
.compare-previous {
  grid-column: 2 / -1;
  justify-self: start;
}
@media (min-width: 760px) {
  .history-item {
    grid-template-columns: auto 1fr auto auto;
  }
  .compare-previous {
    grid-column: auto;
  }
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
