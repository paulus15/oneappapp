<template>
  <q-page class="workspace-page lab-pro">
    <header class="workspace-heading"
      ><span class="eyebrow">{{ ui('Portail développeur') }}</span
      ><h1>{{ ui('Labo PWA') }}</h1
      ><p>{{
        ui(
          'Diagnostic technique d’une PWA à partir de son adresse : accès, manifeste, icônes, service worker, installation par navigateur, en-têtes de sécurité, ressources externes, permissions et performance. Aucun script n’est exécuté.'
        )
      }}</p></header
    >
    <DeveloperToolsNav />

    <q-card flat bordered class="workspace-card q-mb-md">
      <q-form class="lab-form" @submit="run">
        <q-select
          v-if="apps.length"
          v-model="applicationId"
          class="app-select"
          outlined
          clearable
          emit-value
          map-options
          option-value="id"
          option-label="name"
          :options="apps"
          :label="ui('Mon application (facultatif)')"
          :hint="ui('Remplit l’adresse et rattache l’analyse à l’application.')"
          @update:model-value="pickApp"
        />
        <div class="url-row">
          <q-input
            v-model="url"
            class="url-input col"
            outlined
            type="url"
            :label="ui('Adresse HTTPS de la PWA')"
            placeholder="https://mon-app.exemple.com/"
            :rules="[
              v => /^https:\/\//.test(v || '') || ui('Adresse HTTPS requise')
            ]"
          />
          <q-btn
            type="submit"
            class="run-analysis"
            color="primary"
            no-caps
            unelevated
            icon="science"
            :label="ui('Analyser')"
            :loading="busy"
            :disable="retryLeft > 0"
          />
        </div>
      </q-form>
      <q-banner
        v-if="errorText"
        class="workspace-alert lab-error"
        role="alert"
        >{{ errorText }}</q-banner
      >
    </q-card>

    <section
      v-if="busy"
      class="workspace-card lab-progress"
      role="status"
      aria-live="polite"
    >
      <div class="progress-head">
        <q-spinner-dots size="26px" color="primary" aria-hidden="true" />
        <div>
          <strong class="progress-step">{{ analysisStep(elapsed) }}</strong>
          <p>
            {{
              ui(
                'L’analyse peut prendre jusqu’à 25 secondes ({n} s écoulées).',
                { n: elapsed }
              )
            }}
          </p>
          <p v-if="openedDuringRun" class="background-note">
            {{
              ui(
                'L’analyse continue pendant que vous consultez l’historique : vous serez prévenu à la fin.'
              )
            }}
          </p>
        </div>
      </div>
      <q-linear-progress
        :value="Math.min(elapsed / 25, 0.95)"
        color="primary"
        rounded
        size="6px"
        aria-hidden="true"
      />
      <div v-if="!openedDuringRun" class="skeletons" aria-hidden="true">
        <q-skeleton type="rect" height="72px" />
        <q-skeleton type="rect" height="120px" />
        <q-skeleton type="rect" height="56px" />
      </div>
    </section>
    <q-banner
      v-if="finished"
      class="workspace-alert lab-finished q-mb-md"
      role="status"
    >
      {{ ui('L’analyse de {url} est terminée.', { url: finished.url }) }}
      <q-btn
        flat
        no-caps
        color="primary"
        class="show-finished"
        :label="ui('Afficher le rapport')"
        @click="showFinished"
      />
    </q-banner>

    <section v-if="detailLoading" class="lab-progress" role="status">
      <q-skeleton type="rect" height="72px" />
      <q-skeleton type="rect" height="160px" class="q-mt-sm" />
      <span class="sr-only">{{ ui('Chargement…') }}</span>
    </section>
    <EmptyState
      v-else-if="detailError"
      compact
      tone="error"
      icon="cloud_off"
      class="q-mb-md"
      :title="ui('Cette analyse n’a pas pu être chargée.')"
      :text="detailError"
    />

    <LabCompare
      v-if="compareState"
      :loading="compareState.loading"
      :error="compareState.error"
      :error-status="compareState.status"
      :data="compareState.data"
      @close="closeCompare"
    />

    <template
      v-if="
        current && !detailLoading && !detailError && (!busy || openedDuringRun)
      "
    >
      <header class="analysis-head">
        <div class="analysis-id">
          <strong class="analysis-url">{{ current.url }}</strong>
          <small
            v-if="current.final_url && current.final_url !== current.url"
            >{{
              ui('Adresse finale : {url}', { url: current.final_url })
            }}</small
          >
          <small>{{ labDate(current.created_at) }}</small>
        </div>
        <div class="analysis-actions">
          <q-btn
            v-if="pro"
            class="compare-current"
            outline
            no-caps
            color="primary"
            icon="history"
            :label="ui('Comparer avec la précédente')"
            @click="compare({ id: current.id, with: 'previous' })"
          />
          <q-btn
            class="export-pdf"
            unelevated
            no-caps
            color="primary"
            icon="picture_as_pdf"
            type="a"
            :href="printHref"
            target="_blank"
            rel="noopener"
            :label="ui('Exporter en PDF')"
          />
        </div>
      </header>
      <p class="export-hint">
        {{
          ui('Utilisez « Enregistrer en PDF » dans la fenêtre d’impression.')
        }}
      </p>
      <LabProReport v-if="pro" :analysis="current" />
      <div v-else class="lab-legacy-report">
        <LabLegacyReport :analysis="current" />
      </div>
    </template>

    <LabHistory
      ref="history"
      :apps="apps"
      :current-id="current?.id ?? null"
      @open="open"
      @compare="compare"
    />
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import DeveloperToolsNav from '@/components/DeveloperToolsNav.vue'
import EmptyState from '@/components/EmptyState.vue'
import LabCompare from '@/components/lab/LabCompare.vue'
import LabHistory from '@/components/lab/LabHistory.vue'
import LabLegacyReport from '@/components/lab/LabLegacyReport.vue'
import LabProReport from '@/components/lab/LabProReport.vue'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { labApi } from '@/services/lab'
import {
  analysisErrorMessage,
  analysisStep,
  compareErrorMessage,
  isProReport,
  labDate,
  retryAfterSeconds
} from '@/utils/lab'

const router = useRouter()

const url = ref(''),
  applicationId = ref(null),
  apps = ref([]),
  busy = ref(false),
  elapsed = ref(0),
  error = ref(''),
  retryLeft = ref(0),
  current = ref(null),
  detailLoading = ref(false),
  detailError = ref(''),
  compareState = ref(null),
  // An analysis keeps running while the user opens the history: tell them, then offer
  // its report when it ends instead of replacing what they are reading.
  openedDuringRun = ref(false),
  finished = ref(null),
  history = ref(null)

const pro = computed(() => isProReport(current.value))
const printHref = computed(() =>
  current.value
    ? router.resolve(`/developer/lab/${current.value.id}/print`).href
    : '#'
)
const errorText = computed(() =>
  retryLeft.value > 0
    ? ui('Trop d’analyses en peu de temps. Réessayez dans {n} s.', {
        n: retryLeft.value
      })
    : error.value
)

async function loadApps() {
  try {
    const { data } = await labApi.apps()
    apps.value = Array.isArray(data?.data) ? data.data : []
  } catch {
    // The selector is optional: the Lab works with an address alone.
    apps.value = []
  }
}
// Choosing an application fills its address; editing the address afterwards detaches it.
function pickApp(id) {
  const app = apps.value.find(item => item.id === id)
  if (app?.url) url.value = app.url
}
const selectedApp = computed(() =>
  apps.value.find(item => item.id === applicationId.value)
)

// Timers: elapsed seconds of the analysis and Retry-After countdown.
let elapsedTimer = null,
  retryTimer = null
function startElapsed() {
  elapsed.value = 0
  clearInterval(elapsedTimer)
  elapsedTimer = setInterval(() => elapsed.value++, 1000)
}
function startRetry(seconds) {
  retryLeft.value = seconds
  clearInterval(retryTimer)
  retryTimer = setInterval(() => {
    retryLeft.value = Math.max(0, retryLeft.value - 1)
    if (!retryLeft.value) clearInterval(retryTimer)
  }, 1000)
}
onBeforeUnmount(() => {
  clearInterval(elapsedTimer)
  clearInterval(retryTimer)
})

// One number per run and per displayed analysis: a late answer never overwrites a newer one.
let runSeq = 0,
  detailSeq = 0
async function run() {
  if (busy.value || retryLeft.value > 0) return
  const seq = ++runSeq
  const shown = ++detailSeq
  busy.value = true
  openedDuringRun.value = false
  finished.value = null
  error.value = ''
  detailError.value = ''
  closeCompare()
  startElapsed()
  const app = selectedApp.value
  try {
    const { data } = await labApi.analyze({
      url: url.value,
      // Only when the address is still the chosen application's.
      applicationId: app && app.url === url.value ? app.id : null
    })
    if (seq !== runSeq) return
    if (shown === detailSeq) current.value = data
    else finished.value = data
    history.value?.reload()
  } catch (e) {
    if (seq !== runSeq) return
    const seconds = e.response?.status === 429 ? retryAfterSeconds(e) : null
    if (seconds) startRetry(seconds)
    else error.value = analysisErrorMessage(e)
  } finally {
    if (seq === runSeq) {
      clearInterval(elapsedTimer)
      busy.value = false
      openedDuringRun.value = false
    }
  }
}
function showFinished() {
  detailSeq++
  current.value = finished.value
  finished.value = null
  detailError.value = ''
  detailLoading.value = false
}

async function open(id) {
  const seq = ++detailSeq
  if (busy.value) openedDuringRun.value = true
  detailLoading.value = true
  detailError.value = ''
  closeCompare()
  try {
    const { data } = await labApi.show(id)
    if (seq !== detailSeq) return
    current.value = data
    if (!busy.value) {
      url.value = data.url
      applicationId.value = data.application_id ?? null
    }
  } catch (e) {
    if (seq !== detailSeq) return
    detailError.value = apiMessage(e)
  } finally {
    if (seq === detailSeq) detailLoading.value = false
  }
}

let compareSeq = 0
async function compare({ id, with: withValue }) {
  const seq = ++compareSeq
  compareState.value = { loading: true, error: '', status: 0, data: null }
  try {
    const { data } = await labApi.compare(id, withValue)
    if (seq !== compareSeq) return
    compareState.value = {
      loading: false,
      error: '',
      status: 200,
      data: data?.data || null
    }
  } catch (e) {
    if (seq !== compareSeq) return
    compareState.value = {
      loading: false,
      error: compareErrorMessage(e, withValue),
      status: e.response?.status || 0,
      data: null
    }
  }
}
function closeCompare() {
  compareSeq++
  compareState.value = null
}

onMounted(loadApps)
</script>

<style scoped>
.lab-form {
  display: grid;
  gap: 12px;
}
.url-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.url-row .col {
  min-width: min(100%, 240px);
  flex: 1;
}
.url-row .q-btn {
  margin-top: 8px;
}
.lab-progress {
  margin-bottom: 18px;
}
.progress-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.progress-head p {
  margin: 2px 0 0;
  color: var(--muted);
  font-size: 13px;
}
.skeletons {
  display: grid;
  gap: 8px;
  margin-top: 14px;
}
.analysis-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 0 4px;
}
.analysis-id {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.analysis-url {
  font-size: 16px;
  overflow-wrap: anywhere;
}
.analysis-id small {
  color: var(--muted);
  overflow-wrap: anywhere;
}
.analysis-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.background-note {
  color: var(--text) !important;
  font-weight: 600;
}
.export-hint {
  margin: 0 0 14px;
  color: var(--muted);
  font-size: 12.5px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
