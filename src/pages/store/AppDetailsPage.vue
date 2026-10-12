<template>
  <q-page class="details-page">
    <!-- Back Button -->
    <q-btn
      flat
      no-caps
      icon="arrow_back"
      label="Retour au catalogue"
      class="back-btn"
      to="/"
    />

    <div v-if="loading" class="row justify-center q-my-xl">
      <q-spinner-orbit color="primary" size="48px" />
    </div>

    <div v-else-if="error" class="text-center q-my-xl text-red-400">
      <q-icon name="error" size="48px" />
      <div class="text-h6 q-mt-md">{{ error }}</div>
    </div>

    <div v-else-if="app" class="row q-col-gutter-md">
      <!-- Left side: App Info & Reviews -->
      <div class="col-12 col-md-8">
        <q-card class="glass-panel detail-card q-mb-md">
          <div class="row items-start no-wrap q-mb-md">
            <q-avatar
              size="64px"
              class="q-mr-md bg-blue-grey-900 border-blue-grey-sm shadow-md rounded-borders"
            >
              <AppIcon
                :src="app.icon_url"
                :alt="`Icône de ${app.name}`"
                fallback-icon="apps"
              />
            </q-avatar>
            <div class="col">
              <h1 class="app-title">{{ app.name }}</h1>
              <div class="dev-name">
                Publié par
                <router-link
                  v-if="
                    app.developer?.developer_profile?.status === 'verified' &&
                    app.developer.developer_profile.public_name
                  "
                  :to="`/publishers/${app.developer.developer_profile.id}`"
                  >{{
                    app.developer.developer_profile.public_name
                  }}</router-link
                >
                <span v-else>{{ app.developer?.name }}</span>
              </div>
              <div class="row items-center q-gutter-xs q-mt-xs">
                <q-badge color="blue-grey-9" class="q-py-xs q-px-sm">
                  {{ app.category }}
                </q-badge>
                <HostingBadge :source-type="app.source_type" />
                <q-badge
                  v-if="app.languages?.length"
                  color="blue-grey-7"
                  class="q-py-xs q-px-sm"
                >
                  {{ app.languages.join(', ') }}
                </q-badge>
                <q-btn
                  v-if="isOwnerOrAdmin"
                  outline
                  dense
                  no-caps
                  icon="edit"
                  label="Éditer l'application"
                  color="primary"
                  class="q-ml-xs text-caption text-weight-bold"
                  :to="`/developer/apps/${app.id}/edit`"
                />
              </div>
            </div>
          </div>

          <div class="row q-gutter-sm q-mb-md">
            <q-btn
              flat
              no-caps
              color="primary"
              :icon="favorited ? 'favorite' : 'favorite_border'"
              :label="favorited ? 'Dans vos favoris' : 'Ajouter aux favoris'"
              :class="{ 'motion-pop': popping }"
              @click="addFavorite"
            />
            <q-btn
              flat
              no-caps
              color="primary"
              icon="share"
              label="Partager"
              @click="share"
            />
            <ReportButton
              v-if="app.status === 'published' && !isOwnerOrAdmin"
              target-type="application"
              :target-id="app.id"
            />
          </div>
          <div class="section-title q-mb-xs">Description</div>
          <p class="description-text q-mb-lg">
            {{ app.description }}
          </p>

          <div class="section-title q-mb-xs">Captures d'écran</div>
          <div class="screenshots-section q-mb-lg">
            <p
              v-if="
                !app.media?.screenshots?.mobile?.length &&
                !app.media?.screenshots?.tablet?.length
              "
              class="text-grey"
              >Aucune capture fournie par l’éditeur.</p
            >
            <div
              v-if="app.media?.screenshots?.mobile?.length"
              class="screenshot-group mobile-group"
            >
              <div class="device-type-label"
                ><q-icon name="smartphone" /> Mobile</div
              >
              <div class="screenshot-scroll">
                <div
                  v-for="(shot, i) in app.media.screenshots.mobile"
                  :key="'mob-' + i"
                  class="screenshot-card mobile-card"
                >
                  <q-img
                    :src="shot"
                    :alt="`Capture mobile ${i + 1}`"
                    spinner-color="primary"
                  />
                </div>
              </div>
            </div>

            <!-- Tablet screenshots scroll -->
            <div
              v-if="app.media?.screenshots?.tablet?.length"
              class="screenshot-group tablet-group q-mt-md"
            >
              <div class="device-type-label"
                ><q-icon name="tablet_mac" /> Tablette</div
              >
              <div class="screenshot-scroll">
                <div
                  v-for="(shot, i) in app.media.screenshots.tablet"
                  :key="'tab-' + i"
                  class="screenshot-card tablet-card"
                >
                  <q-img
                    :src="shot"
                    :alt="`Capture tablette ${i + 1}`"
                    spinner-color="primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <q-separator class="q-my-md opacity-35" />

          <AppReviews :app="app" @changed="refreshRating" />
        </q-card>
      </div>

      <!-- Right side: Installation, Sandbox and Versions -->
      <div class="col-12 col-md-4">
        <!-- Actions Box -->
        <q-card class="glass-panel detail-card q-mb-md text-center">
          <div
            class="text-caption text-blue-grey-300 text-uppercase tracking-wider text-weight-bold q-mb-xs"
          >
            Application
          </div>

          <div v-if="latestVersion" class="q-mb-md">
            <div class="text-subtitle2 text-white text-weight-bold">
              Version {{ latestVersion.version_number }}
            </div>
          </div>

          <q-btn
            color="blue-grey-700"
            icon="launch"
            label="Lancer l'application (PWA)"
            unelevated
            no-caps
            class="full-width text-weight-bold text-white rounded-borders q-mb-sm launch-pwa-btn"
            @click="launchApp"
            :disabled="extracting"
          />

          <q-btn
            v-if="app.status === 'published'"
            color="green-6"
            icon="add_to_home_screen"
            label="Ouvrir pour installer"
            unelevated
            no-caps
            class="full-width text-weight-bold text-white rounded-borders q-mb-sm install-pwa-btn"
            @click="launchApp"
            :loading="extracting"
          />

          <q-btn
            v-if="
              app.status === 'published' &&
              (app.source_type === 'url' || latestVersion?.status === 'active')
            "
            flat
            no-caps
            class="full-width q-mb-sm"
            label="Déclarer cette PWA installée"
            @click="confirmInstallation"
          />
          <div class="text-caption text-blue-grey-400 italic">
            Installation proposée par votre navigateur, selon sa compatibilité.
          </div>

          <!-- PWA Installation Info -->
          <div
            v-if="latestVersion"
            class="pwa-install-info row items-start q-gutter-xs q-mt-sm"
          >
            <q-icon name="info" color="blue-grey-4" size="xs" class="q-mt-xs" />
            <div class="col text-caption text-left text-grey-4">
              Cette application est une PWA. Une fois lancée, vous pourrez
              l'installer directement sur votre écran d'accueil.
            </div>
          </div>

          <div
            v-if="latestVersion?.hash_sha256"
            class="hash-box q-mt-md text-left truncate"
          >
            SHA256: {{ latestVersion.hash_sha256.substring(0, 16) }}...
          </div>
        </q-card>

        <!-- Sandbox Permissions Box -->
        <q-card class="glass-panel detail-card q-mb-md">
          <div class="row items-center q-gutter-xs q-mb-sm">
            <q-icon name="shield" color="blue-grey-300" size="20px" />
            <span class="text-subtitle2 text-weight-bold text-white"
              >PWA Store Sandbox</span
            >
          </div>

          <div class="text-caption text-blue-grey-300 q-mb-sm">
            Cette application s'exécute dans une sandbox sécurisée et déclare
            les accès suivants :
          </div>

          <div
            class="text-weight-bold text-blue-grey-200 text-caption text-uppercase q-mb-xs"
          >
            Permissions requises :
          </div>
          <div
            v-if="latestVersion?.permissions_required?.length > 0"
            class="q-gutter-xs q-mb-md"
          >
            <q-chip
              v-for="perm in latestVersion.permissions_required"
              :key="perm"
              color="blue-grey-900"
              text-color="blue-grey-200"
              icon="verified"
              dense
            >
              {{ perm }}
            </q-chip>
          </div>
          <div v-else class="text-caption text-green-400 italic q-mb-md">
            Aucune permission spéciale requise.
          </div>

          <div
            class="text-weight-bold text-blue-grey-200 text-caption text-uppercase q-mb-xs"
          >
            Domaines externes détectés :
          </div>
          <div
            v-if="
              (
                latestVersion?.detected_domains ||
                latestVersion?.domains_whitelist
              )?.length > 0
            "
            class="q-gutter-xs"
          >
            <q-chip
              v-for="domain in latestVersion.detected_domains ||
              latestVersion.domains_whitelist"
              :key="domain"
              color="slate-900"
              text-color="blue-grey-300"
              icon="language"
              dense
            >
              {{ domain }}
            </q-chip>
          </div>
          <div v-else class="text-caption text-red-400 italic">
            Aucun domaine externe signalé par l’analyse statique.
          </div>
        </q-card>

        <!-- Version History Box -->
        <q-card class="glass-panel detail-card">
          <div class="text-subtitle2 text-weight-bold text-white q-mb-sm">
            Historique des versions
          </div>
          <q-list
            v-if="app.versions?.length > 0"
            separator
            class="text-blue-grey-200"
          >
            <q-item v-for="ver in app.versions" :key="ver.id" class="q-px-none">
              <q-item-section>
                <div class="text-weight-bold text-white"
                  >v{{ ver.version_number }}</div
                >
                <div class="text-caption text-blue-grey-400">{{
                  formatDate(ver.created_at)
                }}</div>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  icon="download"
                  color="blue-grey-300"
                  @click="downloadVersion(ver.id)"
                />
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-caption text-blue-grey-400 italic">
            Aucun historique de version.
          </div>
        </q-card>
      </div>
    </div>

    <section v-if="similar.length" class="similar-section">
      <h2 class="section-title">Applications similaires</h2>
      <AppGrid :apps="similar" />
    </section>

    <!-- Extraction Dialog -->
    <q-dialog v-model="extracting" persistent>
      <q-card
        class="extraction-dialog q-pa-md"
        style="min-width: 300px; border-radius: 16px"
      >
        <q-card-section
          class="row items-center justify-center column q-gutter-md"
        >
          <q-spinner-orbit color="primary" size="lg" />
          <div class="text-h6 text-weight-bold text-center"
            >Ouverture en cours...</div
          >
          <div class="extraction-caption text-caption text-center">
            Vérification de la disponibilité de l’application.
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import HostingBadge from '@/components/HostingBadge.vue'
import { deviceIdentity, devicePlatform } from '@/utils/device'
import { useWorkspaceAccess } from '@/composables/useWorkspaceAccess'
const { isMobile } = useWorkspaceAccess()
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/boot/axios'
import { useAuthStore } from '@/stores/auth'
import { useQuasar } from 'quasar'
import AppIcon from '@/components/AppIcon.vue'
import AppGrid from '@/components/AppGrid.vue'
import { catalogApi } from '@/services/catalog'
import { communityApi } from '@/services/community'
import AppReviews from '@/components/AppReviews.vue'
import ReportButton from '@/components/ReportButton.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()

const app = ref(null)
const loading = ref(true)
const error = ref('')

const extracting = ref(false)
const similar = ref([])
const favorited = ref(false),
  popping = ref(false)

const latestVersion = computed(() => {
  if (!app.value?.versions || app.value.versions.length === 0) return null
  return (
    app.value.versions.find(v => v.status === 'active') || app.value.versions[0]
  )
})

const isOwnerOrAdmin = computed(() => {
  if (isMobile.value || !authStore.isAuthenticated || !app.value) return false
  return (
    authStore.user?.id === app.value.developer_id ||
    authStore.user?.role === 'admin'
  )
})

async function fetchAppDetails() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/apps/' + route.params.id)
    app.value = response.data
    similar.value = []
    if (app.value.status === 'published') {
      communityApi.recordView(app.value.id).catch(() => {})
      catalogApi
        .similar(app.value.id)
        .then(({ data }) => (similar.value = data))
        .catch(() => {})
    }
  } catch (err) {
    error.value =
      err.response?.data?.message ||
      'Erreur lors de la récupération des détails'
  } finally {
    loading.value = false
  }
}

async function refreshRating() {
  try {
    const { data } = await api.get('/apps/' + route.params.id)
    app.value.average_rating = data.average_rating
    app.value.reviews_count = data.reviews_count
  } catch {
    // The reviews list already shows the change; the header refreshes next visit.
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function confirmInstallation() {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  $q.dialog({
    title: 'Installation sur cet appareil',
    message:
      'Avez-vous installé cette PWA depuis votre navigateur ? Confirmez pour la retrouver dans votre bibliothèque. Cette action ne lance pas l’installation.',
    cancel: true
  }).onOk(async () => {
    try {
      const device = deviceIdentity()
      if (!device) throw new Error('Le stockage local est indisponible.')
      await api.post('/installations', {
        application_id: app.value.id,
        app_version_id:
          app.value.source_type === 'url' ? null : latestVersion.value?.id,
        device_uuid: device,
        platform: devicePlatform(),
        status: 'installed',
        metadata: { source: 'user_confirmation' }
      })
      $q.notify({
        type: 'positive',
        message: 'Installation enregistrée pour cet appareil.'
      })
    } catch (e) {
      $q.notify({
        type: 'negative',
        message:
          e.response?.data?.message ||
          e.message ||
          'Impossible d’enregistrer cette installation.'
      })
    }
  })
}
async function downloadVersion(id) {
  try {
    const { data } = await api.get(`/versions/${id}/download`, {
      responseType: 'blob'
    })
    const url = URL.createObjectURL(data),
      link = document.createElement('a')
    link.href = url
    link.download = `${app.value.identifier || 'application'}-${id}.zip`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    const device = deviceIdentity()
    if (
      authStore.isAuthenticated &&
      device &&
      app.value.status === 'published'
    ) {
      try {
        await api.post('/installations', {
          application_id: app.value.id,
          app_version_id: id,
          device_uuid: device,
          platform: devicePlatform(),
          status: 'downloaded',
          metadata: { source: 'store_download' }
        })
      } catch {
        $q.notify({
          type: 'warning',
          message:
            'Archive reçue, mais son enregistrement dans la bibliothèque a échoué.'
        })
      }
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Impossible de télécharger cette version.'
    })
  }
}

async function launchApp() {
  extracting.value = true
  // Open synchronously to preserve the user's browser gesture.
  const target = window.open('about:blank', '_blank')
  if (target) target.opener = null
  try {
    const { data } = await api.get(`/apps/${app.value.id}/launch`)
    const url = new URL(data.url)
    if (url.protocol !== 'https:')
      throw new Error('Adresse de lancement non sécurisée.')
    if (target) target.location.replace(url.href)
    else window.location.assign(url.href)
  } catch (err) {
    target?.close()
    $q.notify({
      type: 'negative',
      message:
        err.response?.data?.message || 'Impossible d’ouvrir cette application.'
    })
  } finally {
    extracting.value = false
  }
}

async function addFavorite() {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  try {
    await api.put(`/favorites/${app.value.id}`)
    favorited.value = true
    popping.value = true
    setTimeout(() => (popping.value = false), 450)
    $q.notify({ type: 'positive', message: 'Application ajoutée aux favoris.' })
  } catch (e) {
    $q.notify({
      type: 'negative',
      message:
        e.response?.data?.message || 'Impossible d’enregistrer ce favori.'
    })
  }
}

async function share() {
  const data = {
    title: app.value.name,
    text: app.value.short_description || `${app.value.name} sur PWA Store`,
    url: window.location.href
  }
  try {
    if (navigator.share) {
      await navigator.share(data)
      return
    }
    await navigator.clipboard.writeText(data.url)
    $q.notify({ type: 'positive', message: 'Lien copié.' })
  } catch (e) {
    // Closing the share sheet is not an error worth reporting.
    if (e?.name !== 'AbortError')
      $q.notify({
        type: 'negative',
        message: 'Impossible de partager ce lien.'
      })
  }
}

onMounted(() => {
  fetchAppDetails()
})
watch(
  () => route.params.id,
  (id, previous) => {
    if (id && id !== previous) fetchAppDetails()
  }
)
</script>

<style scoped lang="scss">
.similar-section {
  margin-top: 24px;
}
.details-page {
  background: var(--page);
  color: var(--text);
  padding: 16px var(--ui-page-gutter) 28px;
}
.back-btn {
  color: var(--pwa-link);
  margin-bottom: 8px;
}
.detail-card {
  background: var(--glass);
  border: 1px solid var(--outline);
  border-radius: 17px;
  padding: clamp(13px, 1.6vw, 18px);
  box-shadow: var(--ui-shadow-sm);
  transition:
    border-color 0.2s ease,
    box-shadow 0.25s ease;
}
.detail-card:hover {
  border-color: color-mix(in srgb, var(--primary) 22%, var(--outline));
  box-shadow: var(--ui-shadow-md);
}
.detail-card :deep(.text-white) {
  color: var(--text) !important;
}
.detail-card :deep(.text-blue-grey-100),
.detail-card :deep(.text-blue-grey-200),
.detail-card :deep(.text-blue-grey-300),
.detail-card :deep(.text-blue-grey-400) {
  color: var(--muted) !important;
}
.detail-card :deep(.q-list--dark) {
  color: var(--text);
}
.app-title {
  color: var(--text);
  font-size: clamp(23px, 3vw, 34px);
  font-weight: 800;
  margin: 0;
  line-height: 1.2;
}
.dev-name {
  color: var(--muted);
  font-size: 12px;
}
.section-title {
  color: var(--pwa-link);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.description-text {
  color: var(--text);
  font-size: 13px;
  line-height: 1.5;
}
.screenshots-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.device-type-label {
  font-size: 10px;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.screenshot-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: thin;
  scrollbar-color: var(--surface-highest) transparent;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--surface-highest);
    border-radius: 2px;
  }
}
.screenshot-card {
  flex: 0 0 auto;
  border-radius: 13px;
  overflow: hidden;
  border: 1px solid var(--outline);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  background: var(--surface-low);
  transition:
    transform 0.25s var(--ui-ease),
    box-shadow 0.25s ease;

  &:hover {
    box-shadow: var(--ui-shadow-md);
    transform: translateY(-3px) scale(1.01);
  }
}
.mobile-card {
  width: 110px;
  height: 195px;
}
.tablet-card {
  width: 220px;
  height: 145px;
}
.launch-pwa-btn {
  background: var(--primary) !important;
  color: var(--pwa-on-primary) !important;
  box-shadow: 0 4px 15px rgba(var(--pwa-primary-rgb), 0.35);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.launch-pwa-btn:not(.q-btn--disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--pwa-primary-rgb), 0.45);
}
.launch-pwa-btn.q-btn--disabled {
  background: var(--outline) !important;
  color: var(--muted) !important;
  opacity: 0.55 !important;
  box-shadow: none !important;
}
.rating-box {
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 12px;
  min-width: 100px;
}
.rating-value {
  color: var(--text);
  font-size: 24px;
  font-weight: 800;
}
.review-box {
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 13px;
}
.hash-box {
  background: var(--surface-low);
  border: 1px solid var(--outline);
  font-family: var(--pwa-font-sans);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 10px;
  color: var(--text);
}
.download-btn {
  color: var(--pwa-on-primary);
  background: var(--primary);
  font-weight: 800;
  border-radius: 11px;
}
@media (max-width: 599px) {
  .details-page {
    padding-top: 15px;
  }
  .detail-card {
    border-radius: 14px;
  }
  .mobile-card {
    width: 128px;
    height: 225px;
  }
}
.pwa-install-info {
  background: rgba(var(--pwa-primary-rgb), 0.08);
  border: 1px solid rgba(var(--pwa-primary-rgb), 0.2);
  border-radius: 12px;
  padding: 10px 12px;
}
.extraction-dialog {
  color: var(--pwa-text);
  background: var(--pwa-surface);
}
.extraction-caption {
  color: var(--pwa-muted);
}
</style>
