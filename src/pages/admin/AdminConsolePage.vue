<template>
  <q-page class="admin-page">
    <div class="admin-hero q-mb-lg">
      <div>
        <span class="admin-eyebrow"
          ><q-icon name="shield" /> {{ ui('Administration') }}</span
        >
        <h1 class="admin-title">{{ ui('Modération des applications') }}</h1>
        <div class="admin-subtitle">
          {{
            ui(
              'Chaque décision exige un motif et rejoint l’historique de l’application et le journal d’audit. Une application approuvée n’est visible qu’après sa publication par l’éditeur.'
            )
          }}
        </div>
      </div>
    </div>
    <AdminNav />

    <div class="filters row q-col-gutter-sm q-mb-md">
      <div class="col-12 col-sm-6 col-md-4">
        <q-select
          v-model="filters.status"
          :options="statusOptions"
          emit-value
          map-options
          clearable
          outlined
          dense
          :label="ui('Statut')"
          @update:model-value="reload"
        />
      </div>
      <div class="col-12 col-sm-6 col-md-4">
        <q-input
          v-model="filters.search"
          outlined
          dense
          clearable
          debounce="400"
          :label="ui('Nom ou identifiant')"
          @update:model-value="reload"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
    </div>

    <q-banner v-if="error" class="workspace-alert q-mb-md" role="alert">{{
      ui(error)
    }}</q-banner>

    <div v-if="loading" class="row justify-center q-my-xl">
      <q-spinner-orbit color="primary" size="48px" />
    </div>

    <div v-else class="row q-col-gutter-md">
      <div class="col-12 col-lg-7">
        <q-card class="glass-panel admin-card">
          <q-list separator>
            <q-item
              v-for="app in apps"
              :key="app.id"
              clickable
              :active="selectedApp?.id === app.id"
              class="q-py-sm"
              @click="select(app)"
            >
              <q-item-section avatar>
                <q-avatar size="36px" class="rounded-borders">
                  <AppIcon
                    :src="app.icon_url"
                    :alt="ui('Icône de {p0}', { p0: app.name })"
                    fallback-icon="apps"
                  />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <div class="row items-center q-gutter-xs">
                  <span class="text-weight-bold text-subtitle2">{{
                    app.name
                  }}</span>
                  <q-badge :color="statusColor(app.status)">{{
                    statusLabel(app.status)
                  }}</q-badge>
                  <q-badge v-if="app.is_featured" color="amber-8">{{
                    ui('À la une')
                  }}</q-badge>
                </div>
                <div class="text-caption text-muted">
                  {{ app.developer?.name }} ·
                  {{
                    app.developer?.developer_profile?.status === 'verified'
                      ? ui('éditeur vérifié')
                      : ui('éditeur non vérifié')
                  }}
                  · {{ app.source_type === 'url' ? 'URL' : ui('Build') }} ·
                  {{ app.identifier }}
                </div>
              </q-item-section>
            </q-item>
          </q-list>
          <p v-if="!apps.length" class="q-mt-md">{{
            ui('Aucune application pour ce filtre.')
          }}</p>
          <q-pagination
            v-if="lastPage > 1"
            v-model="page"
            :max="lastPage"
            class="q-mt-md"
            @update:model-value="fetchApps"
          />
        </q-card>
      </div>

      <div class="col-12 col-lg-5">
        <q-card v-if="selectedApp" class="glass-panel admin-card">
          <div class="row items-center q-gutter-sm q-mb-md">
            <div class="col">
              <div class="text-subtitle1 text-weight-bold">{{
                selectedApp.name
              }}</div>
              <q-badge :color="statusColor(selectedApp.status)">{{
                statusLabel(selectedApp.status)
              }}</q-badge>
            </div>
            <q-btn
              v-if="selectedApp.open_request_id"
              unelevated
              dense
              no-caps
              color="primary"
              icon="fact_check"
              :label="t('requests.openDossier')"
              :to="`/admin/requests/${selectedApp.open_request_id}`"
            />
            <q-btn
              v-else-if="selectedApp.status === 'published'"
              flat
              dense
              no-caps
              icon="storefront"
              :label="t('workspace.viewInStore')"
              :to="`/apps/${selectedApp.id}`"
            />
          </div>
          <p v-if="selectedApp.moderation_reason" class="text-caption"
            >{{ ui('Dernier motif :') }} {{ selectedApp.moderation_reason }}</p
          >

          <div class="workspace-actions q-mb-md">
            <q-btn
              v-for="decision in selectedApp.open_request_id
                ? []
                : adminDecisions(selectedApp.status)"
              :key="decision.to"
              outline
              no-caps
              dense
              :icon="decision.icon"
              :label="decision.label"
              :disable="busy"
              @click="decide(decision)"
            />
            <q-btn
              v-if="selectedApp.status !== 'archived'"
              flat
              no-caps
              dense
              color="negative"
              icon="archive"
              :label="ui('Archiver')"
              :disable="busy"
              @click="archive"
            />
          </div>

          <template v-if="canManageCatalog">
            <q-toggle
              :model-value="!!selectedApp.is_featured"
              :label="ui('Mettre à la une')"
              :disable="busy"
              @update:model-value="setFeatured"
            />
            <div class="text-subtitle2 q-mt-md q-mb-xs">{{
              ui('Score de confiance (indicateur interne)')
            }}</div>
            <div class="row items-center q-col-gutter-sm">
              <div class="col-8">
                <q-slider
                  v-model="trustScoreSlider"
                  :min="0"
                  :max="100"
                  label
                />
              </div>
              <div class="col-4">
                <q-btn
                  :label="ui('Enregistrer')"
                  color="primary"
                  size="sm"
                  unelevated
                  no-caps
                  class="full-width"
                  :disable="busy"
                  @click="updateTrustScore"
                />
              </div>
            </div>
          </template>

          <div v-if="stats" class="row q-col-gutter-xs q-mt-md">
            <div class="col-6">
              <div class="stats-box">
                <div class="stats-value">{{ stats.total_installations }}</div>
                <div class="stats-label"
                  >{{ ui('Installations déclarées')
                  }}<InstallCountHelp kind="declared"
                /></div>
              </div>
            </div>
            <div class="col-6">
              <div class="stats-box">
                <div class="stats-value">{{ stats.total_launches }}</div>
                <div class="stats-label">{{ ui('Ouvertures') }}</div>
              </div>
            </div>
          </div>

          <div class="text-subtitle2 q-mt-md q-mb-xs">{{
            ui('Historique')
          }}</div>
          <q-list separator dense class="sidebar-list">
            <q-item v-for="event in events" :key="event.id">
              <q-item-section>
                <q-item-label>{{ statusLabel(event.action) }}</q-item-label>
                <q-item-label caption
                  >{{
                    new Date(event.created_at).toLocaleString(currentLocale())
                  }}
                  ·
                  {{
                    event.actor?.name || ui('Contrôle automatique')
                  }}</q-item-label
                >
                <q-item-label v-if="event.reason" caption>{{
                  event.reason
                }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-if="!events.length"
              ><q-item-section caption>{{
                ui('Aucun événement enregistré.')
              }}</q-item-section></q-item
            >
          </q-list>
        </q-card>
        <q-card
          v-else
          class="glass-panel admin-card text-center flex flex-center"
          style="height: 300px"
        >
          <div class="text-muted">
            <q-icon name="rule" size="48px" class="q-mb-md" />
            <div>{{ ui('Sélectionnez une application pour la modérer.') }}</div>
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import InstallCountHelp from '@/components/InstallCountHelp.vue'
import { currentLocale } from '@/i18n'
import { ui } from '@/i18n/text'

import { useI18n } from 'vue-i18n'
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import AdminNav from '@/components/AdminNav.vue'
import { adminApi } from '@/services/admin'
import { accountApi, apiMessage } from '@/services/account'
import { useAuthStore } from '@/stores/auth'
import {
  adminDecisions,
  APP_STATUS,
  statusColor,
  statusLabel
} from '@/utils/appStatus'

const { t } = useI18n()
const $q = useQuasar(),
  auth = useAuthStore()
const apps = ref([]),
  page = ref(1),
  lastPage = ref(1),
  loading = ref(true),
  busy = ref(false),
  error = ref(''),
  selectedApp = ref(null),
  stats = ref(null),
  events = ref([]),
  trustScoreSlider = ref(100)
const filters = reactive({ status: 'submitted', search: '' })
const statusOptions = Object.entries(APP_STATUS).map(([value, s]) => ({
  value,
  get label() {
    return s.label
  }
}))
const canManageCatalog = computed(() =>
  auth.user?.admin_permissions?.includes('catalog.manage')
)

async function fetchApps() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await adminApi.apps({
      page: page.value,
      status: filters.status || undefined,
      search: filters.search || undefined
    })
    apps.value = data.data
    lastPage.value = data.last_page
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
function reload() {
  page.value = 1
  selectedApp.value = null
  return fetchApps()
}
async function select(app) {
  selectedApp.value = app
  trustScoreSlider.value = app.trust_score ?? 100
  stats.value = null
  events.value = []
  try {
    const [summary, history] = await Promise.all([
      accountApi.analytics(app.id),
      accountApi.appEvents(app.id)
    ])
    stats.value = summary.data
    events.value = history.data.data
  } catch (e) {
    error.value = apiMessage(e)
  }
}
async function run(action, message) {
  busy.value = true
  error.value = ''
  try {
    const { data } = await action()
    $q.notify({ type: 'positive', message })
    const id = selectedApp.value?.id
    await fetchApps()
    const fresh = apps.value.find(a => a.id === id)
    if (fresh) await select(fresh)
    else if (data?.id) selectedApp.value = { ...selectedApp.value, ...data }
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
function askReason(title, required = true) {
  return new Promise(resolve =>
    $q
      .dialog({
        title,
        get message() {
          return ui('Ce motif est visible par l’éditeur et conservé.')
        },
        prompt: {
          model: '',
          type: 'textarea',
          isValid: v => !required || v.trim().length >= 3
        },
        cancel: true,
        persistent: true
      })
      .onOk(resolve)
      .onCancel(() => resolve(null))
  )
}
async function decide(decision) {
  const reason = decision.reason ? await askReason(decision.label) : undefined
  if (decision.reason && !reason) return
  return run(
    () =>
      adminApi.review(selectedApp.value.id, { status: decision.to, reason }),
    ui('Décision enregistrée : {p0}.', { p0: statusLabel(decision.to) })
  )
}
async function archive() {
  const reason = await askReason(ui('Archiver l’application'), false)
  if (reason === null) return
  return run(
    () => adminApi.archive(selectedApp.value.id, reason || undefined),
    ui('Application archivée.')
  )
}
function setFeatured(value) {
  return run(
    () => adminApi.catalog(selectedApp.value.id, { is_featured: value }),
    value
      ? ui('Application mise à la une.')
      : ui('Application retirée de la une.')
  )
}
function updateTrustScore() {
  return run(
    () =>
      adminApi.catalog(selectedApp.value.id, {
        trust_score: trustScoreSlider.value
      }),
    ui('Score de confiance enregistré.')
  )
}
onMounted(fetchApps)
</script>

<style scoped lang="scss">
.admin-card {
  background: var(--glass);
  border: 1px solid var(--outline);
  border-radius: 16px;
  padding: 15px;
  box-shadow: var(--ui-shadow-sm);
  transition:
    border-color 0.2s ease,
    transform 0.25s var(--ui-ease);
}
.admin-card:hover {
  border-color: color-mix(in srgb, var(--primary) 24%, var(--outline));
}
.admin-card :deep(.text-white) {
  color: var(--text) !important;
}
.admin-card :deep(.text-blue-grey-300),
.admin-card :deep(.text-blue-grey-400) {
  color: var(--muted) !important;
}
.admin-card :deep(.q-list--dark) {
  color: var(--text);
}
.admin-card :deep(.q-item) {
  min-height: 50px;
  border-radius: 10px;
  transition: background-color 0.18s ease;
}
.admin-card :deep(.q-item:hover) {
  background: var(--surface-high);
}
.stats-box {
  background: var(--surface-low);
  border: 1px solid var(--outline);
  padding: 12px;
  border-radius: 12px;
  text-align: center;
}
.stats-value {
  color: var(--text);
  font-size: 20px;
  font-weight: 800;
}
.stats-label {
  color: var(--muted);
  font-size: 10px;
}
.sidebar-list {
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 12px;
}
@media (max-width: 700px) {
  .admin-card {
    padding: 14px;
  }
}
</style>
