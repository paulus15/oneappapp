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
      <q-spinner-orbit color="indigo" size="48px" />
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
              class="q-mr-md bg-indigo-900 border-indigo-sm shadow-md rounded-borders"
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
              <div class="dev-name">Développé par {{ app.developer?.name }}</div>
              <div class="row items-center q-gutter-xs q-mt-xs">
                <q-badge color="indigo-9" class="q-py-xs q-px-sm">
                  {{ app.category }}
                </q-badge>
                <q-badge color="green-9" class="q-py-xs q-px-sm">
                  Sécurité: {{ app.trust_score }}/100
                </q-badge>
              </div>
            </div>
          </div>

          <div class="section-title q-mb-xs">Description</div>
          <p class="description-text q-mb-md">
            {{ app.description }}
          </p>

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
              <div class="text-caption text-indigo-400 q-mt-xs">
                {{ app.reviews_count }} avis
              </div>
            </div>
            <div class="col">
              <div class="text-weight-bold text-white">Notes et Avis</div>
              <div class="text-caption text-indigo-300">
                Ce que disent les utilisateurs de l'écosystème OneApp.
              </div>
            </div>
          </div>

          <!-- Post Review Form (Only for logged-in users) -->
          <div v-if="authStore.isAuthenticated" class="q-my-md review-box q-pa-md">
            <div class="text-subtitle2 text-weight-bold text-white q-mb-xs">
              Laisser une note
            </div>
            <q-form @submit="submitReview">
              <div class="row items-center q-gutter-sm q-mb-sm">
                <span class="text-caption text-indigo-300">Votre note :</span>
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
                color="indigo-500"
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
            <div v-if="app.reviews?.length === 0" class="text-indigo-400 text-caption italic">
              Aucun commentaire pour le moment. Soyez le premier à donner votre avis !
            </div>
            <q-list v-else separator class="text-indigo-100">
              <q-item v-for="review in app.reviews" :key="review.id" class="q-py-sm q-px-none">
                <q-item-section avatar>
                  <q-avatar size="32px" color="indigo-700" text-color="white" class="text-weight-bold">
                    {{ review.user?.name.charAt(0).toUpperCase() }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <div class="row justify-between items-center">
                    <span class="text-weight-bold text-indigo-200">{{ review.user?.name }}</span>
                    <q-rating :model-value="review.rating" max="5" size="10px" color="orange-500" readonly />
                  </div>
                  <p class="text-caption text-indigo-300 q-mt-xs q-mb-none">{{ review.comment }}</p>
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
          <div class="text-caption text-indigo-300 text-uppercase tracking-wider text-weight-bold q-mb-xs">
            OneInstall Engine
          </div>

          <div v-if="latestVersion" class="q-mb-sm">
            <div class="text-subtitle2 text-white text-weight-bold">
              Version {{ latestVersion.version_number }}
            </div>
            <div class="text-caption text-indigo-300">Format universel : .oap (ZIP)</div>
          </div>

          <q-btn
            color="green-600"
            icon="download"
            label="Télécharger (.zip)"
            unelevated
            no-caps
            class="full-width text-weight-bold text-white rounded-borders q-mb-xs"
            @click="downloadLatest"
            :disabled="!latestVersion"
          />
          <div class="text-caption text-indigo-400 italic">
            Hash SHA-256 certifié par OneShield
          </div>

          <div v-if="latestVersion" class="hash-box q-mt-md text-left truncate">
            SHA256: {{ latestVersion.hash_sha256.substring(0, 16) }}...
          </div>
        </q-card>

        <!-- Sandbox Permissions Box -->
        <q-card class="glass-panel detail-card q-mb-md">
          <div class="row items-center q-gutter-xs q-mb-sm">
            <q-icon name="shield" color="indigo-300" size="20px" />
            <span class="text-subtitle2 text-weight-bold text-white">OneRuntime Sandbox</span>
          </div>

          <div class="text-caption text-indigo-300 q-mb-sm">
            Cette application s'exécute dans une sandbox sécurisée et déclare les accès suivants :
          </div>

          <div class="text-weight-bold text-indigo-200 text-caption text-uppercase q-mb-xs">
            Permissions requises :
          </div>
          <div v-if="latestVersion?.permissions_required?.length > 0" class="q-gutter-xs q-mb-md">
            <q-chip
              v-for="perm in latestVersion.permissions_required"
              :key="perm"
              color="indigo-900"
              text-color="indigo-200"
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

          <div class="text-weight-bold text-indigo-200 text-caption text-uppercase q-mb-xs">
            Domaines Autorisés (Whitelist) :
          </div>
          <div v-if="latestVersion?.domains_whitelist?.length > 0" class="q-gutter-xs">
            <q-chip
              v-for="domain in latestVersion.domains_whitelist"
              :key="domain"
              color="slate-900"
              text-color="indigo-300"
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
          <q-list v-if="app.versions?.length > 0" dark separator class="text-indigo-200">
            <q-item v-for="ver in app.versions" :key="ver.id" class="q-px-none">
              <q-item-section>
                <div class="text-weight-bold text-white">v{{ ver.version_number }}</div>
                <div class="text-caption text-indigo-400">{{ formatDate(ver.created_at) }}</div>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round icon="download" color="indigo-300" @click="downloadVersion(ver.id)" />
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-caption text-indigo-400 italic">
            Aucun historique de version.
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/boot/axios'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const app = ref(null)
const loading = ref(true)
const error = ref('')

const myRating = ref(5)
const myComment = ref('')
const submittingReview = ref(false)

const latestVersion = computed(() => {
  if (!app.value?.versions || app.value.versions.length === 0) return null
  return app.value.versions[0]
})

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

function downloadLatest() {
  if (!latestVersion.value) return
  downloadVersion(latestVersion.value.id)
}

function downloadVersion(versionId) {
  const token = localStorage.getItem('auth_token')
  const url = `https://oneapp.test/api/versions/${versionId}/download${token ? '?token=' + token : ''}`
  window.open(url, '_blank')
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

onMounted(() => {
  fetchAppDetails()
})
</script>

<style scoped lang="scss">
.details-page {
  background: var(--page);
  color: var(--text);
  padding: 20px 24px;
}
.back-btn {
  color: var(--primary);
  margin-bottom: 12px;
}
.detail-card {
  background: var(--glass);
  border: 1px solid var(--outline);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 12px 30px rgba(4, 9, 25, 0.06);
}
.app-title {
  color: var(--text);
  font-size: 22px;
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
.rating-box {
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 8px;
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
  border-radius: 8px;
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
  background: var(--text);
  color: var(--page);
  font-weight: 800;
  border-radius: 6px;
}
</style>
