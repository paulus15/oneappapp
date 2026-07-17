<template>
  <q-page class="admin-page">
    <div class="q-mb-lg">
      <h1 class="admin-title">Console d'Administration OneApp</h1>
      <div class="admin-subtitle">
        Modération des applications (OneStore), Surveillance de sécurité (OneShield) et Analytics (OneAnalytics)
      </div>
    </div>

    <div v-if="loading" class="row justify-center q-my-xl">
      <q-spinner-orbit color="indigo" size="48px" />
    </div>

    <div v-else class="row q-col-gutter-md">
      <!-- Applications List -->
      <div class="col-12 col-lg-7">
        <q-card class="glass-panel admin-card">
          <div class="text-subtitle1 text-white text-weight-bold q-mb-md">Modération OneStore</div>
          <q-list dark separator>
            <q-item v-for="app in apps" :key="app.id" class="q-py-sm">
              <q-item-section avatar>
                <q-avatar size="36px" class="bg-indigo-900 border-indigo-sm rounded-borders">
                  <q-img
                    :src="
                      app.icon_url ||
                      'https://cdn-icons-png.flaticon.com/512/8422/8422116.png'
                    "
                  />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <div class="row items-center q-gutter-xs">
                  <span class="text-weight-bold text-white text-subtitle2">{{ app.name }}</span>
                  <q-badge :color="getStatusColor(app.status)" dense>{{ app.status }}</q-badge>
                </div>
                <div class="text-caption text-indigo-300">
                  Développeur : {{ app.developer?.name }} | ID: {{ app.identifier }}
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
                    <q-tooltip>Mettre en quarantaine (OneShield)</q-tooltip>
                  </q-btn>
                  <q-btn
                    color="indigo"
                    icon="analytics"
                    dense
                    round
                    size="sm"
                    @click="selectAppForAnalytics(app)"
                  >
                    <q-tooltip>Voir les statistiques (OneAnalytics)</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Live Analytics Sidebar (OneAnalytics) -->
      <div class="col-12 col-lg-5">
        <q-card v-if="selectedApp" class="glass-panel admin-card">
          <div class="row items-center q-gutter-sm q-mb-md">
            <q-avatar size="32px" class="bg-indigo-900 border-indigo-sm rounded-borders">
              <q-img
                :src="
                  selectedApp.icon_url ||
                  'https://cdn-icons-png.flaticon.com/512/8422/8422116.png'
                "
              />
            </q-avatar>
            <div>
              <div class="text-subtitle1 text-white text-weight-bold">{{ selectedApp.name }}</div>
              <div class="text-caption text-indigo-400">Statistiques de fonctionnement</div>
            </div>
          </div>

          <div v-if="loadingStats" class="row justify-center q-my-xl">
            <q-spinner-dots color="indigo" size="48px" />
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
                  <div class="stats-value text-red-400">{{ stats.total_crashes }}</div>
                  <div class="stats-label">Crashs</div>
                </div>
              </div>
              <div class="col-6">
                <div class="stats-box">
                  <div class="stats-value text-orange-400">{{ stats.crashes_ratio }}</div>
                  <div class="stats-label">Ratio de crash</div>
                </div>
              </div>
            </div>

            <!-- Platform breakdown -->
            <div class="q-mt-md">
              <div class="text-subtitle2 text-indigo-300 q-mb-xs">Répartition par plateforme</div>
              <q-list dark separator class="sidebar-list overflow-hidden">
                <q-item v-for="item in stats.installations_by_platform" :key="item.platform">
                  <q-item-section avatar>
                    <q-icon :name="getPlatformIcon(item.platform)" color="indigo-300" />
                  </q-item-section>
                  <q-item-section class="text-capitalize">{{ item.platform }}</q-item-section>
                  <q-item-section side class="text-white text-weight-bold">{{ item.total }}</q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Top devices -->
            <div class="q-mt-md">
              <div class="text-subtitle2 text-indigo-300 q-mb-xs">Appareils les plus utilisés</div>
              <q-list dark separator class="sidebar-list overflow-hidden">
                <q-item v-for="device in stats.top_devices" :key="device.device_model">
                  <q-item-section>{{ device.device_model || 'Inconnu' }}</q-item-section>
                  <q-item-section side class="text-indigo-300 font-mono">{{ device.count }} ouvertures</q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Security controls -->
            <div class="q-mt-md">
              <div class="text-subtitle2 text-indigo-300 q-mb-xs">Contrôles de Confiance (OneShield)</div>
              <div class="row items-center q-col-gutter-sm">
                <div class="col-8">
                  <q-slider v-model="trustScoreSlider" :min="0" :max="100" label color="green" dark />
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

        <q-card v-else class="glass-panel admin-card text-center flex flex-center" style="height: 300px">
          <div class="text-indigo-400">
            <q-icon name="query_stats" size="48px" class="q-mb-md" />
            <div>Sélectionnez une application pour charger les rapports analytiques et contrôler la sécurité.</div>
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
    await api.post(`/apps/${app.id}/status`, { status: newStatus })
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
    const response = await api.get(`/analytics/apps/${app.id}`)
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
    await api.post(`/apps/${selectedApp.value.id}/trust`, {
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
  padding: 20px 24px;
}
.admin-title {
  color: var(--text);
  font-size: 22px;
  font-weight: 800;
  margin: 0;
}
.admin-subtitle {
  color: var(--muted);
  font-size: 13px;
  margin-top: 4px;
}
.admin-card {
  background: var(--glass);
  border: 1px solid var(--outline);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 12px 30px rgba(4, 9, 25, 0.06);
}
.stats-box {
  background: var(--surface-low);
  border: 1px solid var(--outline);
  padding: 12px;
  border-radius: 8px;
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
  border-radius: 8px;
}
</style>
