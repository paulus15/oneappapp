<template>
  <q-page class="workspace-page analytics-page">
    <header class="workspace-heading heading-row">
      <div class="heading-text">
        <span class="eyebrow">{{ ui('Portail développeur') }}</span>
        <h1>{{ ui('Statistiques avancées') }}</h1>
        <p>{{
          ui(
            'D’où viennent les visiteurs de vos fiches, ce qu’ils font ensuite et comment cela évolue. Chaque mesure est expliquée : un clic sur « Ouvrir » n’est pas une installation.'
          )
        }}</p>
      </div>
      <q-btn-dropdown
        outline
        no-caps
        color="primary"
        icon="download"
        class="export-menu"
        :label="ui('Exporter en CSV')"
        :loading="!!exporting"
        :disable="!overview"
      >
        <q-list>
          <q-item
            v-for="item in exportItems"
            :key="item.dataset"
            v-close-popup
            clickable
            class="export-item"
            :data-dataset="item.dataset"
            @click="exportDataset(item.dataset)"
          >
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </header>

    <section class="filters workspace-card" :aria-label="ui('Filtres')">
      <q-select
        v-model="filters.applicationId"
        :options="appOptions"
        emit-value
        map-options
        outlined
        dense
        ref="appSelect"
        class="app-select"
        :label="ui('Application')"
      />
      <div class="pills" role="group" :aria-label="ui('Période')">
        <button
          v-for="days in PERIOD_PRESETS"
          :key="days"
          type="button"
          class="pill period"
          :aria-pressed="filters.period === days"
          @click="selectPeriod(days)"
          >{{ ui('{n} j', { n: days }) }}</button
        >
        <button
          type="button"
          class="pill period custom-toggle"
          :class="{ active: filters.period === 'custom' }"
          :aria-expanded="customOpen"
          aria-controls="custom-range"
          @click="openCustom"
          >{{ ui('Personnalisée') }}</button
        >
      </div>
      <div class="pills" role="group" :aria-label="ui('Regroupement')">
        <button
          v-for="option in granularityOptions"
          :key="option.value"
          type="button"
          class="pill granularity"
          :aria-pressed="filters.granularity === option.value"
          @click="filters.granularity = option.value"
          >{{ option.label }}</button
        >
      </div>
      <form
        v-if="customOpen"
        id="custom-range"
        class="custom-range"
        novalidate
        @submit.prevent="applyCustom"
      >
        <q-input
          v-model="draft.from"
          type="date"
          outlined
          dense
          stack-label
          class="draft-from"
          :max="today"
          :label="ui('Du')"
        />
        <q-input
          v-model="draft.to"
          type="date"
          outlined
          dense
          stack-label
          class="draft-to"
          :min="draft.from || undefined"
          :max="today"
          :label="ui('Au')"
        />
        <q-btn
          type="submit"
          unelevated
          no-caps
          color="primary"
          class="apply-range"
          :label="ui('Appliquer')"
        />
        <p v-if="draftError" class="range-error" role="alert">{{
          draftError
        }}</p>
      </form>
      <p class="range-label muted">{{
        ui('Du {p0} au {p1}', {
          p0: formatDay(range.from),
          p1: formatDay(range.to)
        })
      }}</p>
    </section>

    <q-banner v-if="appNotice" class="workspace-alert app-notice" role="status">
      <template #avatar><q-icon name="info" aria-hidden="true" /></template>
      {{ appNotice }}
    </q-banner>

    <div
      v-if="loading"
      class="loading"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <div class="kpis">
        <q-skeleton v-for="n in 7" :key="n" height="118px" class="skeleton" />
      </div>
      <q-skeleton height="200px" class="skeleton q-mb-md" />
      <q-skeleton height="160px" class="skeleton" />
    </div>

    <EmptyState
      v-else-if="error"
      tone="error"
      icon="cloud_off"
      :title="ui('Les statistiques n’ont pas pu être chargées.')"
      :text="error"
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="refresh"
        class="retry"
        :label="ui('Réessayer')"
        @click="load()"
      />
    </EmptyState>

    <template v-else-if="overview">
      <q-banner v-if="showDataSince" class="workspace-alert data-since">
        <template #avatar
          ><q-icon name="history" aria-hidden="true"
        /></template>
        {{
          ui(
            'Données détaillées disponibles depuis le {p0}. Avant cette date, la provenance et le pays des visites ne sont pas connus.',
            { p0: formatDay(overview.data_since) }
          )
        }}
      </q-banner>

      <EmptyState
        v-if="empty"
        icon="query_stats"
        :title="ui('Aucune donnée sur cette période.')"
        :text="
          ui(
            'Les consultations de vos fiches et les clics sur « Ouvrir » apparaîtront ici dès qu’il y en aura.'
          )
        "
      />

      <template v-else>
        <section class="kpis" :aria-label="ui('Indicateurs')">
          <article
            v-for="card in kpis"
            :key="card.key"
            class="workspace-card kpi"
            :data-kpi="card.key"
          >
            <h2 class="kpi-label">{{ card.label }}</h2>
            <strong class="kpi-value">{{ card.value }}</strong>
            <span
              v-if="card.delta"
              class="delta"
              :class="`delta-${card.delta.tone}`"
              :title="card.delta.label"
              ><span aria-hidden="true">{{ card.delta.text }}</span
              ><span class="sr-only">{{ card.delta.label }}</span></span
            >
            <small class="kpi-note">{{ card.note }}</small>
          </article>
          <p class="kpi-help muted" :class="{ 'no-compare': !comparable }">{{
            comparable
              ? ui(
                  'Les évolutions comparent à la période précédente de même durée.'
                )
              : ui(
                  'Comparaison indisponible : la période précédente précède le début de la collecte.'
                )
          }}</p>
        </section>

        <section class="workspace-section" aria-labelledby="evolution-title">
          <div class="section-head">
            <h2 id="evolution-title">{{ ui('Évolution') }}</h2>
            <div
              class="pills"
              role="group"
              :aria-label="ui('Courbes supplémentaires')"
            >
              <button
                v-for="option in extraOptions"
                :key="option.key"
                type="button"
                class="pill extra"
                :data-series="option.key"
                :aria-pressed="extraSeries.includes(option.key)"
                @click="toggleExtra(option.key)"
                >{{ option.label }}</button
              >
            </div>
          </div>
          <div class="charts">
            <q-card
              v-for="chart in charts"
              :key="chart.key"
              flat
              bordered
              class="workspace-card"
            >
              <TrendChart
                :title="chart.label"
                :points="chartPoints[chart.key]"
              />
            </q-card>
          </div>
          <p class="muted chart-caption">{{ chartCaption }}</p>
          <q-toggle
            v-model="seriesTable"
            class="series-toggle"
            :label="ui('Afficher en tableau')"
          />
          <div v-if="seriesTable" class="workspace-card table-card">
            <table class="data-table series-table">
              <thead>
                <tr>
                  <th scope="col">{{ ui('Période') }}</th>
                  <th
                    v-for="column in seriesColumns"
                    :key="column.key"
                    scope="col"
                    >{{ column.label }}</th
                  >
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in overview.series"
                  :key="row.start || row.period"
                  :class="{ partial: row.partial === true }"
                >
                  <th scope="row" :data-label="ui('Période')"
                    >{{ bucketLabel(row) }}{{ row.partial === true ? ' ' : ''
                    }}<small v-if="row.partial === true" class="partial-tag">{{
                      ui('(partielle)')
                    }}</small></th
                  >
                  <td
                    v-for="column in seriesColumns"
                    :key="column.key"
                    :data-label="column.label"
                    >{{ formatCount(row[column.key]) }}</td
                  >
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div class="workspace-grid workspace-section">
          <section
            class="workspace-card table-card"
            aria-labelledby="sources-title"
          >
            <h2 id="sources-title">{{ ui('Provenance des visites') }}</h2>
            <table v-if="sources.length" class="data-table sources">
              <thead>
                <tr>
                  <th scope="col">{{ ui('Provenance') }}</th>
                  <th scope="col">{{ ui('Consultations') }}</th>
                  <th scope="col">{{ ui('Clics « Ouvrir »') }}</th>
                  <th scope="col">{{ ui('Taux de clic') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in sources" :key="row.source">
                  <th scope="row" :data-label="ui('Provenance')">
                    <span>{{ sourceLabel(row.source) }}</span>
                    <span class="bar" aria-hidden="true"
                      ><i :style="{ width: `${row.share}%` }"
                    /></span>
                  </th>
                  <td :data-label="ui('Consultations')">{{
                    formatCount(row.views)
                  }}</td>
                  <td :data-label="ui('Clics « Ouvrir »')">{{
                    formatCount(row.activations)
                  }}</td>
                  <td :data-label="ui('Taux de clic')">{{
                    formatRate(row.conversion)
                  }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="muted">{{
              ui('Aucune provenance connue sur cette période.')
            }}</p>
          </section>

          <section
            class="workspace-card table-card"
            aria-labelledby="countries-title"
          >
            <h2 id="countries-title">{{ ui('Pays des visiteurs') }}</h2>
            <p class="note">{{
              ui(
                'Pays déclaré ou choisi par le visiteur sur le store, pas une géolocalisation.'
              )
            }}</p>
            <table v-if="overview.countries?.length" class="data-table">
              <thead>
                <tr>
                  <th scope="col">{{ ui('Pays') }}</th>
                  <th scope="col">{{ ui('Consultations') }}</th>
                  <th scope="col">{{ ui('Clics « Ouvrir »') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in overview.countries"
                  :key="row.code || (row.other ? '__other' : '__none')"
                  class="country-row"
                >
                  <th scope="row" :data-label="ui('Pays')">{{
                    countryRowLabel(row, countryLabel)
                  }}</th>
                  <td :data-label="ui('Consultations')">{{
                    formatCount(row.views)
                  }}</td>
                  <td :data-label="ui('Clics « Ouvrir »')">{{
                    formatCount(row.activations)
                  }}</td>
                </tr>
              </tbody>
            </table>
            <p v-else class="muted">{{
              ui('Aucun pays déclaré pour le moment.')
            }}</p>
          </section>
        </div>

        <section
          class="workspace-card table-card workspace-section"
          aria-labelledby="referrers-title"
        >
          <h2 id="referrers-title">{{ ui('Sites externes') }}</h2>
          <p class="note">{{
            ui(
              'Sites d’où viennent les visiteurs arrivés par un lien externe. Seul le nom du site est conservé, jamais l’adresse complète.'
            )
          }}</p>
          <ol v-if="overview.referrers?.length" class="referrers">
            <li
              v-for="row in overview.referrers"
              :key="row.other ? '__other' : row.host"
            >
              <!-- Hosts come from visitors' browsers: plain text, never a link. -->
              <span class="host">{{
                row.other
                  ? ui(
                      'Autres sites (moins de 5 consultations ou au-delà du top 10)'
                    )
                  : row.host
              }}</span>
              <strong>{{ formatCount(row.views) }}</strong>
            </li>
          </ol>
          <p v-else class="muted">{{
            ui('Aucune consultation venue d’un site externe sur cette période.')
          }}</p>
        </section>
        <p class="note privacy-note">{{
          ui(
            'Pays et sites externes : les lignes de moins de 5 consultations sont regroupées pour protéger la vie privée.'
          )
        }}</p>

        <section
          v-if="overview.campaigns?.length"
          class="workspace-card table-card workspace-section"
          aria-labelledby="campaigns-title"
        >
          <h2 id="campaigns-title">{{ ui('Liens de partage') }}</h2>
          <table class="data-table campaigns">
            <thead>
              <tr>
                <th scope="col">{{ ui('Lien') }}</th>
                <th scope="col">{{ ui('Visites') }}</th>
                <th scope="col">{{ ui('Consultations') }}</th>
                <th scope="col">{{ ui('Clics « Ouvrir »') }}</th>
                <th scope="col">{{
                  ui('Taux de clic (Ouvrir / visites du lien)')
                }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in overview.campaigns" :key="row.id">
                <th scope="row" :data-label="ui('Lien')">
                  <router-link
                    v-if="tools.growth"
                    :to="`/developer/growth/campaigns/${row.id}`"
                    class="campaign-link"
                    >{{ row.name }}</router-link
                  >
                  <span v-else>{{ row.name }}</span>
                  <small class="muted">
                    {{ campaignSource(row.source).label }}</small
                  >
                </th>
                <td :data-label="ui('Visites')">{{
                  formatCount(row.visits)
                }}</td>
                <td :data-label="ui('Consultations')">{{
                  formatCount(row.views)
                }}</td>
                <td :data-label="ui('Clics « Ouvrir »')">{{
                  formatCount(row.opens)
                }}</td>
                <td
                  :data-label="ui('Taux de clic (Ouvrir / visites du lien)')"
                  >{{ formatRate(row.conversion) }}</td
                >
              </tr>
            </tbody>
          </table>
        </section>

        <section
          v-if="filters.applicationId === ALL && overview.top_apps?.length"
          class="workspace-card table-card workspace-section"
          aria-labelledby="apps-title"
        >
          <h2 id="apps-title">{{ ui('Par application') }}</h2>
          <table class="data-table top-apps">
            <thead>
              <tr>
                <th scope="col">{{ ui('Application') }}</th>
                <th scope="col">{{ ui('Consultations') }}</th>
                <th scope="col">{{ ui('Clics « Ouvrir »') }}</th>
                <th scope="col">{{ ui('Taux de clic') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in overview.top_apps" :key="row.id">
                <th scope="row" :data-label="ui('Application')">
                  <button
                    type="button"
                    class="app-filter"
                    :aria-label="ui('Voir le détail de {p0}', { p0: row.name })"
                    @click="showApp(row.id)"
                  >
                    <AppIcon :src="row.icon_url" alt="" class="app-icon" />
                    <span>{{ row.name }}</span>
                  </button>
                </th>
                <td :data-label="ui('Consultations')">{{
                  formatCount(row.views)
                }}</td>
                <td :data-label="ui('Clics « Ouvrir »')">{{
                  formatCount(row.activations)
                }}</td>
                <td :data-label="ui('Taux de clic')">{{
                  formatRate(row.conversion)
                }}</td>
              </tr>
            </tbody>
          </table>
        </section>
      </template>
    </template>
  </q-page>
</template>
<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import TrendChart from '@/components/TrendChart.vue'
import { usePlatform } from '@/composables/usePlatform'
import { i18n } from '@/i18n'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { analyticsApi } from '@/services/analytics'
import {
  GRANULARITIES,
  PERIOD_PRESETS,
  analyticsKpis,
  analyticsParams,
  blobErrorData,
  exportFilename,
  formatCount,
  formatDay,
  formatRate,
  isEmptyOverview,
  isoDay,
  presetRange,
  rangeError,
  seriesPoints,
  bucketLabel,
  countryRowLabel,
  sourceLabel
} from '@/utils/analytics'
import { countryLabel } from '@/utils/countries'
import { downloadBlob, sourceInfo as campaignSource } from '@/utils/growth'

const ALL = 'all'
const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const { tools } = usePlatform()
const today = isoDay(new Date())

// Filters start from the address (?app=&period=&from=&to=&granularity=), so a view can be shared.
function readFilters(query = {}) {
  const app = Number(query.app)
  const presets = PERIOD_PRESETS.map(String)
  const custom =
    query.period === 'custom' &&
    !rangeError(String(query.from), String(query.to))
  return {
    applicationId: Number.isInteger(app) && app > 0 ? app : ALL,
    period: custom
      ? 'custom'
      : presets.includes(String(query.period))
        ? Number(query.period)
        : 30,
    from: custom ? String(query.from) : '',
    to: custom ? String(query.to) : '',
    granularity: GRANULARITIES.includes(query.granularity)
      ? query.granularity
      : 'day'
  }
}
const filters = reactive(readFilters(route.query))

const range = computed(() =>
  filters.period === 'custom'
    ? { from: filters.from, to: filters.to }
    : presetRange(filters.period)
)
const params = computed(() =>
  analyticsParams({
    applicationId: filters.applicationId === ALL ? null : filters.applicationId,
    ...range.value,
    granularity: filters.granularity
  })
)

const apps = ref([])
const appOptions = computed(() => [
  { value: ALL, label: ui('Toutes mes applications') },
  ...apps.value.map(app => ({ value: app.id, label: app.name }))
])
const granularityOptions = computed(() => [
  { value: 'day', label: ui('Jour') },
  { value: 'week', label: ui('Semaine') },
  { value: 'month', label: ui('Mois') }
])

/* Custom period ---------------------------------------------------------- */
const customOpen = ref(filters.period === 'custom')
const draft = reactive({ from: range.value.from, to: range.value.to })
const draftError = ref('')
function selectPeriod(days) {
  customOpen.value = false
  draftError.value = ''
  filters.period = days
}
function openCustom() {
  customOpen.value = !customOpen.value
  if (customOpen.value) Object.assign(draft, range.value)
}
// Checked here with the API's rules, so an impossible period never leaves the page.
function applyCustom() {
  draftError.value = rangeError(draft.from, draft.to)
  if (draftError.value) return
  Object.assign(filters, { period: 'custom', from: draft.from, to: draft.to })
}

/* Report ---------------------------------------------------------------- */
const overview = ref(null),
  loading = ref(true),
  error = ref('')

// Each load gets a number; only the latest may fill the page, so a slow answer for the
// previous filters never replaces the current one.
let requestSeq = 0
const appNotice = ref('')
async function load() {
  const seq = ++requestSeq
  loading.value = true
  error.value = ''
  try {
    const { data } = await analyticsApi.overview(params.value)
    if (seq !== requestSeq) return
    overview.value = data?.data || null
  } catch (e) {
    if (seq !== requestSeq) return
    overview.value = null
    // An application that is not (or no longer) the developer's, e.g. an old ?app= link:
    // fall back to all applications instead of a dead end.
    if (e?.response?.status === 404 && filters.applicationId !== ALL) {
      appNotice.value = ui(
        'Cette application n’est pas disponible dans vos statistiques : toutes vos applications sont affichées.'
      )
      filters.applicationId = ALL
      return
    }
    error.value = apiMessage(e)
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

let lastSynced = null
function syncAddress() {
  const query = {}
  if (filters.applicationId !== ALL) query.app = String(filters.applicationId)
  if (filters.period === 'custom')
    Object.assign(query, {
      period: 'custom',
      from: filters.from,
      to: filters.to
    })
  else if (filters.period !== 30) query.period = String(filters.period)
  if (filters.granularity !== 'day') query.granularity = filters.granularity
  lastSynced = query
  Promise.resolve(router.replace({ query })).catch(() => {})
}

watch(
  () => JSON.stringify(params.value),
  () => {
    syncAddress()
    load()
  }
)
// Back/forward or a link to this page with other filters: follow the address.
watch(
  () => route.query,
  query => {
    const next = readFilters(query)
    if (
      Object.keys(next).some(key => next[key] !== filters[key]) &&
      JSON.stringify(query) !== JSON.stringify(lastSynced)
    ) {
      Object.assign(filters, next)
      customOpen.value = next.period === 'custom'
      if (customOpen.value)
        Object.assign(draft, { from: next.from, to: next.to })
    }
  }
)

watch(
  () => filters.applicationId,
  id => {
    if (id !== ALL) appNotice.value = ''
  }
)

// "Par application": show one app, then give focus back to the selector (the table
// that held the button disappears with the filter).
const appSelect = ref(null)
async function showApp(id) {
  appNotice.value = ''
  filters.applicationId = id
  await nextTick()
  appSelect.value?.focus?.()
}

const empty = computed(() => isEmptyOverview(overview.value))
const comparable = computed(
  () => overview.value?.kpis?.previous_complete !== false
)
const kpis = computed(() =>
  analyticsKpis(overview.value?.kpis, {
    uniqueVisitorsNote: overview.value?.unique_visitors_note
  })
)
const showDataSince = computed(() => {
  const since = overview.value?.data_since
  const from = overview.value?.range?.from || range.value.from
  return Boolean(since) && String(since).slice(0, 10) > from
})

/* Charts ---------------------------------------------------------------- */
const extraOptions = computed(() => [
  { key: 'unique_visitors', label: ui('Visiteurs uniques') },
  { key: 'sdk_opens', label: ui('Ouvertures SDK') },
  { key: 'declared_installs', label: ui('Installations déclarées') }
])
const extraSeries = ref([])
function toggleExtra(key) {
  extraSeries.value = extraSeries.value.includes(key)
    ? extraSeries.value.filter(item => item !== key)
    : [...extraSeries.value, key]
}
const charts = computed(() => [
  { key: 'views', label: ui('Consultations de la fiche') },
  { key: 'activations', label: ui('Clics sur « Ouvrir »') },
  ...extraOptions.value.filter(option => extraSeries.value.includes(option.key))
])
// The API flags each bucket cut by the range (a week or month only partly inside it).
const chartCaption = computed(() => {
  const unit =
    filters.granularity === 'week'
      ? ui('Un point par semaine, du lundi au dimanche.')
      : filters.granularity === 'month'
        ? ui('Un point par mois calendaire.')
        : ui('Un point par jour.')
  const partial = (overview.value?.series || []).filter(
    row => row.partial === true
  )
  return partial.length
    ? `${unit} ${i18n.global.t(
        'analytics.partial',
        { n: partial.length, list: partial.map(bucketLabel).join(', ') },
        partial.length
      )}`
    : unit
})
const seriesTable = ref(false)
const seriesColumns = computed(() => [
  { key: 'views', label: ui('Consultations') },
  { key: 'unique_visitors', label: ui('Visiteurs uniques') },
  { key: 'activations', label: ui('Clics « Ouvrir »') },
  { key: 'sdk_opens', label: ui('Ouvertures SDK') },
  { key: 'declared_installs', label: ui('Installations déclarées') }
])

const chartPoints = computed(() =>
  Object.fromEntries(
    charts.value.map(chart => [
      chart.key,
      seriesPoints(overview.value?.series, chart.key)
    ])
  )
)

const sources = computed(() => {
  const list = overview.value?.sources || []
  const max = Math.max(1, ...list.map(row => Number(row.views) || 0))
  return list.map(row => ({
    ...row,
    share: Math.round(((Number(row.views) || 0) / max) * 100)
  }))
})

/* CSV export ------------------------------------------------------------ */
const exportItems = computed(() => [
  { dataset: 'series', label: ui('Évolution') },
  { dataset: 'sources', label: ui('Provenances') },
  { dataset: 'countries', label: ui('Pays') },
  ...(filters.applicationId === ALL
    ? [{ dataset: 'apps', label: ui('Applications') }]
    : [])
])
const exporting = ref('')
async function exportDataset(dataset) {
  if (exporting.value) return
  exporting.value = dataset
  const current = params.value
  try {
    const response = await analyticsApi.exportCsv(current, dataset)
    const blob =
      response.data instanceof Blob
        ? response.data
        : new Blob([response.data ?? ''], { type: 'text/csv' })
    downloadBlob(
      blob,
      exportFilename(response.headers?.['content-disposition'], {
        dataset,
        ...current
      })
    )
  } catch (e) {
    $q.notify({ type: 'negative', message: apiMessage(await blobErrorData(e)) })
  } finally {
    exporting.value = ''
  }
}

onMounted(async () => {
  // Drops an invalid period or unknown parameter from the address right away.
  syncAddress()
  void load()
  try {
    const { data } = await analyticsApi.apps()
    const list = Array.isArray(data) ? data : data?.data
    apps.value = Array.isArray(list) ? list : []
  } catch {
    // The selector still offers "all my apps".
  }
})
</script>
<style scoped>
.analytics-page {
  --delta-up: #0f7b3d;
  --delta-down: #b42318;
}
:global(body.body--dark) .analytics-page {
  --delta-up: #6fdc9b;
  --delta-down: #ff9b8f;
}
.heading-row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}
.heading-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 760px;
}
.heading-text p {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  border: 1px solid var(--outline);
}
.app-select {
  flex: 1 1 240px;
  max-width: 340px;
}
.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pill {
  display: inline-flex;
  align-items: center;
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
.pill[aria-pressed='true'],
.pill.active {
  color: #fff;
  background: var(--q-primary);
  border-color: var(--q-primary);
}
.pill:focus-visible,
.app-filter:focus-visible,
.campaign-link:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.custom-range {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
}
.range-error {
  width: 100%;
  margin: 0;
  color: var(--q-negative);
  font-size: 13px;
}
.range-label {
  width: 100%;
  margin: 0;
  font-size: 13px;
}
.muted {
  color: var(--muted);
}
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 12px;
  margin-bottom: 8px;
}
.skeleton {
  border-radius: 14px;
}
.kpi {
  display: grid;
  align-content: start;
  gap: 6px;
  border: 1px solid var(--outline);
}
.kpi-label {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
}
.kpi-value {
  font-size: 26px;
  font-weight: 750;
}
.kpi-note {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
}
.kpi-help.no-compare {
  color: var(--text);
  font-weight: 600;
}
.series-table tr.partial {
  opacity: 0.65;
}
.partial-tag {
  color: var(--muted);
  font-weight: 400;
}
.kpi-help {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 13px;
}
.delta {
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
}
.delta-up {
  color: var(--delta-up);
}
.delta-down {
  color: var(--delta-down);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
h2 {
  font-size: 18px;
  font-weight: 750;
  margin: 0 0 12px;
}
.section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.section-head h2 {
  margin: 0;
}
.charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 12px;
}
.chart-caption,
.note {
  margin: 8px 0 12px;
  font-size: 13px;
}
.table-card {
  border: 1px solid var(--outline);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.data-table th,
.data-table td {
  padding: 8px 6px;
  text-align: right;
  border-bottom: 1px solid var(--outline);
  font-variant-numeric: tabular-nums;
}
.data-table th[scope='row'],
.data-table thead th:first-child {
  text-align: left;
  font-weight: 600;
}
.data-table thead th {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}
.bar {
  display: block;
  height: 6px;
  margin-top: 6px;
  border-radius: 3px;
  background: var(--pwa-chart-grid);
  overflow: hidden;
}
.bar i {
  display: block;
  height: 100%;
  background: var(--pwa-chart-mark);
}
.referrers {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.referrers li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--outline);
}
.host {
  overflow-wrap: anywhere;
}
.campaign-link {
  color: var(--pwa-link);
  font-weight: 600;
}
.campaigns small {
  display: block;
  font-weight: 400;
}
.app-filter {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  color: var(--pwa-link);
  font: inherit;
  font-weight: 600;
  text-align: left;
  background: none;
  border: 0;
  cursor: pointer;
}
.app-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex: none;
}
/* Phones: each row becomes a small card, every value with its column name. */
@media (max-width: 600px) {
  .data-table thead {
    display: none;
  }
  .data-table tr {
    display: grid;
    gap: 4px;
    padding: 10px 0;
    border-bottom: 1px solid var(--outline);
  }
  .data-table th,
  .data-table td {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 2px 0;
    border: 0;
    text-align: right;
  }
  .data-table td::before {
    content: attr(data-label);
    color: var(--muted);
    text-align: left;
  }
  .data-table th[scope='row'] {
    display: block;
  }
  .export-menu {
    width: 100%;
  }
}
</style>
