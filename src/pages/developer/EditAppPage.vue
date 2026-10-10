<template>
  <q-page class="edit-app-page">
    <div class="edit-app-hero q-mb-md">
      <q-btn
        flat
        no-caps
        dense
        icon="arrow_back"
        label="Retour à la console"
        class="back-btn q-mb-xs"
        to="/developer"
      />
      <div class="row justify-between items-center wrap gap-md">
        <div class="row items-center gap-md">
          <q-avatar
            size="52px"
            class="pwa-surface shadow-2 rounded-borders border-slate"
          >
            <AppIcon
              :src="appForm.icon_url"
              :alt="currentAppName"
              fallback-icon="apps"
            />
          </q-avatar>
          <div>
            <span class="console-eyebrow">
              <q-icon name="edit_note" /> Édition de l'application
            </span>
            <h1 class="console-title">Modifier {{ currentAppName }}</h1>
            <div class="console-subtitle">
              Mettez à jour les informations, visuels, statut d'activité ou vos
              versions (.zip).
            </div>
          </div>
        </div>

        <div class="row items-center q-gutter-sm q-mt-sm-none q-mt-xs">
          <!-- Toggle Statut Actif / Inactif -->
          <div
            class="active-toggle-badge row items-center gap-xs q-px-md q-py-xs"
          >
            <q-toggle
              v-model="appForm.is_active"
              color="positive"
              keep-color
              dense
            />
            <span
              :class="[
                'text-weight-bold',
                'text-caption',
                appForm.is_active ? 'text-positive' : 'text-amber-9'
              ]"
            >
              {{
                appForm.is_active
                  ? 'Application Active'
                  : 'Application Inactive'
              }}
            </span>
            <q-tooltip>
              {{
                appForm.is_active
                  ? 'Visible sur la page d’accueil et le catalogue'
                  : 'Masquée de la page d’accueil'
              }}
            </q-tooltip>
          </div>

          <!-- Bouton de suppression réservé aux admins -->
          <q-btn
            v-if="isAdmin"
            outline
            color="negative"
            no-caps
            icon="delete_outline"
            label="Supprimer (Admin)"
            class="delete-app-btn"
            @click="confirmDeleteApp"
          />
        </div>
      </div>
    </div>

    <!-- Spinner loading state -->
    <div v-if="loadingApp" class="row justify-center q-my-xl">
      <q-spinner-orbit color="primary" size="48px" />
    </div>

    <q-stepper
      :contracted="$q.screen.lt.sm"
      v-else
      v-model="step"
      class="edit-app-stepper glass-panel"
      flat
      color="primary"
      animated
      header-nav
    >
      <!-- Étape 1: Identité -->
      <q-step
        :name="1"
        title="Identité"
        icon="badge"
        caption="Nom, catégorie, visibilité"
        :done="step > 1"
      >
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-6">
            <q-input
              v-model="appForm.name"
              label="Nom de l'application"
              filled
              dense
              color="primary"
              required
              :rules="[val => (val && val.length > 0) || 'Nom requis']"
            >
              <template #prepend><q-icon name="apps" /></template>
            </q-input>
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="appForm.identifier"
              label="Identifiant unique"
              filled
              dense
              color="primary"
              readonly
              hint="L'identifiant unique ne peut pas être modifié après création."
            >
              <template #prepend><q-icon name="fingerprint" /></template>
              <template #append
                ><q-icon name="lock" color="blue-grey-7"
              /></template>
            </q-input>
          </div>

          <div class="col-12 col-md-6">
            <q-select
              v-model="appForm.category_id"
              :options="categoryOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              label="Catégorie"
              filled
              dense
              color="primary"
              required
              :rules="[val => !!val || 'Catégorie requise']"
            >
              <template #prepend><q-icon name="category" /></template>
            </q-select>
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="appForm.subcategory"
              label="Sous-catégorie"
              filled
              dense
              color="primary"
            >
              <template #prepend><q-icon name="sell" /></template>
            </q-input>
          </div>

          <!-- Mode Actif / Inactif pour l'application -->
          <div class="col-12">
            <div
              class="visibility-card row items-center justify-between q-pa-sm"
            >
              <div class="row items-center gap-sm">
                <q-icon
                  :name="appForm.is_active ? 'visibility' : 'visibility_off'"
                  :color="appForm.is_active ? 'positive' : 'amber-9'"
                  size="24px"
                />
                <div>
                  <div class="text-weight-bold text-slate-800 font-size-13">
                    Statut de publication :
                    {{
                      appForm.is_active
                        ? 'Active (Publiée)'
                        : 'Inactive (Masquée)'
                    }}
                  </div>
                  <div class="text-caption text-slate-500">
                    {{
                      appForm.is_active
                        ? 'L’application est actuellement visible dans le catalogue et sur la page d’accueil.'
                        : 'L’application est masquée du catalogue public mais reste accessible dans votre console développeur.'
                    }}
                  </div>
                </div>
              </div>
              <q-toggle
                v-model="appForm.is_active"
                color="positive"
                keep-color
              />
            </div>
          </div>

          <div class="col-12">
            <q-input
              v-model="appForm.short_description"
              label="Description courte"
              maxlength="280"
              counter
              filled
              dense
              color="primary"
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="appForm.description"
              type="textarea"
              label="Description complète"
              rows="4"
              filled
              dense
              color="primary"
            />
          </div>
        </div>

        <q-stepper-navigation class="row justify-between items-center">
          <q-btn
            unelevated
            no-caps
            label="Continuer"
            class="create-btn"
            :disable="!canContinueIdentity"
            @click="step = 2"
          />
          <q-btn
            unelevated
            no-caps
            icon="save"
            label="Enregistrer les modifications"
            color="positive"
            class="save-btn"
            :loading="saving"
            @click="saveMetaDataOnly"
          />
        </q-stepper-navigation>
      </q-step>

      <!-- Étape 2: Média & liens -->
      <q-step
        :name="2"
        title="Média & liens"
        icon="link"
        caption="Icône et pages associées"
        :done="step > 2"
      >
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-6">
            <div class="row items-center gap-sm">
              <q-avatar
                size="40px"
                class="pwa-surface shadow-1 rounded-borders border-slate"
              >
                <AppIcon
                  :src="appForm.icon_url"
                  alt="Aperçu icône"
                  fallback-icon="apps"
                />
              </q-avatar>
              <q-input
                v-model="appForm.icon_url"
                label="URL de l'icône (interne ou lien externe HTTP/HTTPS)"
                filled
                dense
                color="primary"
                class="col"
                hint="Lien direct vers l'image (ex: https://cdn.example.com/logo.png)"
              >
                <template #prepend><q-icon name="image" /></template>
              </q-input>
            </div>
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="appForm.official_site_url"
              label="Site officiel"
              type="url"
              filled
              dense
              color="primary"
            >
              <template #prepend><q-icon name="public" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="appForm.privacy_policy_url"
              label="Politique de confidentialité"
              type="url"
              filled
              dense
              color="primary"
            >
              <template #prepend><q-icon name="policy" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="appForm.support_url"
              label="Support"
              type="url"
              filled
              dense
              color="primary"
            >
              <template #prepend><q-icon name="support_agent" /></template>
            </q-input>
          </div>
        </div>

        <q-stepper-navigation class="row justify-between items-center">
          <div>
            <q-btn
              unelevated
              no-caps
              label="Continuer"
              class="create-btn"
              @click="step = 3"
            />
            <q-btn
              flat
              no-caps
              label="Retour"
              class="q-ml-sm back-step-btn"
              @click="step = 1"
            />
          </div>
          <q-btn
            unelevated
            no-caps
            icon="save"
            label="Enregistrer les modifications"
            color="positive"
            class="save-btn"
            :loading="saving"
            @click="saveMetaDataOnly"
          />
        </q-stepper-navigation>
      </q-step>

      <!-- Étape 3: Captures d'écran -->
      <q-step
        :name="3"
        title="Captures d'écran"
        icon="image"
        caption="Visuels mobile et tablette"
        :done="step > 3"
      >
        <p class="step-hint">
          Importez ou mettez à jour les captures d'écran de votre fiche.
        </p>

        <div class="screenshot-group-label">
          <q-icon name="smartphone" /> Captures mobile
        </div>
        <div class="screenshot-grid q-mb-sm">
          <div
            v-for="(shot, index) in appForm.screenshots_mobile"
            :key="shot.url"
            class="screenshot-thumb"
          >
            <img :src="shot.url" :alt="'Capture mobile ' + (index + 1)" />
            <q-btn
              flat
              round
              dense
              icon="close"
              class="screenshot-thumb-remove"
              @click="removeScreenshot('screenshots_mobile', index)"
            />
          </div>
          <label class="screenshot-dropzone">
            <q-icon name="add_photo_alternate" size="22px" />
            <span>Importer</span>
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              @change="addScreenshots('screenshots_mobile', $event)"
            />
          </label>
        </div>

        <div class="screenshot-group-label">
          <q-icon name="tablet_mac" /> Captures tablette (optionnel)
        </div>
        <div class="screenshot-grid">
          <div
            v-for="(shot, index) in appForm.screenshots_tablet"
            :key="shot.url"
            class="screenshot-thumb"
          >
            <img :src="shot.url" :alt="'Capture tablette ' + (index + 1)" />
            <q-btn
              flat
              round
              dense
              icon="close"
              class="screenshot-thumb-remove"
              @click="removeScreenshot('screenshots_tablet', index)"
            />
          </div>
          <label class="screenshot-dropzone">
            <q-icon name="add_photo_alternate" size="22px" />
            <span>Importer</span>
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              @change="addScreenshots('screenshots_tablet', $event)"
            />
          </label>
        </div>

        <q-stepper-navigation class="row justify-between items-center">
          <div>
            <q-btn
              unelevated
              no-caps
              label="Continuer"
              class="create-btn"
              @click="step = 4"
            />
            <q-btn
              flat
              no-caps
              label="Retour"
              class="q-ml-sm back-step-btn"
              @click="step = 2"
            />
          </div>
          <q-btn
            unelevated
            no-caps
            icon="save"
            label="Enregistrer les modifications"
            color="positive"
            class="save-btn"
            :loading="saving"
            @click="saveMetaDataOnly"
          />
        </q-stepper-navigation>
      </q-step>

      <!-- Étape 4: Compatibilité -->
      <q-step
        :name="4"
        title="Compatibilité"
        icon="devices"
        caption="Appareils et capacités supportés"
        :done="step > 4"
      >
        <div class="row wrap q-gutter-sm">
          <div
            v-for="option in compatibilityOptions"
            :key="option.value"
            class="checkbox-card"
          >
            <q-checkbox
              v-model="appForm.compatibility[option.value]"
              :label="option.label"
              dense
              color="primary"
            />
          </div>
        </div>

        <q-stepper-navigation class="row justify-between items-center">
          <div>
            <q-btn
              unelevated
              no-caps
              label="Continuer"
              class="create-btn"
              @click="step = 5"
            />
            <q-btn
              flat
              no-caps
              label="Retour"
              class="q-ml-sm back-step-btn"
              @click="step = 3"
            />
          </div>
          <q-btn
            unelevated
            no-caps
            icon="save"
            label="Enregistrer les modifications"
            color="positive"
            class="save-btn"
            :loading="saving"
            @click="saveMetaDataOnly"
          />
        </q-stepper-navigation>
      </q-step>

      <!-- Étape 5: Versions -->
      <q-step
        :name="5"
        title="Versions"
        icon="history"
        caption="Historique & ajout de versions (.zip)"
      >
        <!-- Liste des versions enregistrées -->
        <div class="versions-history-wrapper q-mb-xl">
          <div class="row items-center justify-between q-mb-sm">
            <div
              class="text-subtitle1 text-weight-bold text-slate-800 row items-center gap-xs"
            >
              <q-icon name="history" color="primary" size="20px" />
              Versions enregistrées
            </div>
            <q-badge color="primary" class="q-py-xs q-px-sm text-weight-bold">
              {{ existingVersions.length }} version(s)
            </q-badge>
          </div>

          <div
            v-if="existingVersions.length === 0"
            class="empty-versions-card q-pa-md text-center"
          >
            <q-icon
              name="cloud_off"
              size="32px"
              color="blue-grey-4"
              class="q-mb-xs"
            />
            <div class="text-subtitle2 text-slate-700"
              >Aucun build n'a encore été téléversé.</div
            >
            <div class="text-caption text-slate-500">
              Utilisez le formulaire ci-dessous pour ajouter votre premier
              package ZIP (.oap).
            </div>
          </div>

          <div v-else class="versions-grid">
            <div
              v-for="ver in existingVersions"
              :key="ver.id"
              class="version-item-card"
            >
              <div class="row justify-between items-start wrap gap-xs">
                <div class="row items-center gap-sm">
                  <q-avatar
                    size="36px"
                    color="indigo-1"
                    text-color="primary"
                    class="text-weight-bold font-mono"
                  >
                    v{{ ver.version_number }}
                  </q-avatar>
                  <div>
                    <div class="row items-center gap-xs">
                      <span
                        class="text-weight-bold text-slate-900 font-mono text-subtitle2"
                      >
                        Version {{ ver.version_number }}
                      </span>
                      <q-badge
                        :color="getVersionStatus(ver.status).color"
                        class="q-py-xs q-px-xs text-weight-bold"
                      >
                        {{ getVersionStatus(ver.status).label }}
                      </q-badge>
                    </div>
                    <div class="text-caption text-slate-500 q-mt-2xs">
                      Enregistré le
                      {{ formatDate(ver.created_at || ver.published_at) }}
                      <span v-if="ver.package_size">
                        · {{ formatSize(ver.package_size) }}</span
                      >
                    </div>
                  </div>
                </div>

                <div class="row items-center gap-xs">
                  <q-chip
                    v-if="ver.signature_digital"
                    color="teal-1"
                    text-color="teal-9"
                    icon="verified"
                    dense
                    size="11px"
                    class="text-weight-bold"
                  >
                    Certifié PWA Store Security
                  </q-chip>
                </div>
              </div>

              <div
                v-if="ver.hash_sha256"
                class="hash-preview font-mono text-caption text-slate-600 q-mt-xs"
              >
                SHA-256: {{ ver.hash_sha256 }}
              </div>

              <div class="row wrap gap-md q-mt-xs text-caption text-slate-600">
                <div v-if="ver.permissions_required?.length">
                  <b>Permissions :</b> {{ ver.permissions_required.join(', ') }}
                </div>
                <div v-if="ver.domains_whitelist?.length">
                  <b>Domaines autorisés :</b>
                  {{ ver.domains_whitelist.join(', ') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <q-separator class="q-my-md opacity-40" />

        <!-- Formulaire d'ajout d'une nouvelle version -->
        <div class="add-version-form">
          <div
            class="text-subtitle1 text-weight-bold text-slate-800 q-mb-xs row items-center gap-xs"
          >
            <q-icon name="cloud_upload" color="primary" size="20px" />
            Ajouter une nouvelle version (.zip)
          </div>
          <p class="step-hint q-mb-md">
            Téléversez un nouveau package ZIP (.oap) pour déployer une mise à
            jour de votre application.
          </p>

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-6">
              <q-input
                v-model="newVersion.version_number"
                label="Numéro de version (ex: 1.1.0)"
                filled
                dense
                color="primary"
                :rules="[
                  val =>
                    !newVersion.zip_file ||
                    (val && val.length > 0) ||
                    'Numéro requis si un ZIP est fourni'
                ]"
              >
                <template #prepend><q-icon name="tag" /></template>
              </q-input>
            </div>
            <div class="col-12 col-md-6">
              <q-file
                v-model="newVersion.zip_file"
                label="Sélectionner le fichier ZIP (.oap)"
                filled
                dense
                color="primary"
                accept=".zip"
              >
                <template #prepend><q-icon name="attach_file" /></template>
              </q-file>
            </div>
            <div class="col-12">
              <div class="screenshot-group-label">
                <q-icon name="shield" /> Permissions requises par cette version
              </div>
              <div class="row wrap q-gutter-sm">
                <div
                  v-for="perm in availablePermissions"
                  :key="perm"
                  class="checkbox-card"
                >
                  <q-checkbox
                    v-model="newVersion.permissions_required"
                    :val="perm"
                    :label="perm"
                    dense
                    color="primary"
                  />
                </div>
              </div>
            </div>
            <div class="col-12">
              <q-input
                v-model="newVersion.domains_whitelist_raw"
                label="Domaines réseau autorisés (séparés par des virgules)"
                placeholder="ex: api.example.com, cdn.example.com"
                filled
                dense
                color="primary"
              >
                <template #prepend><q-icon name="dns" /></template>
              </q-input>
            </div>
          </div>
        </div>

        <q-stepper-navigation class="row justify-between items-center">
          <div>
            <q-btn
              flat
              no-caps
              label="Retour"
              class="back-step-btn"
              @click="step = 4"
            />
          </div>
          <div class="row q-gutter-sm">
            <q-btn
              unelevated
              no-caps
              icon="save"
              label="Enregistrer les informations"
              color="primary"
              class="save-btn"
              :loading="saving"
              @click="saveAll"
            />
            <q-btn
              v-if="newVersion.zip_file"
              unelevated
              no-caps
              icon="cloud_upload"
              label="Enregistrer & Publier la nouvelle version"
              color="positive"
              class="create-btn"
              :loading="saving"
              @click="saveAll"
            />
          </div>
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'
import { useAuthStore } from '@/stores/auth'
import AppIcon from '@/components/AppIcon.vue'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const appId = route.params.id
const step = ref(1)
const loadingApp = ref(true)
const saving = ref(false)
const currentAppName = ref('')
const existingVersions = ref([])

const isAdmin = computed(() => authStore.user?.role === 'admin')

const categoryOptions = ref([])
const categoriesList = ref([])

const compatibilityOptions = [
  { value: 'mobile', label: 'Mobile' },
  { value: 'tablet', label: 'Tablette' },
  { value: 'desktop', label: 'Ordinateur' },
  { value: 'offline', label: 'Mode hors ligne' },
  { value: 'dark_mode', label: 'Mode sombre' }
]

const availablePermissions = [
  'camera',
  'location',
  'notifications',
  'contacts',
  'storage',
  'audio'
]

const appForm = ref({
  name: '',
  identifier: '',
  category_id: null,
  category: '',
  subcategory: '',
  short_description: '',
  description: '',
  icon_url: '',
  official_site_url: '',
  privacy_policy_url: '',
  support_url: '',
  is_active: true,
  screenshots_mobile: [],
  screenshots_tablet: [],
  compatibility: {
    mobile: true,
    tablet: true,
    desktop: true,
    offline: false,
    dark_mode: false
  }
})

const newVersion = ref({
  version_number: '',
  zip_file: null,
  permissions_required: [],
  domains_whitelist_raw: ''
})

const canContinueIdentity = computed(
  () =>
    appForm.value.name.trim().length > 0 && Boolean(appForm.value.category_id)
)

async function loadCategories() {
  try {
    const res = await api.get('/categories')
    categoriesList.value = res.data
    categoryOptions.value = res.data.map(c => ({
      label: c.name,
      value: c.id,
      icon: c.icon
    }))
  } catch (err) {
    console.error('Erreur chargement des catégories:', err)
  }
}

async function loadApp() {
  loadingApp.value = true
  try {
    await loadCategories()
    const res = await api.get(`/apps/${appId}`)
    const app = res.data

    currentAppName.value = app.name || ''
    appForm.value.name = app.name || ''
    appForm.value.identifier = app.identifier || ''
    appForm.value.is_active =
      app.is_active !== undefined ? Boolean(app.is_active) : true

    if (app.category_id) {
      appForm.value.category_id = app.category_id
    } else if (app.category) {
      const match = categoriesList.value.find(
        c =>
          c.name.toLowerCase() === String(app.category).toLowerCase() ||
          c.slug === app.category
      )
      if (match) {
        appForm.value.category_id = match.id
      } else if (categoryOptions.value.length > 0) {
        appForm.value.category_id = categoryOptions.value[0].value
      }
    } else if (categoryOptions.value.length > 0) {
      appForm.value.category_id = categoryOptions.value[0].value
    }

    appForm.value.category = app.category || ''
    appForm.value.subcategory = app.subcategory || ''
    appForm.value.short_description = app.short_description || ''
    appForm.value.description = app.description || ''
    appForm.value.icon_url = app.icon_url || ''
    appForm.value.official_site_url = app.official_site_url || ''
    appForm.value.privacy_policy_url = app.privacy_policy_url || ''
    appForm.value.support_url = app.support_url || ''

    let compat = app.compatibility
    if (typeof compat === 'string') {
      try {
        compat = JSON.parse(compat)
      } catch (e) {
        compat = null
      }
    }
    if (compat && typeof compat === 'object') {
      appForm.value.compatibility = {
        mobile: compat.mobile !== undefined ? Boolean(compat.mobile) : true,
        tablet: compat.tablet !== undefined ? Boolean(compat.tablet) : true,
        desktop: compat.desktop !== undefined ? Boolean(compat.desktop) : true,
        offline: Boolean(compat.offline),
        dark_mode: Boolean(compat.dark_mode)
      }
    }

    let media = app.media
    if (typeof media === 'string') {
      try {
        media = JSON.parse(media)
      } catch (e) {
        media = null
      }
    }
    if (media?.screenshots?.mobile && Array.isArray(media.screenshots.mobile)) {
      appForm.value.screenshots_mobile = media.screenshots.mobile.map(url => ({
        url,
        existing: true
      }))
    }
    if (media?.screenshots?.tablet && Array.isArray(media.screenshots.tablet)) {
      appForm.value.screenshots_tablet = media.screenshots.tablet.map(url => ({
        url,
        existing: true
      }))
    }

    existingVersions.value = app.versions || []
    if (app.versions?.length > 0) {
      const latestVer = app.versions[0]
      let perms = latestVer.permissions_required
      if (typeof perms === 'string') {
        try {
          perms = JSON.parse(perms)
        } catch (e) {
          perms = []
        }
      }
      newVersion.value.permissions_required = Array.isArray(perms) ? perms : []

      let domains = latestVer.domains_whitelist
      if (typeof domains === 'string') {
        try {
          domains = JSON.parse(domains)
        } catch (e) {
          domains = []
        }
      }
      if (Array.isArray(domains)) {
        newVersion.value.domains_whitelist_raw = domains.join(', ')
      }
    }
  } catch (err) {
    console.error('Erreur lors du chargement de l’application:', err)
    $q.notify({
      type: 'negative',
      message:
        err.response?.data?.message || "Impossible de charger l'application."
    })
    router.push('/developer')
  } finally {
    loadingApp.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'Date inconnue'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatSize(bytes) {
  if (!bytes || isNaN(bytes)) return ''
  const mb = (bytes / (1024 * 1024)).toFixed(1)
  return `${mb} Mo`
}

function getVersionStatus(status) {
  const normalizedStatus = String(status || 'unknown').toLowerCase()
  const statuses = {
    active: { label: 'ACTIVE (DÉPLOYÉE)', color: 'green-7' },
    validated: { label: 'VALIDÉE', color: 'blue-7' },
    approved: { label: 'APPROUVÉE', color: 'green-7' },
    pending: { label: 'EN ATTENTE DE SCAN', color: 'orange-7' },
    quarantined: { label: 'EN QUARANTAINE', color: 'red-7' },
    failed: { label: 'REJETÉE', color: 'red-7' },
    draft: { label: 'BROUILLON', color: 'blue-grey-7' }
  }
  return (
    statuses[normalizedStatus] || {
      label: normalizedStatus.toUpperCase(),
      color: 'blue-grey-7'
    }
  )
}

function addScreenshots(key, event) {
  const files = Array.from(event.target.files || [])
  files.forEach(file => {
    appForm.value[key].push({ file, url: URL.createObjectURL(file) })
  })
  event.target.value = ''
}

function removeScreenshot(key, index) {
  const [removed] = appForm.value[key].splice(index, 1)
  if (removed && removed.url && !removed.existing) {
    URL.revokeObjectURL(removed.url)
  }
}

onBeforeUnmount(() => {
  ;[
    ...appForm.value.screenshots_mobile,
    ...appForm.value.screenshots_tablet
  ].forEach(shot => {
    if (shot.url && !shot.existing) URL.revokeObjectURL(shot.url)
  })
})

async function saveMetaDataOnly() {
  if (!canContinueIdentity.value) {
    step.value = 1
    $q.notify({
      type: 'warning',
      message: 'Complétez les champs d’identité requis.'
    })
    return
  }

  saving.value = true
  try {
    const formData = new FormData()
    formData.append('_method', 'PUT')
    formData.append('name', appForm.value.name)
    formData.append('category_id', appForm.value.category_id)
    formData.append('is_active', appForm.value.is_active ? '1' : '0')

    const selectedCat = categoriesList.value.find(
      c => c.id === appForm.value.category_id
    )
    if (selectedCat) {
      formData.append('category', selectedCat.name)
    }
    if (appForm.value.subcategory) {
      formData.append('subcategory', appForm.value.subcategory)
    }
    formData.append('short_description', appForm.value.short_description || '')
    formData.append('description', appForm.value.description || '')
    formData.append('icon_url', appForm.value.icon_url || '')
    formData.append('official_site_url', appForm.value.official_site_url || '')
    formData.append(
      'privacy_policy_url',
      appForm.value.privacy_policy_url || ''
    )
    formData.append('support_url', appForm.value.support_url || '')

    Object.entries(appForm.value.compatibility)
      .filter(([, checked]) => checked)
      .forEach(([key]) => formData.append(`compatibility[${key}]`, 1))

    appForm.value.screenshots_mobile.forEach((shot, index) => {
      if (shot.file) {
        formData.append(`media[screenshots][mobile][${index}]`, shot.file)
      }
    })
    appForm.value.screenshots_tablet.forEach((shot, index) => {
      if (shot.file) {
        formData.append(`media[screenshots][tablet][${index}]`, shot.file)
      }
    })

    await api.post(`/apps/${appId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    $q.notify({
      type: 'positive',
      message:
        'Informations et statut de l’application enregistrés avec succès.'
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Erreur lors de la mise à jour'
    })
  } finally {
    saving.value = false
  }
}

async function saveAll() {
  await saveMetaDataOnly()

  if (newVersion.value.zip_file) {
    if (!newVersion.value.version_number.trim()) {
      $q.notify({
        type: 'warning',
        message: 'Indiquez le numéro de version du nouveau build.'
      })
      step.value = 5
      return
    }

    saving.value = true
    try {
      const buildData = new FormData()
      buildData.append('application_id', appId)
      buildData.append('version_number', newVersion.value.version_number)
      buildData.append('zip_file', newVersion.value.zip_file)

      newVersion.value.permissions_required.forEach((perm, index) => {
        buildData.append(`permissions_required[${index}]`, perm)
      })

      newVersion.value.domains_whitelist_raw
        .split(',')
        .map(d => d.trim())
        .filter(Boolean)
        .forEach((dom, index) => {
          buildData.append(`domains_whitelist[${index}]`, dom)
        })

      await api.post('/versions', buildData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      $q.notify({
        type: 'positive',
        message: 'Nouvelle version téléversée et enregistrée avec succès.'
      })
      await loadApp()
      newVersion.value.zip_file = null
      newVersion.value.version_number = ''
    } catch (buildErr) {
      if (buildErr.response?.data?.error_code === 'PACKAGE_VALIDATION_FAILED') {
        showValidationErrorDialog(buildErr.response.data)
      } else {
        $q.notify({
          type: 'negative',
          message:
            buildErr.response?.data?.message ||
            'Erreur lors de l’upload du build'
        })
      }
    } finally {
      saving.value = false
    }
  } else {
    router.push('/developer')
  }
}

function showValidationErrorDialog(data) {
  const analysis = data.analysis || {}
  const sections = []

  if (analysis.errors?.length) {
    sections.push(
      '<div class="text-negative text-weight-bold q-mb-xs">Erreurs bloquantes</div><ul class="q-mb-md">' +
        analysis.errors.map(e => `<li>${escapeHtml(e)}</li>`).join('') +
        '</ul>'
    )
  }
  if (analysis.warnings?.length) {
    sections.push(
      '<div class="text-warning text-weight-bold q-mb-xs">Avertissements</div><ul class="q-mb-md">' +
        analysis.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('') +
        '</ul>'
    )
  }

  const message =
    `<div class="q-mb-md">${escapeHtml(data.message || 'Le package ne respecte pas les exigences de publication PWA Store.')}</div>` +
    sections.join('')

  $q.dialog({
    title: 'Package rejeté',
    message,
    html: true,
    ok: { label: 'Compris', color: 'primary' }
  })
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function confirmDeleteApp() {
  $q.dialog({
    title: 'Supprimer l’application',
    message: `Êtes-vous sûr de vouloir supprimer définitivement "${currentAppName.value}" ? Seul un administrateur peut effectuer cette action.`,
    cancel: { label: 'Annuler', flat: true },
    ok: { label: 'Supprimer', color: 'negative' },
    persistent: true
  }).onOk(deleteApp)
}

async function deleteApp() {
  try {
    await api.delete(`/apps/${appId}`)
    $q.notify({
      type: 'positive',
      message: 'Application supprimée avec succès.'
    })
    router.push('/developer')
  } catch (err) {
    $q.notify({
      type: 'negative',
      message:
        err.response?.data?.message ||
        'Seul un administrateur peut supprimer une application.'
    })
  }
}

onMounted(() => {
  loadApp()
})
</script>

<style scoped lang="scss">
.edit-app-page {
  background: var(--page);
  color: var(--text);
  padding: 14px var(--ui-page-gutter) 30px;
}
.back-btn {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  transition: color 0.2s ease;
  &:hover {
    color: var(--pwa-link);
  }
}
.console-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
  color: var(--pwa-link);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.console-title {
  color: var(--text);
  font-size: clamp(20px, 2.2vw, 26px);
  font-weight: 850;
  letter-spacing: -0.02em;
  margin: 0;
}
.console-subtitle {
  color: var(--muted);
  font-size: 12px;
  margin-top: 2px;
  line-height: 1.4;
}

.active-toggle-badge {
  background: var(--pwa-surface);
  border: 1px solid var(--pwa-border);
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.visibility-card {
  background: var(--pwa-surface) !important;
  border: 1px solid var(--pwa-border) !important;
  border-radius: 12px;

  .font-size-13 {
    font-size: 13px;
  }
}

.edit-app-stepper {
  width: 100%;
  background: var(--glass);
  border: 1px solid var(--outline);
  border-radius: 14px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(16px);
  overflow: hidden;
}

/* Keep form controls readable in both native Quasar themes. */
.edit-app-stepper :deep(.q-field) {
  .q-field__native,
  .q-field__prefix,
  .q-field__suffix,
  .q-field__input,
  input,
  textarea,
  .q-select__focus-target {
    color: var(--pwa-text) !important;
    font-weight: 600 !important;
    -webkit-text-fill-color: var(--pwa-text) !important;
  }

  .q-field__label {
    color: var(--pwa-muted) !important;
    font-weight: 600 !important;
  }

  &.q-field--filled .q-field__control {
    background: var(--pwa-surface) !important;
    border: 1px solid var(--pwa-border) !important;
    border-radius: 10px !important;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease;

    &:before {
      display: none !important;
    }
  }

  &.q-field--focused .q-field__control {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent) !important;
  }

  .q-field__prepend .q-icon,
  .q-field__append .q-icon {
    color: var(--pwa-muted) !important;
  }
}

.edit-app-stepper :deep(.checkbox-card) {
  background: var(--pwa-surface) !important;
  border: 1px solid var(--pwa-border) !important;
  border-radius: 10px;
  padding: 6px 12px;

  .q-checkbox__label {
    color: var(--pwa-text) !important;
    font-weight: 600 !important;
  }
}

/* Versions list styling */
.versions-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.version-item-card {
  background: var(--pwa-surface);
  border: 1px solid var(--pwa-border);
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.empty-versions-card {
  background: var(--pwa-surface);
  border: 1px dashed var(--pwa-border);
  border-radius: 12px;
}

.hash-preview {
  background: var(--pwa-background);
  border: 1px solid var(--pwa-border);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
}

.create-btn {
  min-height: 40px;
  padding: 0 16px;
  color: var(--pwa-on-primary);
  background: var(--primary);
  font-weight: 700;
  border-radius: 11px;
  font-size: 12px;
}
.save-btn {
  min-height: 40px;
  padding: 0 16px;
  font-weight: 700;
  border-radius: 11px;
  font-size: 12px;
}
.delete-app-btn {
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
}
.back-step-btn {
  color: var(--muted);
  font-weight: 600;
}
.step-hint {
  color: var(--muted);
  font-size: 12px;
  margin-bottom: 14px;
}
.screenshot-group-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}
.screenshot-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.screenshot-thumb {
  position: relative;
  width: 90px;
  height: 140px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--outline);
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
.screenshot-thumb-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: var(--pwa-on-primary);
}
.screenshot-dropzone {
  width: 90px;
  height: 140px;
  border: 1px dashed var(--outline);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--muted);
  font-size: 11px;
  cursor: pointer;
  transition:
    border-color 0.2s,
    color 0.2s;
  &:hover {
    border-color: var(--pwa-link);
    color: var(--pwa-link);
  }
}
</style>
