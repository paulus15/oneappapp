<template>
  <q-page class="admin-page">
    <q-btn
      flat
      no-caps
      color="primary"
      to="/admin/developers"
      label="Vérifier les développeurs"
      class="q-mb-md"
    />
    <div class="admin-hero q-mb-lg">
      <div>
        <span class="admin-eyebrow"
          ><q-icon name="shield" /> Centre de contrôle</span
        >
        <h1 class="admin-title">Administration PWA Store</h1>
        <div class="admin-subtitle">
          Modération des applications (PWA Store), Surveillance de sécurité (PWA
          Store Security) et Analytics (PWA Store Analytics)
        </div>
      </div>
      <div class="system-status"
        ><span /> Tous les services sont opérationnels</div
      >
    </div>

    <div v-if="loading" class="row justify-center q-my-xl">
      <q-spinner-orbit color="primary" size="48px" />
    </div>

    <div v-else class="row q-col-gutter-md">
      <!-- Applications List -->
      <div class="col-12 col-lg-7">
        <q-card class="glass-panel admin-card">
          <div class="text-subtitle1 text-white text-weight-bold q-mb-md"
            >Modération PWA Store</div
          >
          <q-list separator>
            <q-item v-for="app in apps" :key="app.id" class="q-py-sm">
              <q-item-section avatar>
                <q-avatar
                  size="36px"
                  class="bg-blue-grey-900 border-blue-grey-sm rounded-borders"
                >
                  <AppIcon
                    :src="app.icon_url"
                    :alt="`Icône de ${app.name}`"
                    fallback-icon="apps"
                  />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <div class="row items-center q-gutter-xs">
                  <span class="text-weight-bold text-white text-subtitle2">{{
                    app.name
                  }}</span>
                  <q-badge :color="getStatusColor(app.status)" dense>{{
                    app.status
                  }}</q-badge>
                </div>
                <div class="text-caption text-blue-grey-300">
                  Développeur : {{ app.developer?.name }} | ID:
                  {{ app.identifier }}
                </div>
              </q-item-section>

              <q-item-section side class="q-gutter-xs row no-wrap">
                <div class="row q-gutter-xs">
                  <q-btn
                    v-if="app.status !== 'approved'"
                    color="green-6"
                    icon="check"
                    dense
                    round
                    size="sm"
                    @click="updateAppStatus(app, 'approved')"
                  >
                    <q-tooltip>Approuver l'application</q-tooltip>
                  </q-btn>
                  <q-btn
                    v-if="app.status !== 'quarantined'"
                    color="red-7"
                    icon="security"
                    dense
                    round
                    size="sm"
                    @click="updateAppStatus(app, 'quarantined')"
                  >
                    <q-tooltip
                      >Mettre en quarantaine (PWA Store Security)</q-tooltip
                    >
                  </q-btn>
                  <q-btn
                    color="primary"
                    icon="analytics"
                    dense
                    round
                    size="sm"
                    @click="selectAppForAnalytics(app)"
                  >
                    <q-tooltip
                      >Voir les statistiques (PWA Store Analytics)</q-tooltip
                    >
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Live Analytics Sidebar (PWA Store Analytics) -->
      <div class="col-12 col-lg-5">
        <q-card v-if="selectedApp" class="glass-panel admin-card">
          <div class="row items-center q-gutter-sm q-mb-md">
            <q-avatar
              size="32px"
              class="bg-blue-grey-900 border-blue-grey-sm rounded-borders"
            >
              <AppIcon
                :src="selectedApp.icon_url"
                :alt="`Icône de ${selectedApp.name}`"
                fallback-icon="apps"
              />
            </q-avatar>
            <div>
              <div class="text-subtitle1 text-white text-weight-bold">{{
                selectedApp.name
              }}</div>
              <div class="text-caption text-blue-grey-400"
                >Statistiques de fonctionnement</div
              >
            </div>
          </div>

          <div v-if="loadingStats" class="row justify-center q-my-xl">
            <q-spinner-dots color="primary" size="48px" />
          </div>

          <div v-else-if="stats" class="q-gutter-md">
            <!-- Stats cards -->
            <div class="row q-col-gutter-xs">
              <div class="col-6">
                <div class="stats-box">
                  <div class="stats-value">{{ stats.total_installations }}</div>
                  <div class="stats-label">Installations</div>
                </div>
              </div>
              <div class="col-6">
                <div class="stats-box">
                  <div class="stats-value">{{ stats.total_launches }}</div>
                  <div class="stats-label">Lancements</div>
                </div>
              </div>
              <div class="col-6">
                <div class="stats-box">
                  <div class="stats-value text-red-400">{{
                    stats.total_crashes
                  }}</div>
                  <div class="stats-label">Crashs</div>
                </div>
              </div>
              <div class="col-6">
                <div class="stats-box">
                  <div class="stats-value text-orange-400">{{
                    stats.crashes_ratio
                  }}</div>
                  <div class="stats-label">Ratio de crash</div>
                </div>
              </div>
            </div>

            <!-- Platform breakdown -->
            <div class="q-mt-md">
              <div class="text-subtitle2 text-blue-grey-300 q-mb-xs"
                >Répartition par plateforme</div
              >
              <q-list separator class="sidebar-list overflow-hidden">
                <q-item
                  v-for="item in stats.installations_by_platform"
                  :key="item.platform"
                >
                  <q-item-section avatar>
                    <q-icon
                      :name="getPlatformIcon(item.platform)"
                      color="blue-grey-300"
                    />
                  </q-item-section>
                  <q-item-section class="text-capitalize">{{
                    item.platform
                  }}</q-item-section>
                  <q-item-section side class="text-white text-weight-bold">{{
                    item.total
                  }}</q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Top devices -->
            <div class="q-mt-md">
              <div class="text-subtitle2 text-blue-grey-300 q-mb-xs"
                >Appareils les plus utilisés</div
              >
              <q-list separator class="sidebar-list overflow-hidden">
                <q-item
                  v-for="device in stats.top_devices"
                  :key="device.device_model"
                >
                  <q-item-section>{{
                    device.device_model || 'Inconnu'
                  }}</q-item-section>
                  <q-item-section side class="text-blue-grey-300 font-mono"
                    >{{ device.count }} ouvertures</q-item-section
                  >
                </q-item>
              </q-list>
            </div>

            <!-- Security controls -->
            <div class="q-mt-md">
              <div class="text-subtitle2 text-blue-grey-300 q-mb-xs"
                >Contrôles de Confiance (PWA Store Security)</div
              >
              <div class="row items-center q-col-gutter-sm">
                <div class="col-8">
                  <q-slider
                    v-model="trustScoreSlider"
                    :min="0"
                    :max="100"
                    label
                    color="green"
                  />
                </div>
                <div class="col-4">
                  <q-btn
                    label="Mettre à jour"
                    color="green"
                    size="sm"
                    unelevated
                    no-caps
                    class="full-width text-white text-weight-bold"
                    @click="updateTrustScore"
                  />
                </div>
              </div>
            </div>
          </div>
        </q-card>

        <q-card
          v-else
          class="glass-panel admin-card text-center flex flex-center"
          style="height: 300px"
        >
          <div class="text-blue-grey-400">
            <q-icon name="query_stats" size="48px" class="q-mb-md" />
            <div
              >Sélectionnez une application pour charger les rapports
              analytiques et contrôler la sécurité.</div
            >
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/boot/axios'
import { useQuasar } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'

const $q = useQuasar()
const apps = ref([])
const loading = ref(true)

const selectedApp = ref(null)
const stats = ref(null)
const loadingStats = ref(false)
const trustScoreSlider = ref(100)

async function fetchApps() {
  loading.value = true
  try {
    const response = await api.get('/admin/apps')
    apps.value = response.data
  } catch (err) {
    console.error('Error fetching admin apps', err)
  } finally {
    loading.value = false
  }
}

async function updateAppStatus(app, newStatus) {
  try {
    const reason = await new Promise(resolve =>
      $q
        .dialog({
          title: 'Motif de décision',
          prompt: {
            model: '',
            type: 'textarea',
            isValid: value => value.trim().length >= 3
          },
          cancel: true
        })
        .onOk(resolve)
        .onCancel(() => resolve(null))
    )
    if (!reason) return
    await api.post(`/admin/apps/${app.id}/review`, {
      status: newStatus,
      reason
    })
    $q.notify({
      type: 'positive',
      message: `Statut mis à jour : ${newStatus}`
    })
    await fetchApps()
    if (selectedApp.value && selectedApp.value.id === app.id) {
      selectedApp.value.status = newStatus
    }
  } catch (err) {
    console.error('Error updating status', err)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la mise à jour'
    })
  }
}

async function selectAppForAnalytics(app) {
  selectedApp.value = app
  loadingStats.value = true
  trustScoreSlider.value = app.trust_score
  try {
    const response = await api.get(`/analytics/summary/${app.id}`)
    stats.value = response.data
  } catch (err) {
    console.error('Error fetching analytics', err)
  } finally {
    loadingStats.value = false
  }
}

async function updateTrustScore() {
  if (!selectedApp.value) return
  try {
    await api.put(`/apps/${selectedApp.value.id}`, {
      trust_score: trustScoreSlider.value
    })
    $q.notify({
      type: 'positive',
      message: 'Score de confiance mis à jour avec succès.'
    })
    selectedApp.value.trust_score = trustScoreSlider.value
    await fetchApps()
  } catch (err) {
    console.error('Error updating trust score', err)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la mise à jour du score de confiance'
    })
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'approved':
      return 'green-7'
    case 'quarantined':
      return 'red-7'
    default:
      return 'orange-7'
  }
}

function getPlatformIcon(platform) {
  switch (platform.toLowerCase()) {
    case 'android':
      return 'phone_android'
    case 'iphone':
    case 'ios':
      return 'phone_iphone'
    case 'mac':
      return 'desktop_mac'
    case 'windows':
      return 'desktop_windows'
    default:
      return 'language'
  }
}

onMounted(() => {
  fetchApps()
})
</script>

<style scoped lang="scss">
.admin-page {
  background: var(--page);
  color: var(--text);
  padding: 18px var(--ui-page-gutter) 28px;
}
.admin-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  padding: 18px;
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 16px;
  box-shadow: var(--ui-shadow-sm);
}
.admin-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
  color: var(--pwa-link);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.admin-title {
  color: var(--text);
  font-size: clamp(23px, 2.5vw, 32px);
  font-weight: 800;
  margin: 0;
}
.admin-subtitle {
  color: var(--muted);
  max-width: 720px;
  font-size: 11px;
  line-height: 1.6;
  margin-top: 4px;
}
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
.system-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  padding: 8px 11px;
  color: var(--muted);
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 999px;
  font-size: 9px;
  font-weight: 700;
}
.system-status span {
  width: 7px;
  height: 7px;
  background: var(--q-positive);
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(52, 201, 138, 0.12);
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
.admin-hero.q-mb-lg {
  margin-bottom: 16px;
}
@media (max-width: 700px) {
  .admin-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 15px;
  }
  .system-status {
    white-space: normal;
  }
  .admin-card {
    padding: 14px;
  }
}
</style>
