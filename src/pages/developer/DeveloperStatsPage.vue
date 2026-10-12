<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">Portail développeur</span><h1>Statistiques</h1
      ><p
        >Chiffres mesurés uniquement. Les vues de fiche, les ouvertures envoyées
        par vos applications et les installations déclarées par les utilisateurs
        sont comptées séparément : une installation réelle ne peut pas toujours
        être mesurée.</p
      ></header
    >
    <div class="filters">
      <q-btn-toggle
        v-model="days"
        no-caps
        unelevated
        toggle-color="primary"
        :options="[
          { label: '7 jours', value: 7 },
          { label: '30 jours', value: 30 },
          { label: '90 jours', value: 90 }
        ]"
      />
      <q-select
        v-model="applicationId"
        :options="appOptions"
        emit-value
        map-options
        outlined
        dense
        clearable
        label="Toutes mes applications"
        class="app-filter"
      />
      <q-toggle v-model="asTable" label="Afficher en tableau" />
    </div>
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      error
    }}</q-banner>
    <q-linear-progress v-if="loading" indeterminate />

    <template v-if="stats">
      <div class="kpis">
        <div v-for="kpi in kpis" :key="kpi.label" class="kpi workspace-card">
          <span>{{ kpi.label }}</span>
          <strong v-count-up="kpi.value" />
          <small v-if="kpi.hint">{{ kpi.hint }}</small>
        </div>
      </div>

      <div v-if="!asTable" class="multiples">
        <q-card
          v-for="metric in metrics"
          :key="metric.key"
          flat
          bordered
          class="workspace-card"
        >
          <TrendChart
            :title="metric.label"
            :points="
              stats.series.map(p => ({ day: p.day, value: p[metric.key] }))
            "
          />
        </q-card>
      </div>
      <q-table
        v-else
        flat
        bordered
        dense
        :rows="stats.series"
        :columns="seriesColumns"
        row-key="day"
        :pagination="{ rowsPerPage: 0 }"
        hide-pagination
        class="q-mb-md"
      />

      <div class="workspace-grid q-mt-md">
        <q-card flat bordered class="workspace-card">
          <h2>Répartition des notes</h2>
          <p v-if="!stats.totals.reviews" class="text-muted"
            >Aucun avis pour le moment.</p
          >
          <div v-else class="distribution">
            <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="dist-row">
              <span>{{ star }} ★</span>
              <div class="track">
                <div
                  class="fill"
                  :style="{
                    width: `${((stats.rating_distribution[star] || 0) / maxStars) * 100}%`
                  }"
                />
              </div>
              <span class="count">{{
                stats.rating_distribution[star] || 0
              }}</span>
            </div>
          </div>
          <q-btn
            flat
            no-caps
            color="primary"
            label="Répondre aux avis"
            to="/developer/reviews"
          />
        </q-card>
      </div>

      <h2 class="q-mt-lg">Par application</h2>
      <q-table
        flat
        bordered
        :rows="stats.applications"
        :columns="appColumns"
        row-key="id"
        :grid="$q.screen.lt.sm"
        :pagination="{ rowsPerPage: 0 }"
        hide-pagination
        no-data-label="Aucune application"
      />
    </template>
  </q-page>
</template>
<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { api } from '@/boot/axios'
import TrendChart from '@/components/TrendChart.vue'
import { apiMessage } from '@/services/account'
import { statusLabel } from '@/utils/appStatus'

const stats = ref(null),
  loading = ref(true),
  error = ref(''),
  days = ref(30),
  applicationId = ref(null),
  asTable = ref(false),
  appOptions = ref([])
const metrics = [
  { key: 'views', label: 'Vues de la fiche' },
  { key: 'opens', label: 'Ouvertures mesurées' },
  { key: 'installs', label: 'Installations déclarées' }
]
const kpis = computed(() => {
  const t = stats.value.totals
  return [
    { label: 'Vues de fiche', value: t.views },
    { label: 'Ouvertures', value: t.opens },
    { label: 'Installations déclarées', value: t.installs },
    {
      label: 'Note moyenne',
      value: t.average_rating ?? '—',
      hint: `${t.reviews} avis · ${t.new_reviews} sur la période`
    },
    { label: 'Signalements ouverts', value: t.open_reports }
  ]
})
const maxStars = computed(() =>
  Math.max(1, ...Object.values(stats.value?.rating_distribution || {}))
)
const seriesColumns = [
  {
    name: 'day',
    label: 'Jour',
    field: 'day',
    align: 'left',
    format: d => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR')
  },
  ...metrics.map(m => ({ name: m.key, label: m.label, field: m.key }))
]
const appColumns = [
  { name: 'name', label: 'Application', field: 'name', align: 'left' },
  {
    name: 'status',
    label: 'Statut',
    field: 'status',
    align: 'left',
    format: statusLabel
  },
  { name: 'views', label: 'Vues', field: 'views', sortable: true },
  { name: 'opens', label: 'Ouvertures', field: 'opens', sortable: true },
  {
    name: 'installs',
    label: 'Installations',
    field: 'installs',
    sortable: true
  },
  { name: 'reviews', label: 'Avis', field: 'reviews', sortable: true },
  {
    name: 'average_rating',
    label: 'Note',
    field: 'average_rating',
    format: v => v ?? '—'
  },
  { name: 'open_reports', label: 'Signalements', field: 'open_reports' }
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    stats.value = (
      await api.get('/developer/stats', {
        params: {
          days: days.value,
          application_id: applicationId.value || undefined
        }
      })
    ).data
    if (!applicationId.value)
      appOptions.value = stats.value.applications.map(a => ({
        value: a.id,
        label: a.name
      }))
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
watch([days, applicationId], load)
onMounted(load)
</script>
<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.app-filter {
  min-width: 220px;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.kpi {
  display: grid;
  gap: 2px;
}
.kpi span,
.kpi small {
  color: var(--muted);
  font-size: 12px;
}
.kpi strong {
  font-size: 26px;
  font-weight: 750;
}
.multiples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}
h2 {
  font-size: 18px;
  font-weight: 750;
  margin: 0 0 12px;
}
.distribution {
  display: grid;
  gap: 6px;
  margin-bottom: 8px;
}
.dist-row {
  display: grid;
  grid-template-columns: 34px 1fr 32px;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.track {
  height: 10px;
  border-radius: 4px;
  background: var(--pwa-chart-grid);
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 4px;
  background: var(--pwa-chart-mark);
}
.count {
  text-align: right;
  color: var(--muted);
}
</style>
