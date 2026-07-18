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
              <q-img
                :src="
                  app.icon_url ||
                  'https://cdn-icons-png.flaticon.com/512/8422/8422116.png'
                "
              />
            </q-avatar>
            <div class="col">
              <h1 class="app-title">{{ app.name }}</h1>
              <div class="dev-name"
                >Développé par {{ app.developer?.name }}</div
              >
              <div class="row items-center q-gutter-xs q-mt-xs">
                <q-badge color="blue-grey-9" class="q-py-xs q-px-sm">
                  {{ app.category }}
                </q-badge>
                <q-badge color="green-9" class="q-py-xs q-px-sm">
                  Sécurité: {{ app.trust_score }}/100
                </q-badge>
              </div>
            </div>
          </div>

          <div class="section-title q-mb-xs">Description</div>
          <p class="description-text q-mb-lg">
            {{ app.description }}
          </p>

          <div class="section-title q-mb-xs">Captures d'écran</div>
          <div class="screenshots-section q-mb-lg">
            <!-- Mobile screenshots scroll -->
            <div class="screenshot-group mobile-group">
              <div class="device-type-label"
                ><q-icon name="smartphone" /> Mobile</div
              >
              <div class="screenshot-scroll">
                <div
                  v-for="i in 4"
                  :key="'mob-' + i"
                  class="screenshot-card mobile-card"
                >
                  <q-img
                    :src="getMobileScreenshot(app.id, i)"
                    spinner-color="primary"
                  />
                </div>
              </div>
            </div>

            <!-- Tablet screenshots scroll -->
            <div class="screenshot-group tablet-group q-mt-md">
              <div class="device-type-label"
                ><q-icon name="tablet_mac" /> Tablette</div
              >
              <div class="screenshot-scroll">
                <div
                  v-for="i in 2"
                  :key="'tab-' + i"
                  class="screenshot-card tablet-card"
                >
                  <q-img
                    :src="getTabletScreenshot(app.id, i)"
                    spinner-color="primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <q-separator dark class="q-my-md opacity-35" />

          <!-- Ratings & Reviews overview -->
          <div class="row items-center q-gutter-md q-mb-md">
            <div class="text-center rating-box q-pa-sm">
              <div class="rating-value">{{ app.average_rating }}</div>
              <q-rating
                :model-value="app.average_rating"
                max="5"
                size="12px"
                color="orange-500"
                icon="star"
                icon-half="star_half"
                readonly
              />
              <div class="text-caption text-blue-grey-400 q-mt-xs">
                {{ app.reviews_count }} avis
              </div>
            </div>
            <div class="col">
              <div class="text-weight-bold text-white">Notes et Avis</div>
              <div class="text-caption text-blue-grey-300">
                Ce que disent les utilisateurs de l'écosystème OneApp.
              </div>
            </div>
          </div>

          <!-- Post Review Form (Only for logged-in users) -->
          <div
            v-if="authStore.isAuthenticated"
            class="q-my-md review-box q-pa-md"
          >
            <div class="text-subtitle2 text-weight-bold text-white q-mb-xs">
              Laisser une note
            </div>
            <q-form @submit="submitReview">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <span class="text-caption text-blue-grey-300"
                  >Votre note :</span
                >
                <q-rating
                  v-model="myRating"
                  max="5"
                  size="20px"
                  color="orange-500"
                  icon="star"
                />
              </div>
              <q-input
                v-model="myComment"
                type="textarea"
                placeholder="Rédigez votre avis sur l'application..."
                filled
                dark
                color="blue-grey-500"
                rows="2"
                class="q-mb-sm"
              />
              <q-btn
                label="Envoyer mon avis"
                type="submit"
                unelevated
                no-caps
                class="download-btn"
                :loading="submittingReview"
              />
            </q-form>
          </div>

          <!-- Existing Reviews List -->
          <div class="q-mt-lg">
            <div class="text-subtitle2 text-weight-bold text-white q-mb-sm">
              Commentaires
            </div>
            <div
              v-if="app.reviews?.length === 0"
              class="text-blue-grey-400 text-caption italic"
            >
              Aucun commentaire pour le moment. Soyez le premier à donner votre
              avis !
            </div>
            <q-list v-else separator class="text-blue-grey-100">
              <q-item
                v-for="review in app.reviews"
                :key="review.id"
                class="q-py-sm q-px-none"
              >
                <q-item-section avatar>
                  <q-avatar
                    size="32px"
                    color="blue-grey-700"
                    text-color="white"
                    class="text-weight-bold"
                  >
                    {{ review.user?.name.charAt(0).toUpperCase() }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <div class="row justify-between items-center">
                    <span class="text-weight-bold text-blue-grey-200">{{
                      review.user?.name
                    }}</span>
                    <q-rating
                      :model-value="review.rating"
                      max="5"
                      size="10px"
                      color="orange-500"
                      readonly
                    />
                  </div>
                  <p
                    class="text-caption text-blue-grey-300 q-mt-xs q-mb-none"
                    >{{ review.comment }}</p
                  >
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card>
      </div>

      <!-- Right side: Installation, Sandbox and Versions -->
      <div class="col-12 col-md-4">
        <!-- Actions Box -->
        <q-card class="glass-panel detail-card q-mb-md text-center">
          <div
            class="text-caption text-blue-grey-300 text-uppercase tracking-wider text-weight-bold q-mb-xs"
          >
            OneInstall Engine
          </div>

          <div v-if="latestVersion" class="q-mb-md">
            <div class="text-subtitle2 text-white text-weight-bold">
              Version {{ latestVersion.version_number }}
            </div>
            <div class="text-caption text-blue-grey-300"
              >Format universel : .oap (ZIP)</div
            >
          </div>

          <q-btn
            color="blue-grey-700"
            icon="launch"
            label="Lancer l'application (PWA)"
            unelevated
            no-caps
            class="full-width text-weight-bold text-white rounded-borders q-mb-sm launch-pwa-btn"
            @click="launchApp"
            :disabled="!latestVersion"
          />

          <q-btn
            v-if="isAppInstallable"
            color="green-6"
            icon="add_to_home_screen"
            label="Installer l'application"
            unelevated
            no-caps
            class="full-width text-weight-bold text-white rounded-borders q-mb-sm install-pwa-btn"
            @click="installAppFromStore"
            :loading="installingApp"
          />

          <div class="text-caption text-blue-grey-400 italic">
            Hash SHA-256 certifié par OneShield
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

          <div v-if="latestVersion" class="hash-box q-mt-md text-left truncate">
            SHA256: {{ latestVersion.hash_sha256.substring(0, 16) }}...
          </div>
        </q-card>

        <!-- Sandbox Permissions Box -->
        <q-card class="glass-panel detail-card q-mb-md">
          <div class="row items-center q-gutter-xs q-mb-sm">
            <q-icon name="shield" color="blue-grey-300" size="20px" />
            <span class="text-subtitle2 text-weight-bold text-white"
              >OneRuntime Sandbox</span
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
              dark
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
            Domaines Autorisés (Whitelist) :
          </div>
          <div
            v-if="latestVersion?.domains_whitelist?.length > 0"
            class="q-gutter-xs"
          >
            <q-chip
              v-for="domain in latestVersion.domains_whitelist"
              :key="domain"
              color="slate-900"
              text-color="blue-grey-300"
              icon="language"
              dense
              dark
            >
              {{ domain }}
            </q-chip>
          </div>
          <div v-else class="text-caption text-red-400 italic">
            Aucun trafic réseau sortant autorisé (Offline).
          </div>
        </q-card>

        <!-- Version History Box -->
        <q-card class="glass-panel detail-card">
          <div class="text-subtitle2 text-weight-bold text-white q-mb-sm">
            Historique des versions
          </div>
          <q-list
            v-if="app.versions?.length > 0"
            dark
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

    <!-- Hidden iframe to capture the sub-app's PWA install prompt -->
    <iframe
      v-if="isExtracted && latestVersion"
      :src="pwaUrl"
      style="display: none; width: 0; height: 0; border: none"
      ref="pwaIframe"
      id="pwa-installer-iframe"
    ></iframe>

    <!-- Extraction Dialog -->
    <q-dialog v-model="extracting" persistent>
      <q-card
        class="glass-panel text-white q-pa-md"
        style="
          min-width: 300px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(16px);
        "
      >
        <q-card-section
          class="row items-center justify-center column q-gutter-md"
        >
          <q-spinner-orbit color="blue-grey-4" size="lg" />
          <div class="text-h6 text-weight-bold text-center"
            >Extraction en cours...</div
          >
          <div class="text-caption text-grey-4 text-center">
            OneInstall prépare les fichiers de l'application et sécurise le bac
            à sable.
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/boot/axios'
import { useAuthStore } from '@/stores/auth'
import { useQuasar } from 'quasar'

const route = useRoute()
const authStore = useAuthStore()
const $q = useQuasar()

const app = ref(null)
const loading = ref(true)
const error = ref('')

const pwaIframe = ref(null)
const isAppInstallable = ref(false)
const installingApp = ref(false)

const extracting = ref(false)
const isExtracted = ref(false)

const myRating = ref(5)
const myComment = ref('')
const submittingReview = ref(false)

const latestVersion = computed(() => {
  if (!app.value?.versions || app.value.versions.length === 0) return null
  return app.value.versions[0]
})

const pwaUrl = computed(() => {
  if (!app.value?.identifier) return '#'
  const apiBase = api.defaults.baseURL || 'https://oneapp.test/api'
  const origin = apiBase.replace('/api', '')
  return `${origin}/apps/${app.value.identifier}/index.html`
})

const getMobileScreenshot = (appId, index) => {
  const images = [
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c',
    'https://images.unsplash.com/photo-1551650975-87deedd944c3',
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb',
    'https://images.unsplash.com/photo-1523206489230-c012c64b2b48',
    'https://images.unsplash.com/photo-1546054454-aa26e2b734c7'
  ]
  const seed = (appId * 7 + index * 13) % images.length
  return `${images[seed]}?w=240&h=420&fit=crop&q=80`
}

const getTabletScreenshot = (appId, index) => {
  const images = [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0',
    'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e',
    'https://images.unsplash.com/photo-1561154464-82e9adf32764',
    'https://images.unsplash.com/photo-1527689368864-3a821dbccc34'
  ]
  const seed = (appId * 11 + index * 17) % images.length
  return `${images[seed]}?w=500&h=330&fit=crop&q=80`
}

async function fetchAppDetails() {
  loading.value = true
  error.value = ''
  try {
    const response = await api.get('/apps/' + route.params.id)
    app.value = response.data
  } catch (err) {
    error.value =
      err.response?.data?.message ||
      'Erreur lors de la récupération des détails'
  } finally {
    loading.value = false
  }
}

async function submitReview() {
  submittingReview.value = true
  try {
    await api.post('/reviews', {
      application_id: app.value.id,
      rating: myRating.value,
      comment: myComment.value
    })
    myComment.value = ''
    myRating.value = 5
    await fetchAppDetails()
  } catch (err) {
    console.error('Error submitting review', err)
  } finally {
    submittingReview.value = false
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

function handleIframeMessage(event) {
  if (event.origin !== window.location.origin) return

  if (event.data && event.data.type === 'pwa-installable') {
    isAppInstallable.value = true
  }

  if (event.data && event.data.type === 'pwa-installed-success') {
    installingApp.value = false
    isAppInstallable.value = false
    $q.notify({
      type: 'positive',
      message: `${app.value.name} a été installée avec succès sur votre appareil !`
    })
  }

  if (event.data && event.data.type === 'pwa-install-failed') {
    installingApp.value = false
    $q.notify({
      type: 'warning',
      message: "Lancement de l'application pour procéder à l'installation...",
      timeout: 3000
    })
    window.open(pwaUrl.value, '_blank')
  }
}

function installAppFromStore() {
  if (!pwaIframe.value) return
  installingApp.value = true
  pwaIframe.value.contentWindow.postMessage(
    { type: 'trigger-pwa-install' },
    '*'
  )
}

async function launchApp() {
  if (!latestVersion.value) return

  extracting.value = true
  try {
    await api.post(`/versions/${latestVersion.value.id}/extract`)
    isExtracted.value = true

    // Ouvrir l'application dans un nouvel onglet
    window.open(pwaUrl.value, '_blank')
  } catch (err) {
    console.error('Error during PWA extraction', err)
    $q.notify({
      type: 'negative',
      message: "Erreur lors de la préparation de l'application."
    })
  } finally {
    extracting.value = false
  }
}

onMounted(() => {
  fetchAppDetails()
  window.addEventListener('message', handleIframeMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleIframeMessage)
})
</script>

<style scoped lang="scss">
.details-page {
  background: var(--page);
  color: var(--text);
  padding: 16px var(--ui-page-gutter) 28px;
}
.back-btn {
  color: var(--primary);
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
  color: var(--primary);
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
  color: #ffffff !important;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.launch-pwa-btn:not(.q-btn--disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
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
  font-family: monospace;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 10px;
  color: var(--text);
}
.download-btn {
  color: #fff;
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
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 10px 12px;
}
</style>
