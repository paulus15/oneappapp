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
                <div
                  v-if="app.official_site_url || app.external_url"
                  class="text-caption text-primary ellipsis q-mt-xs"
                >
                  <q-icon name="public" size="13px" class="q-mr-xs" />
                  {{ app.official_site_url || app.external_url }}
                </div>
                <div
                  v-if="app.status === 'draft' && app.last_reminded_at"
                  class="text-caption text-amber-9 q-mt-xs"
                >
                  <q-icon name="mark_email_read" size="13px" class="q-mr-xs" />
                  {{
                    ui('Rappelé le {p0}', {
                      p0: new Date(app.last_reminded_at).toLocaleDateString(
                        currentLocale()
                      )
                    })
                  }}
                </div>
              </q-item-section>
            </q-item>
          </q-list>
          <EmptyState
            v-if="list.error.value"
            tone="error"
            icon="cloud_off"
            :title="ui('Chargement impossible')"
            ><q-btn flat :label="ui('Réessayer')" @click="fetchApps"
          /></EmptyState>
          <p
            v-if="!loading && !list.error.value && !apps.length"
            class="q-mt-md"
            >{{ ui('Aucune application pour ce filtre.') }}</p
          >
          <LoadMore
            v-if="!loading"
            auto
            :has-more="list.hasMore.value"
            :loading="list.loadingMore.value"
            :error="list.moreError.value"
            :shown="apps.length"
            :total="list.total.value"
            @load="list.loadMore"
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
              v-else
              flat
              dense
              no-caps
              icon="storefront"
              :label="
                selectedApp.status === 'published'
                  ? t('workspace.viewInStore')
                  : ui('Aperçu de la fiche')
              "
              :to="`/apps/${selectedApp.id}`"
            />
          </div>

          <div
            v-if="selectedApp.official_site_url || selectedApp.external_url"
            class="app-urls q-mb-md q-pa-sm rounded-borders"
          >
            <div
              v-if="selectedApp.official_site_url"
              class="row items-center q-gutter-xs text-caption"
            >
              <q-icon name="public" size="16px" color="primary" />
              <span class="text-weight-bold">{{ ui('Lien officiel :') }}</span>
              <a
                v-if="safeExternalUrl(selectedApp.official_site_url)"
                :href="safeExternalUrl(selectedApp.official_site_url)"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary text-weight-bold url-link"
              >
                {{ selectedApp.official_site_url }}
                <q-icon name="open_in_new" size="14px" class="q-ml-xs" />
              </a>
              <span v-else class="text-muted">{{
                selectedApp.official_site_url
              }}</span>
            </div>
            <div
              v-if="
                selectedApp.external_url &&
                selectedApp.external_url !== selectedApp.official_site_url
              "
              class="row items-center q-gutter-xs text-caption"
              :class="{ 'q-mt-xs': selectedApp.official_site_url }"
            >
              <q-icon name="link" size="16px" color="primary" />
              <span class="text-weight-bold">{{ ui('Lien PWA :') }}</span>
              <a
                v-if="safeExternalUrl(selectedApp.external_url)"
                :href="safeExternalUrl(selectedApp.external_url)"
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary url-link"
              >
                {{ selectedApp.external_url }}
                <q-icon name="open_in_new" size="14px" class="q-ml-xs" />
              </a>
              <span v-else class="text-muted">{{
                selectedApp.external_url
              }}</span>
            </div>
          </div>
          <div
            v-else-if="selectedApp.status === 'draft'"
            class="app-urls q-mb-md q-pa-sm rounded-borders text-caption text-muted row items-center"
          >
            <q-icon name="link_off" size="16px" class="q-mr-xs" />
            <span>{{
              ui('Aucun lien officiel enregistré pour ce brouillon.')
            }}</span>
          </div>
          <p
            v-if="
              selectedApp.status === 'draft' && selectedApp.last_reminded_at
            "
            class="text-caption text-muted q-mb-md"
          >
            <q-icon name="mark_email_read" size="14px" class="q-mr-xs" />
            {{
              ui('Dernier rappel envoyé le {p0}', {
                p0: new Date(selectedApp.last_reminded_at).toLocaleDateString(
                  currentLocale()
                )
              })
            }}
          </p>
          <AdminApplicationSubmission
            v-if="canManageCatalog"
            :key="selectedApp.id"
            :application="selectedApp"
            @submitted="fetchApps"
          />
          <p v-if="selectedApp.moderation_reason" class="text-caption"
            >{{ ui('Dernier motif :') }} {{ selectedApp.moderation_reason }}</p
          >

          <div class="workspace-actions q-mb-md">
            <q-btn
              v-if="selectedApp.status === 'draft'"
              outline
              no-caps
              dense
              color="warning"
              icon="mail"
              :label="ui('Rappeler le développeur')"
              :disable="busy || !canRemindApp(selectedApp)"
              @click="remindApp(selectedApp)"
            >
              <q-tooltip v-if="remindAppTooltip(selectedApp)">{{
                remindAppTooltip(selectedApp)
              }}</q-tooltip>
            </q-btn>
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
import LoadMore from '@/components/LoadMore.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useLoadMore } from '@/composables/useLoadMore'
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
import AdminApplicationSubmission from '@/components/AdminApplicationSubmission.vue'
import { useAuthStore } from '@/stores/auth'
import {
  adminDecisions,
  APP_STATUS,
  statusColor,
  statusLabel
} from '@/utils/appStatus'
import { safeExternalUrl } from '@/utils/listing'

const { t } = useI18n()
const $q = useQuasar(),
  auth = useAuthStore()
const list = useLoadMore(
  async page =>
    (
      await adminApi.apps({
        page,
        status: filters.status || undefined,
        search: filters.search || undefined
      })
    ).data
)
const apps = list.items,
  loading = list.loading,
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

const fetchApps = () => {
  error.value = ''
  return list.reload()
}
function reload() {
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

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000

function isOlderThanThreeDays(dateString) {
  if (!dateString) return true
  return Date.now() - new Date(dateString).getTime() >= THREE_DAYS_MS
}

function canRemindApp(app) {
  if (!app || app.status !== 'draft') return false
  if (app.developer_id === auth.user?.id) return false
  if (!isOlderThanThreeDays(app.updated_at)) return false
  if (app.last_reminded_at && !isOlderThanThreeDays(app.last_reminded_at))
    return false
  return true
}

function remindAppTooltip(app) {
  if (!app) return ''
  if (app.developer_id === auth.user?.id) {
    return ui('Un administrateur ne peut pas s’envoyer de rappel.')
  }
  if (!isOlderThanThreeDays(app.updated_at)) {
    return ui('Rappel disponible après 3 jours d’inactivité.')
  }
  if (app.last_reminded_at && !isOlderThanThreeDays(app.last_reminded_at)) {
    return ui('Un rappel a déjà été envoyé au cours des 3 derniers jours.')
  }
  return ''
}

function remindApp(app) {
  const recipient =
    app.developer?.email || app.developer?.name || ui('le développeur')
  $q.dialog({
    title: ui('Envoyer un rappel par e-mail'),
    message: ui(
      'Envoyer un e-mail de rappel au développeur ({email}) pour l’inviter à finaliser et soumettre son application en brouillon ?',
      { email: recipient }
    ),
    cancel: true,
    persistent: true
  }).onOk(async () => {
    busy.value = true
    try {
      const { data } = await adminApi.remindApp(app.id)
      app.last_reminded_at = data?.last_reminded_at || new Date().toISOString()
      $q.notify({
        type: 'positive',
        message: data?.message || ui('E-mail de rappel envoyé au développeur.')
      })
    } catch (e) {
      error.value = apiMessage(e)
    } finally {
      busy.value = false
    }
  })
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
.app-urls {
  background: var(--surface-low);
  border: 1px solid var(--outline);
}
.url-link {
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
@media (max-width: 700px) {
  .admin-card {
    padding: 14px;
  }
}
</style>
