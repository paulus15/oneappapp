<template>
  <q-page class="workspace-page">
    <router-link to="/developer/monitor" class="back-link">
      <q-icon name="arrow_back" aria-hidden="true" />
      {{ ui('Toutes les applications surveillées') }}
    </router-link>

    <div
      v-if="loading"
      class="detail-skeleton"
      role="status"
      aria-busy="true"
      :aria-label="ui('Chargement…')"
    >
      <q-skeleton height="96px" class="q-mb-md" />
      <div class="kpis">
        <q-skeleton v-for="n in 4" :key="n" height="110px" />
      </div>
      <q-skeleton height="180px" class="q-mt-md" />
    </div>

    <EmptyState
      v-else-if="notFound"
      icon="search_off"
      :title="ui('Application introuvable.')"
      :text="
        ui(
          'Cette application n’existe pas, ne vous appartient pas ou la surveillance n’est pas disponible.'
        )
      "
    >
      <q-btn
        unelevated
        no-caps
        color="primary"
        :label="ui('Retour au Monitor')"
        to="/developer/monitor"
      />
    </EmptyState>

    <EmptyState
      v-else-if="error"
      tone="error"
      icon="cloud_off"
      :title="ui('Impossible de charger la surveillance.')"
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
        <AppIcon :src="detail.app.icon_url" alt="" class="app-icon" />
        <div class="head-text">
          <span class="eyebrow">{{ ui('PWA Monitor') }}</span>
          <h1>{{ detail.app.name }}</h1>
          <a
            v-if="detail.app.url"
            :href="detail.app.url"
            target="_blank"
            rel="noopener noreferrer"
            class="app-url"
            >{{ detail.app.url }}</a
          >
          <div v-if="!monitorable" class="badges">
            <MonitorBadge :label="ui('Non surveillée')" icon="visibility_off" />
          </div>
          <div v-else class="badges">
            <MonitorBadge v-bind="status" />
            <MonitorBadge
              v-if="monitor.open_incident"
              :label="ui('Incident en cours')"
              icon="emergency"
              color="negative"
            />
            <MonitorBadge
              v-if="!monitor.enabled"
              :label="ui('Surveillance en pause')"
              icon="pause_circle"
            />
          </div>
        </div>
        <div v-if="monitorable" class="head-actions">
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="refresh"
            :label="ui('Vérifier maintenant')"
            :loading="checking || waitingResult"
            :disable="!checkAllowed"
            @click="checkNow"
          />
          <small v-if="!checkAllowed">{{
            ui('Activez la surveillance pour lancer une vérification.')
          }}</small>
          <small v-else-if="monitor.next_check_at">{{
            ui('Prochaine vérification : {p0}', {
              p0: monitorNextCheck(monitor.next_check_at)
            })
          }}</small>
          <small
            v-if="checkNotice"
            class="check-notice"
            :class="`notice-${checkNotice.tone}`"
            role="status"
            ><q-spinner
              v-if="waitingResult"
              size="14px"
              class="q-mr-xs"
              aria-hidden="true"
            />{{ checkNotice.text }}</small
          >
        </div>
      </header>

      <q-banner class="workspace-alert info-note" dense>
        <template #avatar
          ><q-icon name="info" color="primary" aria-hidden="true"
        /></template>
        {{
          ui(
            'Le Monitor est informatif : il vous alerte selon vos préférences mais ne retire jamais votre application du store. Le contrôle automatique d’adresse effectué par le store reste distinct et suit ses propres règles de publication.'
          )
        }}
      </q-banner>
      <q-banner
        v-if="!monitorable"
        class="workspace-alert not-monitorable"
        role="status"
      >
        <template #avatar
          ><q-icon name="visibility_off" aria-hidden="true"
        /></template>
        {{
          ui(
            'Cette application n’est pas surveillée : publiez-la avec une adresse HTTPS pour activer les vérifications et les alertes.'
          )
        }}
        <template #action>
          <q-btn
            flat
            no-caps
            color="primary"
            :label="ui('Ouvrir l’application')"
            :to="`/developer/apps/${detail.app.id}`"
          />
        </template>
      </q-banner>

      <section class="kpis" :aria-label="ui('Indicateurs')">
        <div class="workspace-card kpi">
          <span class="kpi-label">{{ ui('État') }}</span>
          <MonitorBadge v-bind="status" />
          <small>{{
            ui('Dernière vérification : {p0}', {
              p0: monitorRelative(monitor.last_checked_at)
            })
          }}</small>
        </div>
        <div class="workspace-card kpi">
          <span class="kpi-label">{{ ui('Temps de réponse') }}</span>
          <strong>{{ monitorDuration(monitor.response_ms) }}</strong>
          <small v-if="monitor.http_status">{{
            ui('Code HTTP {p0}', { p0: monitor.http_status })
          }}</small>
        </div>
        <div class="workspace-card kpi">
          <span class="kpi-label">{{ ui('Disponibilité') }}</span>
          <dl class="uptime">
            <div v-for="period in uptimePeriods" :key="period.key">
              <dt>{{ period.label }}</dt>
              <dd>
                <strong>{{ monitorUptime(period.value?.ratio) }}</strong>
                <small>{{
                  ui('{n} vérifications', { n: period.value?.checks ?? 0 })
                }}</small>
              </dd>
            </div>
          </dl>
        </div>
        <div class="workspace-card kpi">
          <span class="kpi-label">{{ ui('Certificat') }}</span>
          <MonitorBadge v-bind="monitorTls(monitor.tls_days_left)" />
          <small v-if="monitor.tls_expires_at">{{
            ui('Expire le {p0}', { p0: monitorDate(monitor.tls_expires_at) })
          }}</small>
        </div>
        <div class="workspace-card kpi">
          <span class="kpi-label">{{ ui('Manifeste') }}</span>
          <MonitorBadge v-bind="monitorManifest(monitor.manifest_ok)" />
        </div>
      </section>

      <section class="workspace-section">
        <h2>{{ ui('30 derniers jours') }}</h2>
        <div class="workspace-grid charts">
          <q-card flat bordered class="workspace-card">
            <p class="chart-title">{{ ui('Disponibilité quotidienne') }}</p>
            <ol class="day-strip">
              <li v-for="(day, index) in availability" :key="day.date">
                <button
                  type="button"
                  class="day"
                  :class="`day-${day.tone}`"
                  :aria-label="day.label"
                  :aria-pressed="index === selectedIndex"
                  @click="selectedDay = index"
                  @focus="selectedDay = index"
                  @mouseenter="selectedDay = index"
                />
              </li>
            </ol>
            <div class="strip-axis" aria-hidden="true">
              <span>{{ shortDay(availability[0]?.date) }}</span>
              <span>{{ shortDay(availability.at(-1)?.date) }}</span>
            </div>
            <p
              v-if="availability[selectedIndex]"
              class="day-detail"
              aria-live="polite"
            >
              {{ availability[selectedIndex].label }}
            </p>
            <p class="legend">
              <span><i class="day-positive" />≥ 99 %</span>
              <span><i class="day-warning" />{{ ui('95 à 99 %') }}</span>
              <span><i class="day-negative" />&lt; 95 %</span>
              <span><i class="day-neutral" />{{ ui('Aucune donnée') }}</span>
            </p>
          </q-card>
          <q-card flat bordered class="workspace-card">
            <template v-if="responseSummary">
              <TrendChart
                :title="ui('Temps de réponse moyen par jour')"
                :points="responsePoints"
                :summary="responseSummary"
                unit=" ms"
              />
              <p class="chart-note">{{
                ui(
                  'Valeur affichée : moyenne sur 30 jours pondérée par le nombre de vérifications. Les jours sans mesure restent vides.'
                )
              }}</p>
            </template>
            <p v-else class="text-muted">{{
              ui('Pas encore de temps de réponse mesuré.')
            }}</p>
          </q-card>
        </div>
      </section>

      <section class="workspace-section">
        <q-tabs
          v-model="tab"
          align="left"
          no-caps
          inline-label
          outside-arrows
          mobile-arrows
        >
          <q-tab name="incidents" icon="emergency" :label="ui('Incidents')" />
          <q-tab name="checks" icon="history" :label="ui('Vérifications')" />
        </q-tabs>
        <q-tab-panels v-model="tab" animated keep-alive class="panels">
          <q-tab-panel name="incidents" class="q-pa-none">
            <q-skeleton v-if="incidents.loading.value" height="120px" />
            <EmptyState
              v-else-if="incidents.error.value"
              compact
              tone="error"
              icon="cloud_off"
              :title="ui('Les incidents n’ont pas pu être chargés.')"
            >
              <q-btn
                flat
                no-caps
                color="primary"
                :label="ui('Réessayer')"
                @click="incidents.reload()"
              />
            </EmptyState>
            <EmptyState
              v-else-if="!incidents.items.value.length"
              compact
              tone="success"
              icon="verified"
              :title="ui('Aucun incident enregistré.')"
            />
            <template v-else>
              <q-list bordered separator class="rounded-borders">
                <q-item
                  v-for="incident in incidents.items.value"
                  :key="incident.id"
                >
                  <q-item-section>
                    <q-item-label class="row-head">
                      <strong>{{ incidentKind(incident.kind) }}</strong>
                      <MonitorBadge v-bind="incidentState(incident)" />
                    </q-item-label>
                    <q-item-label caption>
                      {{
                        ui('Début : {p0}', {
                          p0: monitorDate(incident.started_at)
                        })
                      }}
                      <template v-if="incident.resolved_at">
                        ·
                        {{
                          ui('Résolu : {p0}', {
                            p0: monitorDate(incident.resolved_at)
                          })
                        }}</template
                      >
                      ·
                      {{
                        ui('{n} vérifications en échec', {
                          n: incident.failed_checks ?? 0
                        })
                      }}
                    </q-item-label>
                    <q-item-label
                      v-if="incident.last_error"
                      caption
                      class="error-text"
                      >{{ incident.last_error }}</q-item-label
                    >
                  </q-item-section>
                </q-item>
              </q-list>
              <LoadMore
                :has-more="incidents.hasMore.value"
                :loading="incidents.loadingMore.value"
                :error="incidents.moreError.value"
                :shown="incidents.items.value.length"
                :total="incidents.total.value"
                :page-size="15"
                @load="incidents.loadMore()"
              />
            </template>
          </q-tab-panel>
          <q-tab-panel name="checks" class="q-pa-none">
            <q-skeleton v-if="checks.loading.value" height="120px" />
            <EmptyState
              v-else-if="checks.error.value"
              compact
              tone="error"
              icon="cloud_off"
              :title="ui('L’historique n’a pas pu être chargé.')"
            >
              <q-btn
                flat
                no-caps
                color="primary"
                :label="ui('Réessayer')"
                @click="checks.reload()"
              />
            </EmptyState>
            <EmptyState
              v-else-if="!checks.items.value.length"
              compact
              icon="history"
              :title="ui('Aucune vérification pour le moment.')"
            />
            <template v-else>
              <q-list bordered separator class="rounded-borders">
                <q-item v-for="check in checks.items.value" :key="check.id">
                  <q-item-section>
                    <q-item-label class="row-head">
                      <strong>{{ monitorDate(check.checked_at) }}</strong>
                      <MonitorBadge v-bind="monitorStatus(check.state)" />
                    </q-item-label>
                    <q-item-label caption>
                      {{
                        check.http_status
                          ? ui('Code HTTP {p0}', { p0: check.http_status })
                          : ui('Pas de réponse HTTP')
                      }}
                      · {{ monitorDuration(check.response_ms) }} ·
                      {{
                        ui('Manifeste : {p0}', {
                          p0: monitorManifest(check.manifest_ok).label
                        })
                      }}
                      ·
                      {{
                        ui('Icônes : {p0}', {
                          p0: monitorManifest(check.icons_ok).label
                        })
                      }}
                    </q-item-label>
                    <q-item-label
                      v-if="check.error"
                      caption
                      class="error-text"
                      >{{ check.error }}</q-item-label
                    >
                  </q-item-section>
                </q-item>
              </q-list>
              <LoadMore
                :has-more="checks.hasMore.value"
                :loading="checks.loadingMore.value"
                :error="checks.moreError.value"
                :shown="checks.items.value.length"
                :total="checks.total.value"
                :page-size="20"
                @load="checks.loadMore()"
              />
            </template>
          </q-tab-panel>
        </q-tab-panels>
      </section>

      <section v-if="monitorable" class="workspace-section">
        <q-card flat bordered class="workspace-card">
          <h2>{{ ui('Surveillance et alertes') }}</h2>
          <q-form class="settings-form" @submit="saveSettings">
            <q-toggle
              v-model="form.enabled"
              :label="ui('Surveiller cette application')"
            />
            <q-select
              v-model="form.interval_minutes"
              :options="intervalOptions"
              emit-value
              map-options
              outlined
              :disable="!form.enabled"
              :label="ui('Fréquence des vérifications')"
              class="interval-select"
            />
            <q-toggle
              v-model="form.notify_email"
              :disable="!form.enabled"
              :label="ui('M’alerter par e-mail lors d’un incident confirmé')"
            />
            <q-toggle
              v-model="form.notify_recovery"
              :disable="!form.enabled || !form.notify_email"
              :label="ui('M’avertir aussi du rétablissement')"
            />
            <div>
              <q-btn
                type="submit"
                unelevated
                no-caps
                color="primary"
                icon="save"
                :label="ui('Enregistrer')"
                :loading="saving"
              />
            </div>
          </q-form>
        </q-card>
      </section>
    </template>
  </q-page>
</template>
<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import EmptyState from '@/components/EmptyState.vue'
import LoadMore from '@/components/LoadMore.vue'
import MonitorBadge from '@/components/MonitorBadge.vue'
import TrendChart from '@/components/TrendChart.vue'
import { useLoadMore } from '@/composables/useLoadMore'
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'
import { apiMessage } from '@/services/account'
import { monitorApi } from '@/services/monitor'
import {
  incidentKind,
  incidentState,
  isMonitorable,
  monitorDate,
  monitorDuration,
  monitorInterval,
  monitorManifest,
  monitorNextCheck,
  monitorRelative,
  monitorStatus,
  monitorTls,
  monitorUptime
} from '@/utils/monitor'

const $q = useQuasar()
const route = useRoute()
const appId = computed(() => route.params.id)

const detail = ref(null),
  loading = ref(true),
  notFound = ref(false),
  error = ref(''),
  tab = ref('incidents'),
  checking = ref(false),
  // A manual check was accepted: the page polls until its result is recorded.
  waitingResult = ref(false),
  checkNotice = ref(null),
  saving = ref(false),
  selectedDay = ref(null)
const emptyForm = () => ({
  enabled: true,
  interval_minutes: null,
  notify_email: false,
  notify_recovery: false
})
const form = reactive(emptyForm())

const monitor = computed(() => detail.value?.monitor || {})
const status = computed(() => monitorStatus(monitor.value.state))
const monitorable = computed(() => isMonitorable(detail.value?.app))
// The API answers 422 while monitoring is off: offer the button only when it can work.
const checkAllowed = computed(() => detail.value?.settings?.enabled !== false)
const uptimePeriods = computed(() => [
  { key: '24h', label: ui('24 h'), value: detail.value?.uptime?.['24h'] },
  { key: '7d', label: ui('7 jours'), value: detail.value?.uptime?.['7d'] },
  { key: '30d', label: ui('30 jours'), value: detail.value?.uptime?.['30d'] }
])
const intervalOptions = computed(() =>
  (detail.value?.intervals || []).map(minutes => ({
    value: minutes,
    label: monitorInterval(minutes)
  }))
)

const shortDay = day =>
  day
    ? new Date(`${day}T00:00:00`).toLocaleDateString(currentLocale(), {
        day: 'numeric',
        month: 'short'
      })
    : ''
const availability = computed(() =>
  (detail.value?.daily || []).map(day => {
    const ratio = day.checks ? (day.ok / day.checks) * 100 : null
    const tone =
      ratio === null
        ? 'neutral'
        : ratio >= 99
          ? 'positive'
          : ratio >= 95
            ? 'warning'
            : 'negative'
    return {
      date: day.date,
      tone,
      label:
        ratio === null
          ? ui('{p0} : aucune donnée', { p0: shortDay(day.date) })
          : ui('{p0} : {p1} ({n} vérifications)', {
              p0: shortDay(day.date),
              p1: monitorUptime(ratio),
              n: day.checks
            })
    }
  })
)
// Latest day by default; focus, tap or hover selects another one.
const selectedIndex = computed(
  () => selectedDay.value ?? availability.value.length - 1
)
const measured = day => day.avg_ms !== null && day.avg_ms !== undefined
// Every day keeps its place: unmeasured days are gaps, not joined points.
const responsePoints = computed(() =>
  (detail.value?.daily || []).map(day => ({
    day: day.date,
    value: measured(day) ? Math.round(day.avg_ms) : null
  }))
)
const responseSummary = computed(() => {
  const days = (detail.value?.daily || []).filter(
    day => measured(day) && day.checks > 0
  )
  const weight = days.reduce((sum, day) => sum + day.checks, 0)
  return weight
    ? monitorDuration(
        Math.round(
          days.reduce((sum, day) => sum + day.avg_ms * day.checks, 0) / weight
        )
      )
    : null
})

const incidents = useLoadMore(
  async page => (await monitorApi.incidents(appId.value, page)).data
)
const checks = useLoadMore(
  async page => (await monitorApi.checks(appId.value, page)).data
)

function fillForm(settings = {}) {
  form.enabled = settings.enabled !== false
  form.interval_minutes =
    settings.interval_minutes ?? detail.value?.intervals?.[0] ?? null
  form.notify_email = settings.notify_email === true
  form.notify_recovery = settings.notify_recovery === true
}

// Each detail request gets a number; only the latest one may fill the page, so a late
// answer for app 7 never lands on app 8.
let requestSeq = 0
async function load({ silent = false } = {}) {
  // Silent refreshes never cancel the main load; they are dropped if a newer one starts.
  const seq = silent ? requestSeq : ++requestSeq
  if (!silent) {
    loading.value = true
    notFound.value = false
    error.value = ''
  }
  try {
    const data = (await monitorApi.show(appId.value)).data.data
    if (seq !== requestSeq) return false
    detail.value = data
    if (!silent) fillForm(data.settings)
    return true
  } catch (e) {
    if (seq !== requestSeq || silent) return false
    detail.value = null
    if (e.response?.status === 404) notFound.value = true
    else error.value = apiMessage(e)
    return false
  } finally {
    if (!silent && seq === requestSeq) loading.value = false
  }
}

// After "Vérifier maintenant", poll until a newer check is recorded (the server runs it right
// after answering), then show its result. Stops on app change, unmount or after POLL_LIMIT_MS.
const POLL_MS = 4000
const POLL_LIMIT_MS = 90000
let pollTimer = null
function stopPolling() {
  clearTimeout(pollTimer)
  pollTimer = null
  waitingResult.value = false
}

function checkResultNotice(monitor) {
  const status = monitorStatus(monitor.state)
  const parts = [status.label]
  if (monitor.response_ms !== null && monitor.response_ms !== undefined)
    parts.push(monitorDuration(monitor.response_ms))
  const tone =
    monitor.state === 'up'
      ? 'positive'
      : monitor.state === 'unknown'
        ? 'info'
        : 'warning'
  return {
    tone,
    text: ui('Vérification terminée : {p0}', { p0: parts.join(' · ') })
  }
}

function watchForResult(id, since) {
  stopPolling()
  waitingResult.value = true
  const started = Date.now()
  const tick = async () => {
    if (id !== appId.value) return stopPolling()
    await load({ silent: true })
    if (id !== appId.value) return stopPolling()
    const monitor = detail.value?.monitor
    if (monitor?.last_checked_at && monitor.last_checked_at !== since) {
      stopPolling()
      void checks.reload()
      void incidents.reload()
      checkNotice.value = checkResultNotice(monitor)
      $q.notify({
        type: checkNotice.value.tone,
        message: checkNotice.value.text
      })
      return
    }
    if (Date.now() - started >= POLL_LIMIT_MS) {
      stopPolling()
      checkNotice.value = {
        tone: 'info',
        text: ui(
          'La vérification prend plus de temps que prévu. Son résultat apparaîtra dans l’historique dès qu’il sera enregistré.'
        )
      }
      return
    }
    pollTimer = setTimeout(tick, POLL_MS)
  }
  pollTimer = setTimeout(tick, POLL_MS)
}

function resetForApp() {
  stopPolling()
  detail.value = null
  checkNotice.value = null
  selectedDay.value = null
  tab.value = 'incidents'
  Object.assign(form, emptyForm())
}

async function loadAll() {
  resetForApp()
  if (await load()) {
    void incidents.reload()
    void checks.reload()
  }
}

async function saveSettings() {
  const id = appId.value
  saving.value = true
  const payload = {
    enabled: form.enabled,
    interval_minutes: form.interval_minutes,
    notify_email: form.notify_email,
    notify_recovery: form.notify_email && form.notify_recovery
  }
  try {
    const { data } = await monitorApi.saveSettings(id, payload)
    if (id !== appId.value) return
    detail.value = { ...detail.value, settings: data.data }
    fillForm(data.data)
    $q.notify({ type: 'positive', message: ui('Préférences enregistrées.') })
    void load({ silent: true })
  } catch (e) {
    $q.notify({ type: 'negative', message: apiMessage(e) })
  } finally {
    saving.value = false
  }
}

async function checkNow() {
  const id = appId.value
  checking.value = true
  checkNotice.value = null
  try {
    const since = detail.value?.monitor?.last_checked_at ?? null
    await monitorApi.check(id)
    if (id !== appId.value) return
    checkNotice.value = { tone: 'info', text: ui('Vérification en cours…') }
    watchForResult(id, since)
  } catch (e) {
    if (id !== appId.value) return
    const statusCode = e.response?.status
    // 409: a check is already queued — information, not a failure.
    const tone = statusCode === 409 ? 'info' : 'warning'
    const text = statusCode === 429 ? throttledMessage(e) : apiMessage(e)
    checkNotice.value = { tone, text }
    $q.notify({ type: tone, message: text })
    // A check of this app is already queued: wait for its result too.
    if (statusCode === 409)
      watchForResult(id, detail.value?.monitor?.last_checked_at ?? null)
    // 422: monitoring was turned off or the app became unmonitorable elsewhere.
    if (statusCode === 422) void load({ silent: true })
  } finally {
    checking.value = false
  }
}

// Retry-After (seconds) gives the exact wait when the server sends it.
function throttledMessage(e) {
  const seconds = Number(e.response?.headers?.['retry-after'])
  if (Number.isFinite(seconds) && seconds >= 60)
    return ui(
      'Une vérification manuelle a déjà été lancée récemment. Réessayez dans {n} min.',
      { n: Math.ceil(seconds / 60) }
    )
  if (Number.isFinite(seconds) && seconds > 0)
    return ui(
      'Une vérification manuelle a déjà été lancée récemment. Réessayez dans moins d’une minute.'
    )
  return ui(
    'Une vérification manuelle a déjà été lancée récemment. Réessayez un peu plus tard.'
  )
}

watch(appId, loadAll, { immediate: true })
onBeforeUnmount(stopPolling)
</script>
<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  color: var(--pwa-link);
  font-weight: 600;
  text-decoration: none;
}
.back-link:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 3px;
  border-radius: 6px;
}
.detail-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--outline);
}
.app-icon {
  flex: none;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  object-fit: cover;
}
.head-text {
  display: grid;
  gap: 4px;
  flex: 1 1 240px;
  min-width: 0;
}
.app-url {
  color: var(--muted);
  overflow-wrap: anywhere;
}
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}
.head-actions {
  display: grid;
  justify-items: start;
  gap: 6px;
  flex: 0 1 260px;
}
.head-actions small {
  color: var(--muted);
}
.head-text h1 {
  overflow-wrap: anywhere;
}
.head-actions small.check-notice {
  --notice-color: var(--q-positive);
  color: var(--text);
  padding: 6px 10px;
  background: color-mix(in srgb, var(--notice-color) 14%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--notice-color) 35%, transparent);
  border-radius: 10px;
}
.check-notice.notice-info {
  --notice-color: var(--q-info);
}
.check-notice.notice-warning {
  --notice-color: var(--q-warning);
}
.not-monitorable {
  margin-bottom: 16px;
}
.chart-note,
.day-detail {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}
.info-note {
  margin-bottom: 16px;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 12px;
}
.kpi {
  display: grid;
  align-content: start;
  justify-items: start;
  gap: 8px;
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
.uptime {
  display: grid;
  gap: 6px;
  width: 100%;
  margin: 0;
}
.uptime > div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.uptime dt {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
.uptime dd {
  display: grid;
  justify-items: end;
  margin: 0;
}
.uptime dd small {
  font-size: 11px;
}
.chart-title {
  margin: 0 0 10px;
  font-size: 13px;
}
.day-strip {
  display: grid;
  grid-template-columns: repeat(30, minmax(0, 1fr));
  gap: 3px;
  height: 56px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.day-strip li {
  display: flex;
}
.day {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 3px;
  cursor: pointer;
}
.day:focus-visible {
  outline: 3px solid var(--pwa-primary);
  outline-offset: 2px;
}
.day[aria-pressed='true'] {
  box-shadow: 0 0 0 2px var(--text);
}
.day-positive {
  background: var(--q-positive);
}
.day-warning {
  background: var(--q-warning);
}
.day-negative {
  background: var(--q-negative);
}
.day-neutral {
  background: var(--pwa-chart-grid, var(--outline));
}
.strip-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  color: var(--muted);
  font-size: 11px;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin: 10px 0 0;
  font-size: 12px;
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.legend i {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
.panels {
  background: transparent;
}
.row-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.error-text {
  overflow-wrap: anywhere;
}
.settings-form {
  display: grid;
  gap: 12px;
  max-width: 560px;
}
.interval-select {
  max-width: 320px;
}
@media (max-width: 700px) {
  .day-strip {
    gap: 2px;
  }
}
</style>
