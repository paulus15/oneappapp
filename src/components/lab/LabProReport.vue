<template>
  <div class="lab-pro-report" :class="{ 'is-print': print }">
    <section class="lab-block report-intro" :aria-label="ui('Synthèse')">
      <p class="no-global-score">
        <q-icon name="info" aria-hidden="true" />
        {{
          ui(
            'Aucun score de sécurité global : chaque point est à évaluer selon votre contexte.'
          )
        }}
      </p>
      <div class="intro-grid">
        <div v-if="report.score != null" class="workspace-card tech-score">
          <span>{{ ui('Score technique (indicatif)') }}</span>
          <strong>{{ report.score }}<small>/100</small></strong>
        </div>
        <div class="workspace-card severities">
          <h2 class="block-title">{{ ui('Points par sévérité') }}</h2>
          <div
            class="severity-chips"
            role="group"
            :aria-label="ui('Filtrer par sévérité')"
          >
            <component
              :is="print ? 'span' : 'button'"
              v-for="chip in severityChips"
              :key="chip.value"
              :type="print ? undefined : 'button'"
              class="severity-chip"
              :class="[
                `sev-${chip.value}`,
                { active: filters.severity === chip.value }
              ]"
              :data-severity="chip.value"
              :aria-pressed="
                print
                  ? undefined
                  : filters.severity === chip.value
                    ? 'true'
                    : 'false'
              "
              @click="print || toggleFilter('severity', chip.value)"
            >
              <span>{{ chip.label }}</span>
              <strong class="chip-count">{{ chip.count }}</strong>
            </component>
          </div>
          <p class="chips-hint">
            {{
              ui(
                'Chaque pastille compte les points non réussis de cette sévérité : à corriger, informations et points non mesurés.'
              )
            }}
          </p>
        </div>
      </div>
      <p v-if="report.limits" class="report-limits">{{ report.limits }}</p>
    </section>

    <section class="lab-block" aria-labelledby="lab-categories">
      <h2 id="lab-categories" class="block-title">{{ ui('Par catégorie') }}</h2>
      <div class="category-grid">
        <component
          :is="print ? 'div' : 'button'"
          v-for="card in categoryCards"
          :key="card.key"
          :type="print ? undefined : 'button'"
          class="category-card"
          :class="{ active: filters.category === card.key }"
          :data-category="card.key"
          :aria-pressed="
            print ? undefined : filters.category === card.key ? 'true' : 'false'
          "
          @click="print || toggleFilter('category', card.key)"
        >
          <strong>{{ card.label }}</strong>
          <span class="category-counts">
            <span class="count-pass">{{ labPlural('passed', card.pass) }}</span>
            <span class="count-issues">{{
              labPlural('toFix', card.issues)
            }}</span>
            <span v-if="card.info" class="count-info">{{
              labPlural('info', card.info)
            }}</span>
            <span v-if="card.not_measured" class="count-unmeasured">{{
              labPlural('unmeasured', card.not_measured)
            }}</span>
          </span>
        </component>
      </div>
    </section>

    <div class="panels">
      <section
        v-if="metrics.length"
        class="lab-block workspace-card metrics-panel"
        aria-labelledby="lab-metrics"
      >
        <h2 id="lab-metrics" class="block-title">{{ ui('Mesures') }}</h2>
        <dl class="metrics">
          <div
            v-for="metric in metrics"
            :key="metric.key"
            :data-metric="metric.key"
          >
            <dt>{{ metric.label }}</dt>
            <dd>{{ metric.value }}</dd>
          </div>
        </dl>
      </section>

      <section
        v-if="browsers.length"
        class="lab-block workspace-card install-panel"
        aria-labelledby="lab-install"
      >
        <h2 id="lab-install" class="block-title">
          {{ ui('Installation par navigateur') }}
        </h2>
        <table class="install-table">
          <thead>
            <tr>
              <th scope="col">{{ ui('Navigateur') }}</th>
              <th scope="col">{{ ui('Installable') }}</th>
              <th scope="col">{{ ui('Critères manquants') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in browsers" :key="row.key" :data-browser="row.key">
              <th scope="row">{{ row.label }}</th>
              <td :data-label="ui('Installable')">
                <span class="install-status" :class="`install-${row.status}`">
                  <q-icon
                    :name="installIcon(row.status).icon"
                    :color="installIcon(row.status).color"
                    aria-hidden="true"
                  />
                  {{ installLabel(row.status, { unreachable }) }}
                </span>
              </td>
              <td :data-label="ui('Critères manquants')">
                <ul v-if="row.missing.length" class="missing">
                  <li v-for="item in row.missing" :key="item">
                    {{ missingLabel(item, row.key) }}
                  </li>
                </ul>
                <span v-else class="text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="report.installability_note" class="install-note">
          {{ report.installability_note }}
        </p>
      </section>

      <section
        v-if="permissions"
        class="lab-block workspace-card permissions-panel"
        aria-labelledby="lab-permissions"
      >
        <h2 id="lab-permissions" class="block-title">{{
          ui('Autorisations')
        }}</h2>
        <dl class="permission-groups">
          <div
            v-for="group in permissions"
            :key="group.key"
            :data-permissions="group.key"
          >
            <dt>{{ group.label }}</dt>
            <dd>
              <ul v-if="group.items.length" class="permission-list">
                <li v-for="item in group.items" :key="item">{{ item }}</li>
              </ul>
              <span v-else class="text-muted">{{ ui('Aucune') }}</span>
            </dd>
          </div>
        </dl>
      </section>
    </div>

    <section class="lab-block issues-section" aria-labelledby="lab-issues">
      <h2 id="lab-issues" class="block-title">{{ ui('Points à examiner') }}</h2>
      <div v-if="!print" class="issue-filters">
        <q-select
          v-model="filters.severity"
          class="filter-severity"
          outlined
          dense
          emit-value
          map-options
          :options="severityFilterOptions()"
          :label="ui('Sévérité')"
        />
        <q-select
          v-model="filters.category"
          class="filter-category"
          outlined
          dense
          emit-value
          map-options
          :options="categoryFilterOptions(checks)"
          :label="ui('Catégorie')"
        />
        <q-select
          v-model="filters.status"
          class="filter-status"
          outlined
          dense
          emit-value
          map-options
          :options="statusFilterOptions()"
          :label="ui('Statut')"
        />
        <q-input
          v-model="filters.q"
          class="filter-search"
          outlined
          dense
          clearable
          type="search"
          :label="ui('Rechercher un point')"
        />
        <q-btn
          v-if="filtered"
          class="reset-issue-filters"
          flat
          no-caps
          color="primary"
          icon="filter_alt_off"
          :label="ui('Réinitialiser')"
          @click="resetFilters"
        />
      </div>
      <p class="issues-count" aria-live="polite">
        {{ labPlural('shown', visible.issues.length) }}
      </p>
      <div v-if="visible.issues.length" class="issue-list">
        <LabIssueItem
          v-for="check in visible.issues"
          :key="check.id"
          :check="check"
          :force-open="print"
          :assistant="assistant"
          @assist="$emit('assist', $event)"
        />
      </div>
      <EmptyState
        v-else-if="filtered"
        compact
        icon="filter_alt_off"
        :title="ui('Aucun point ne correspond à ces filtres.')"
      >
        <q-btn
          flat
          no-caps
          color="primary"
          :label="ui('Réinitialiser les filtres')"
          @click="resetFilters"
        />
      </EmptyState>
      <EmptyState
        v-else
        compact
        tone="success"
        icon="task_alt"
        :title="ui('Aucun point à traiter parmi les contrôles mesurés.')"
      />
    </section>

    <section
      v-if="visible.notMeasured.length"
      class="lab-block browser-section"
      aria-labelledby="lab-browser"
    >
      <h2 id="lab-browser" class="block-title">{{
        ui('Nécessite un navigateur')
      }}</h2>
      <p class="text-muted">
        {{
          ui(
            'Le Labo lit la page et ses fichiers sans exécuter de script : ces points ne peuvent être vérifiés qu’en ouvrant l’application dans un navigateur. Contrôlez-les avec les outils de développement de votre navigateur.'
          )
        }}
      </p>
      <div class="issue-list">
        <LabIssueItem
          v-for="check in visible.notMeasured"
          :key="check.id"
          :check="check"
          :force-open="print"
          :assistant="assistant"
          @assist="$emit('assist', $event)"
        />
      </div>
    </section>

    <section
      v-if="print && passed.length"
      class="lab-block passed-section"
      aria-labelledby="lab-passed"
    >
      <h2 id="lab-passed" class="block-title">{{ ui('Points réussis') }}</h2>
      <ul class="passed-list">
        <li v-for="check in passed" :key="check.id">
          {{ check.label }} —
          {{ categoryLabel(check.category_key, check.category) }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import LabIssueItem from '@/components/lab/LabIssueItem.vue'
import { ui } from '@/i18n/text'
import {
  BROWSERS,
  CATEGORY_KEYS,
  DEFAULT_ISSUE_FILTERS,
  SEVERITIES,
  browserLabel,
  categoryFilterOptions,
  categoryLabel,
  filterChecks,
  hasActiveIssueFilters,
  installIcon,
  installLabel,
  labPlural,
  metricRows,
  missingLabel,
  severityFilterOptions,
  severityLabel,
  sortChecks,
  statusFilterOptions
} from '@/utils/lab'

const props = defineProps({
  analysis: { type: Object, required: true },
  // Print/export: no filters, every issue expanded, passed checks listed.
  print: Boolean,
  // Assistant hook, passed down to each issue; off until the `assistant` tool ships.
  assistant: Boolean
})
defineEmits(['assist'])

const filters = reactive({ ...DEFAULT_ISSUE_FILTERS })
const report = computed(() => props.analysis.report || {})
const checks = computed(() =>
  Array.isArray(report.value.checks) ? report.value.checks : []
)

// Print shows every measured issue whatever the screen filters.
const visible = computed(() =>
  filterChecks(checks.value, props.print ? DEFAULT_ISSUE_FILTERS : filters)
)
const passed = computed(() =>
  sortChecks(checks.value.filter(check => check.status === 'pass'))
)
const filtered = computed(() => !props.print && hasActiveIssueFilters(filters))

function toggleFilter(key, value) {
  filters[key] = filters[key] === value ? '' : value
}
function resetFilters() {
  Object.assign(filters, DEFAULT_ISSUE_FILTERS)
}

// The API summary is used as is; a report without one is counted from its checks.
// Counted from the checks themselves, so each chip matches the items it filters (issues
// plus browser-only checks); the API summary is only used for a report without checks.
const severityChips = computed(() => {
  const counts = report.value.summary?.by_severity
  const fromChecks = checks.value.length > 0 || !counts
  return SEVERITIES.map(value => ({
    value,
    label: severityLabel(value),
    count: fromChecks
      ? checks.value.filter(
          check => check.severity === value && check.status !== 'pass'
        ).length
      : Number(counts[value]) || 0
  }))
})

const categoryCards = computed(() => {
  const byCategory = report.value.summary?.by_category
  const keys = byCategory
    ? [
        ...CATEGORY_KEYS.filter(key => byCategory[key]),
        ...Object.keys(byCategory).filter(key => !CATEGORY_KEYS.includes(key))
      ]
    : CATEGORY_KEYS.filter(key =>
        checks.value.some(check => check.category_key === key)
      )
  return keys
    .map(key => {
      const counts =
        byCategory?.[key] ||
        checks.value
          .filter(check => check.category_key === key)
          .reduce((acc, check) => {
            acc[check.status] = (acc[check.status] || 0) + 1
            return acc
          }, {})
      const n = value => Number(counts[value]) || 0
      const sample = checks.value.find(check => check.category_key === key)
      return {
        key,
        label: categoryLabel(key, sample?.category),
        pass: n('pass'),
        // "À traiter" = failures and warnings; informations are counted apart.
        issues: n('fail') + n('warn'),
        info: n('info'),
        not_measured: n('not_measured')
      }
    })
    .filter(card => card.pass + card.issues + card.info + card.not_measured > 0)
})

const unreachable = computed(
  () => props.analysis.reachable === false || report.value.reachable === false
)

const metrics = computed(() => metricRows(report.value.metrics))

const browsers = computed(() => {
  const matrix = report.value.installability
  if (!matrix || typeof matrix !== 'object') return []
  return [
    ...BROWSERS.filter(key => matrix[key]),
    ...Object.keys(matrix).filter(key => !BROWSERS.includes(key))
  ].map(key => ({
    key,
    label: browserLabel(key),
    status: matrix[key]?.status || 'unknown',
    missing: Array.isArray(matrix[key]?.missing) ? matrix[key].missing : []
  }))
})

// Only shown when the app declares its permissions (declared !== null).
const permissions = computed(() => {
  const data = report.value.permissions
  if (!data || data.declared == null) return null
  const list = value => (Array.isArray(value) ? value : [])
  return [
    { key: 'detected', label: ui('Détectées'), items: list(data.detected) },
    { key: 'declared', label: ui('Déclarées'), items: list(data.declared) },
    {
      key: 'undeclared',
      label: ui('Non déclarées'),
      items: list(data.undeclared)
    },
    {
      key: 'unused_declared',
      label: ui('Déclarées non détectées'),
      items: list(data.unused_declared)
    }
  ]
})
</script>

<style scoped>
.lab-block {
  margin-bottom: 18px;
}
.block-title {
  margin: 0 0 10px;
  font-size: 17px;
  font-weight: 750;
}
.no-global-score {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0 0 12px;
  padding: 10px 14px;
  font-weight: 600;
  background: color-mix(in srgb, var(--pwa-primary) 8%, var(--surface));
  border-radius: 12px;
}
.no-global-score .q-icon {
  margin-top: 2px;
  color: var(--pwa-primary);
}
.intro-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 700px) {
  .intro-grid {
    grid-template-columns: minmax(160px, 1fr) minmax(280px, 3fr);
  }
}
.tech-score {
  display: grid;
  gap: 4px;
  align-content: start;
}
.tech-score span {
  color: var(--muted);
  font-size: 13px;
}
.tech-score strong {
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
}
.tech-score small {
  font-size: 14px;
  color: var(--muted);
}
.severity-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.severity-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  color: var(--text);
  font: inherit;
  font-size: 14px;
  cursor: pointer;
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--text) 16%, transparent);
  border-radius: 999px;
}
span.severity-chip {
  cursor: default;
}
.severity-chip::before {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--chip-color, var(--muted));
}
.sev-critical {
  --chip-color: var(--q-negative);
}
.sev-high {
  --chip-color: #e65100;
}
.sev-medium {
  --chip-color: #f57c00;
}
.sev-low {
  --chip-color: var(--pwa-primary);
}
.severity-chip.active,
.category-card.active {
  border-color: var(--pwa-primary);
  box-shadow: inset 0 0 0 1px var(--pwa-primary);
}
.severity-chip:focus-visible,
.category-card:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.chips-hint {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 12.5px;
}
.report-limits {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 13px;
}
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr));
  gap: 10px;
}
.category-card {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: var(--surface);
  border: 1px solid color-mix(in srgb, var(--text) 12%, transparent);
  border-radius: 14px;
}
div.category-card {
  cursor: default;
}
.category-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 12.5px;
  color: var(--muted);
}
.count-issues {
  color: var(--text);
  font-weight: 650;
}
.panels {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 18px;
}
@media (min-width: 900px) {
  .panels {
    grid-template-columns: 1fr 1fr;
  }
  .install-panel {
    grid-row: span 2;
  }
}
.panels .lab-block {
  margin-bottom: 0;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin: 0;
}
.metrics dt,
.permission-groups dt {
  color: var(--muted);
  font-size: 12.5px;
}
.metrics dd {
  margin: 2px 0 0;
  font-size: 16px;
  font-weight: 750;
  overflow-wrap: anywhere;
}
.install-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.install-table th,
.install-table td {
  padding: 8px 6px;
  text-align: left;
  vertical-align: top;
  border-top: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
}
.install-table thead th {
  border-top: 0;
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 650;
}
.install-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 650;
}
.install-note {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 13px;
}
.missing,
.permission-list,
.passed-list {
  margin: 0;
  padding-left: 18px;
}
.permission-groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr));
  gap: 10px;
  margin: 0;
}
.permission-groups dd {
  margin: 4px 0 0;
}
/* Mobile: the browser table becomes one card per browser. */
@media (max-width: 600px) {
  .install-table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .install-table tr,
  .install-table th,
  .install-table td {
    display: block;
  }
  .install-table tr {
    padding: 8px 0;
    border-top: 1px solid color-mix(in srgb, var(--text) 10%, transparent);
  }
  .install-table th,
  .install-table td {
    padding: 2px 0;
    border: 0;
  }
  .install-table td::before {
    content: attr(data-label);
    display: block;
    color: var(--muted);
    font-size: 12px;
  }
}
.issue-filters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 180px), 1fr));
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}
.issues-count {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 13px;
}
.is-print .lab-block {
  break-inside: auto;
}
@media print {
  .issues-section,
  .browser-section,
  .passed-section {
    break-before: page;
  }
  .panels {
    grid-template-columns: 1fr;
  }
}
</style>
