<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Portail développeur') }}</span
      ><h1>{{ ui('Statistiques') }}</h1
      ><p>{{
        ui(
          'Chiffres mesurés uniquement. Les vues de fiche, les ouvertures envoyées par vos applications et les installations déclarées par les utilisateurs sont comptées séparément : une installation réelle ne peut pas toujours être mesurée.'
        )
      }}</p></header
    >
    <div class="filters">
      <q-btn-toggle
        v-model="days"
        no-caps
        unelevated
        toggle-color="primary"
        :options="[
          { label: ui('7 jours'), value: 7 },
          { label: ui('30 jours'), value: 30 },
          { label: ui('90 jours'), value: 90 }
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
        :label="ui('Toutes mes applications')"
        class="app-filter"
      />
      <q-toggle v-model="asTable" :label="ui('Afficher en tableau')" />
    </div>
    <q-banner v-if="error" class="workspace-alert" role="alert">{{
      ui(error)
    }}</q-banner>
    <q-linear-progress v-if="loading" indeterminate />

    <template v-if="stats">
      <div class="kpis">
        <div v-for="kpi in kpis" :key="kpi.label" class="kpi workspace-card">
          <span
            >{{ kpi.label }}<InstallCountHelp v-if="kpi.help" :kind="kpi.help"
          /></span>
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
          <h2>{{ ui('Répartition des notes') }}</h2>
          <p v-if="!stats.totals.reviews" class="text-muted">{{
            ui('Aucun avis pour le moment.')
          }}</p>
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
            :label="ui('Répondre aux avis')"
            to="/developer/reviews"
          />
        </q-card>
      </div>

      <h2 class="q-mt-lg">{{ ui('Par application') }}</h2>
      <q-table
        flat
        bordered
        :rows="stats.applications"
        :columns="appColumns"
        row-key="id"
        :grid="$q.screen.lt.sm"
        :pagination="{ rowsPerPage: 0 }"
        hide-pagination
        :no-data-label="ui('Aucune application')"
      />
    </template>
  </q-page>
</template>
<script setup>
import InstallCountHelp from '@/components/InstallCountHelp.vue'
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

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
  {
    key: 'views',
    get label() {
      return ui('Vues de la fiche')
    }
  },
  {
    key: 'opens',
    get label() {
      return ui('Ouvertures mesurées par le SDK')
    }
  },
  {
    key: 'installs',
    get label() {
      return ui('Installations déclarées')
    }
  }
]
const kpis = computed(() => {
  const t = stats.value.totals
  return [
    {
      get label() {
        return ui('Premiers clics sur « Ouvrir » (par compte)')
      },
      value: t.activations || 0,
      get hint() {
        return ui(
          'Un seul clic compté par compte. Les statistiques avancées en comptent un par compte et par jour.'
        )
      }
    },
    {
      get label() {
        return ui('Vues de fiche')
      },
      value: t.views
    },
    {
      get label() {
        return ui('Ouvertures mesurées par le SDK')
      },
      value: t.opens
    },
    {
      get label() {
        return ui('Installations déclarées')
      },
      help: 'declared',
      value: t.installs
    },
    {
      get label() {
        return ui('Note moyenne')
      },
      value: t.average_rating ?? '—',
      get hint() {
        return ui('{p0} avis · {p1} sur la période', {
          p0: t.reviews,
          p1: t.new_reviews
        })
      }
    },
    {
      get label() {
        return ui('Signalements ouverts')
      },
      value: t.open_reports
    }
  ]
})
const maxStars = computed(() =>
  Math.max(1, ...Object.values(stats.value?.rating_distribution || {}))
)
const seriesColumns = [
  {
    name: 'day',
    get label() {
      return ui('Jour')
    },
    field: 'day',
    align: 'left',
    format: d => new Date(`${d}T00:00:00`).toLocaleDateString(currentLocale())
  },
  ...metrics.map(m => ({ name: m.key, label: m.label, field: m.key }))
]
const appColumns = [
  {
    name: 'name',
    get label() {
      return ui('Application')
    },
    field: 'name',
    align: 'left'
  },
  {
    name: 'status',
    get label() {
      return ui('Statut')
    },
    field: 'status',
    align: 'left',
    format: statusLabel
  },
  {
    name: 'views',
    get label() {
      return ui('Vues')
    },
    field: 'views',
    sortable: true
  },
  {
    name: 'opens',
    get label() {
      return ui('Ouvertures SDK')
    },
    field: 'opens',
    sortable: true
  },
  {
    name: 'installs',
    get label() {
      return ui('Installations déclarées')
    },
    field: 'installs',
    sortable: true
  },
  {
    name: 'reviews',
    get label() {
      return ui('Avis')
    },
    field: 'reviews',
    sortable: true
  },
  {
    name: 'average_rating',
    get label() {
      return ui('Note')
    },
    field: 'average_rating',
    format: v => v ?? '—'
  },
  {
    name: 'open_reports',
    get label() {
      return ui('Signalements')
    },
    field: 'open_reports'
  }
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
