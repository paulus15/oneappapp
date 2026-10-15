<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Portail développeur') }}</span
      ><h1>{{ ui('Labo PWA') }}</h1
      ><p>{{
        ui(
          'Diagnostic technique d’une PWA à partir de son adresse : accès, métadonnées, manifeste, critères d’installation, responsive et indicateurs d’accessibilité et de performance. Aucun script n’est exécuté.'
        )
      }}</p></header
    >
    <DeveloperToolsNav />
    <q-card flat bordered class="workspace-card q-mb-md">
      <q-form class="lab-form" @submit="run">
        <q-input
          v-model="url"
          outlined
          type="url"
          :label="ui('Adresse HTTPS de la PWA')"
          placeholder="https://mon-app.exemple.com/"
          :rules="[
            v => /^https:\/\//.test(v || '') || ui('Adresse HTTPS requise')
          ]"
          class="col"
        />
        <q-btn
          type="submit"
          color="primary"
          no-caps
          unelevated
          icon="science"
          :label="ui('Analyser')"
          :loading="busy"
        />
      </q-form>
      <q-banner v-if="error" class="workspace-alert" role="alert">{{
        ui(error)
      }}</q-banner>
    </q-card>

    <template v-if="current">
      <div class="summary">
        <div class="workspace-card score">
          <span>{{ ui('Score technique') }}</span>
          <strong>{{ current.report.score ?? '—' }}<small>/100</small></strong>
          <q-linear-progress
            :value="(current.report.score || 0) / 100"
            color="primary"
            rounded
            size="8px"
          />
        </div>
        <div class="workspace-card install">
          <q-icon
            :name="current.report.installable ? 'install_mobile' : 'block'"
            :color="current.report.installable ? 'positive' : 'negative'"
            size="28px"
          />
          <div>
            <strong>{{
              current.report.installable
                ? ui('Installation possible')
                : ui('Installation non réunie')
            }}</strong>
            <p>{{ current.report.installability }}</p>
          </div>
        </div>
      </div>
      <p class="text-caption text-muted">{{ current.report.limits }}</p>

      <section
        v-for="group in groups"
        :key="group.name"
        class="workspace-section"
      >
        <h2>{{ group.name }}</h2>
        <q-list bordered separator class="rounded-borders">
          <q-item v-for="check in group.checks" :key="check.id">
            <q-item-section avatar>
              <q-icon
                :name="icons[check.status].icon"
                :color="icons[check.status].color"
                :aria-label="icons[check.status].label"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label
                >{{ check.label }}
                <span class="sr-only"
                  >— {{ icons[check.status].label }}</span
                ></q-item-label
              >
              <q-item-label caption>{{ check.detail }}</q-item-label>
              <q-item-label v-if="check.recommendation" class="advice"
                >→ {{ check.recommendation }}</q-item-label
              >
            </q-item-section>
          </q-item>
        </q-list>
      </section>
    </template>

    <section class="workspace-section">
      <h2>{{ ui('Historique') }}</h2>
      <p v-if="!history.length" class="text-muted">{{
        ui('Aucune analyse.')
      }}</p>
      <q-list v-else bordered separator class="rounded-borders">
        <q-item
          v-for="item in history"
          :key="item.id"
          clickable
          :active="current?.id === item.id"
          @click="open(item.id)"
        >
          <q-item-section>
            <q-item-label lines="1">{{ item.url }}</q-item-label>
            <q-item-label caption>{{
              new Date(item.created_at).toLocaleString(currentLocale())
            }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-badge :color="item.reachable ? 'primary' : 'negative'">{{
              item.reachable ? `${item.score}/100` : ui('Inaccessible')
            }}</q-badge>
          </q-item-section>
        </q-item>
      </q-list>
    </section>
  </q-page>
</template>
<script setup>
import DeveloperToolsNav from '@/components/DeveloperToolsNav.vue'
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { computed, onMounted, ref } from 'vue'
import { api } from '@/boot/axios'
import { apiMessage } from '@/services/account'

const url = ref(''),
  busy = ref(false),
  error = ref(''),
  current = ref(null),
  history = ref([])
const icons = {
  pass: { icon: 'check_circle', color: 'positive', label: 'conforme' },
  warn: {
    icon: 'error_outline',
    color: 'warning',
    get label() {
      return ui('à améliorer')
    }
  },
  fail: {
    icon: 'cancel',
    color: 'negative',
    get label() {
      return ui('en échec')
    }
  },
  info: { icon: 'info', color: 'grey-7', label: 'information' }
}
const order = [
  ui('Accès'),
  ui('Installation'),
  ui('Métadonnées'),
  ui('Responsive'),
  ui('Accessibilité'),
  ui('Performance')
]
const groups = computed(() =>
  order
    .map(name => ({
      name,
      checks: current.value.report.checks.filter(c => c.category === name)
    }))
    .filter(g => g.checks.length)
)
async function loadHistory() {
  history.value = (await api.get('/lab/analyses')).data.data
}
async function run() {
  busy.value = true
  error.value = ''
  try {
    current.value = (await api.post('/lab/analyses', { url: url.value })).data
    await loadHistory()
  } catch (e) {
    error.value =
      e.response?.status === 429
        ? ui('Cinq analyses par minute au maximum. Patientez un instant.')
        : apiMessage(e)
  } finally {
    busy.value = false
  }
}
async function open(id) {
  current.value = (await api.get(`/lab/analyses/${id}`)).data
  url.value = current.value.url
}
onMounted(loadHistory)
</script>
<style scoped>
.lab-form {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.lab-form .col {
  min-width: 240px;
  flex: 1;
}
.lab-form .q-btn {
  margin-top: 8px;
}
.summary {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(240px, 2fr);
  gap: 12px;
  margin-bottom: 8px;
}
@media (max-width: 600px) {
  .summary {
    grid-template-columns: 1fr;
  }
}
.score {
  display: grid;
  gap: 6px;
}
.score span {
  color: var(--muted);
}
.score strong {
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
}
.score small {
  font-size: 16px;
  color: var(--muted);
}
.install {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.install p {
  margin: 4px 0 0;
  color: var(--muted);
}
h2 {
  font-size: 17px;
  font-weight: 750;
  margin: 18px 0 8px;
}
.advice {
  color: var(--pwa-link);
  font-size: 13px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
