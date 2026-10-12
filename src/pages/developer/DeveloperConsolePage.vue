<template>
  <q-page class="console-page">
    <div class="console-hero row justify-between items-center q-mb-lg">
      <div>
        <span class="console-eyebrow"
          ><q-icon name="code" /> Votre workspace</span
        >
        <h1 class="console-title">Construisez la prochaine expérience.</h1>
        <div class="console-subtitle">
          Soumettez vos applications Web et gérez vos builds (.oap / ZIP)
        </div>
      </div>
      <q-btn
        unelevated
        no-caps
        icon="add"
        label="Créer une application"
        class="create-btn"
        to="/developer/apps/create"
        :disable="!authStore.canCreateApp"
      />
    </div>

    <q-banner v-if="!authStore.canCreateApp" class="workspace-alert"
      >Votre profil doit être complet et validé avant toute création
      d’application, même en brouillon.
      <q-btn flat to="/developer/profile" label="Compléter mon profil"
    /></q-banner>
    <!-- Apps list -->
    <div v-if="loading" class="row justify-center q-my-xl" id="applications">
      <q-spinner-orbit color="primary" size="48px" />
    </div>

    <div
      v-else-if="myApps.length === 0"
      class="text-center q-my-xl"
      id="applications"
    >
      <q-avatar size="64px" class="bg-blue-grey-900 q-mb-md">
        <q-icon name="code" color="blue-grey-200" size="36px" />
      </q-avatar>
      <div class="text-h6 text-blue-grey-200">Aucune application soumise</div>
      <div class="text-caption text-blue-grey-400 q-mb-md">
        Commencez par soumettre votre première application Web.
      </div>
      <q-btn
        unelevated
        no-caps
        label="Créer une application"
        class="create-btn"
        to="/developer/apps/create"
        :disable="!authStore.canCreateApp"
      />
    </div>

    <div v-else class="row q-col-gutter-md" id="applications">
      <div v-for="app in myApps" :key="app.id" class="col-12 col-md-6 col-lg-4">
        <q-card
          class="glass-panel app-console-card h-full flex column justify-between"
        >
          <div>
            <div class="row justify-between items-start no-wrap q-mb-sm">
              <div
                class="row items-center app-title-clickable cursor-pointer"
                @click="$router.push(`/developer/apps/${app.id}/publication`)"
              >
                <q-avatar
                  size="44px"
                  class="q-mr-md bg-blue-grey-900 border-blue-grey-sm rounded-borders"
                >
                  <AppIcon
                    :src="app.icon_url"
                    :alt="`Icône de ${app.name}`"
                    fallback-icon="apps"
                  />
                </q-avatar>
                <div>
                  <div
                    class="text-subtitle1 text-white text-weight-bold app-name-hover row items-center gap-xs"
                  >
                    <span>{{ app.name }}</span>
                    <q-icon name="edit" size="14px" class="text-blue-grey-4" />
                  </div>
                  <div class="text-caption text-blue-grey-300 font-mono">{{
                    app.identifier
                  }}</div>
                </div>
              </div>
            </div>

            <div class="row items-center wrap gap-xs q-mb-sm">
              <q-chip
                v-if="app.versions?.length > 0"
                dense
                size="11px"
                color="indigo-9"
                text-color="indigo-2"
                class="text-weight-bold font-mono"
              >
                v{{ app.versions[0].version_number }}
              </q-chip>
              <q-badge
                v-if="app.is_active === false || app.is_active === 0"
                color="amber-9"
                class="q-py-xs q-px-sm text-weight-bold"
              >
                INACTIVE
              </q-badge>
              <q-badge
                :color="statusColor(app.status)"
                class="q-py-xs q-px-sm text-weight-bold"
              >
                {{ statusLabel(app.status) }}
              </q-badge>
            </div>

            <div class="text-caption text-blue-grey-200 q-mb-md line-clamp-2">
              {{
                app.short_description ||
                app.description ||
                'Pas de description renseignée.'
              }}
            </div>
          </div>

          <div
            class="row justify-between items-center q-pt-sm border-top-subtle"
          >
            <q-btn
              flat
              no-caps
              dense
              icon="edit"
              label="Modifier"
              color="primary"
              class="text-caption text-weight-bold"
              @click="$router.push(`/developer/apps/${app.id}/publication`)"
            />
            <div class="row items-center gap-xs">
              <q-btn
                unelevated
                no-caps
                dense
                icon="cloud_upload"
                label="Nouveau build"
                class="upload-btn q-px-sm"
                @click="openUploadDialog(app)"
              />
              <q-btn
                v-if="isAdmin"
                flat
                round
                dense
                icon="inventory_2"
                class="delete-btn"
                aria-label="Archiver l'application"
                @click="confirmDeleteApp(app)"
              />
            </div>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Upload Build Dialog -->
    <q-dialog v-model="showUploadDialog" persistent>
      <q-card class="dialog-card q-pa-md" style="width: 500px; max-width: 90vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-white text-weight-bold">
            Uploader un build pour {{ selectedAppForUpload?.name }}
          </div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="uploadBuild" class="q-gutter-md">
            <q-input
              v-model="newVersion.version_number"
              label="Numéro de version (ex: 1.0.0)"
              filled
              color="blue-grey-500"
              required
              :rules="[val => (val && val.length > 0) || 'Numéro requis']"
            />

            <q-file
              v-model="newVersion.zip_file"
              label="Sélectionner le fichier ZIP (.oap)"
              filled
              color="blue-grey-500"
              accept=".zip"
              required
              :rules="[val => val || 'Fichier ZIP requis']"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>

            <div class="text-subtitle2 text-blue-grey-300"
              >Permissions requises par l'application :</div
            >
            <div class="row wrap q-gutter-sm">
              <q-checkbox
                v-for="perm in availablePermissions"
                :key="perm"
                v-model="newVersion.permissions_required"
                :val="perm"
                :label="perm"
                color="primary"
              />
            </div>

            <p class="text-caption"
              >Les domaines et ressources externes seront détectés
              automatiquement à l’import du ZIP et transmis à l’équipe de
              validation. Aucune déclaration manuelle n’est nécessaire.</p
            >

            <div class="row justify-end q-gutter-sm">
              <q-btn flat label="Annuler" v-close-popup />
              <q-btn
                label="Uploader & Signer"
                type="submit"
                color="blue-grey-600"
                :loading="uploadingBuild"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
import { computed, ref, onMounted } from 'vue'
import { api } from '@/boot/axios'
import AppIcon from '@/components/AppIcon.vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'
import { statusColor, statusLabel } from '@/utils/appStatus'

const $q = useQuasar()
const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.role === 'admin')

const myApps = ref([])
const loading = ref(true)

const showUploadDialog = ref(false)
const uploadingBuild = ref(false)
const selectedAppForUpload = ref(null)
const newVersion = ref({
  version_number: '',
  zip_file: null,
  permissions_required: []
})

const availablePermissions = [
  'camera',
  'location',
  'notifications',
  'contacts',
  'storage',
  'audio'
]

async function fetchMyApps() {
  loading.value = true
  try {
    const response = await api.get('/developer/apps')
    myApps.value = response.data
  } catch (err) {
    console.error('Error fetching developer apps', err)
  } finally {
    loading.value = false
  }
}

function openUploadDialog(app) {
  selectedAppForUpload.value = app
  newVersion.value = {
    version_number: '',
    zip_file: null,
    permissions_required: []
  }
  showUploadDialog.value = true
}

async function uploadBuild(autoGenerate = false) {
  const shouldGenerate = autoGenerate === true
  uploadingBuild.value = true
  try {
    const formData = new FormData()
    formData.append('application_id', selectedAppForUpload.value.id)
    formData.append('version_number', newVersion.value.version_number)
    formData.append('zip_file', newVersion.value.zip_file)
    if (shouldGenerate) {
      formData.append('auto_generate_pwa', 1)
    }

    newVersion.value.permissions_required.forEach((perm, index) => {
      formData.append(`permissions_required[${index}]`, perm)
    })

    const { data: uploadedVersion } = await api.post('/versions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    $q.notify({
      type: 'positive',
      message: `${uploadedVersion.detected_domains?.length || 0} domaines détectés automatiquement. Consultez le rapport avant soumission.`
    })
    showUploadDialog.value = false
    await fetchMyApps()
    router.push(`/developer/apps/${selectedAppForUpload.value.id}/publication`)
  } catch (err) {
    if (err.response?.data?.error_code === 'MISSING_PWA_FILES') {
      $q.dialog({
        title: 'Fichiers PWA manquants',
        message:
          'Votre archive ne contient pas de fichier "manifest.json" ou de "service-worker.js".\n\nVoulez-vous que PWA Store génère automatiquement ces fichiers pour rendre votre application installable en tant que PWA ?',
        cancel: {
          label: "Annuler l'upload",
          color: 'negative',
          flat: true
        },
        ok: {
          label: 'Oui, générer automatiquement',
          color: 'primary'
        },
        persistent: true
      })
        .onOk(() => {
          uploadBuild(true)
        })
        .onCancel(() => {
          $q.notify({
            type: 'warning',
            message: 'Upload annulé par le développeur.'
          })
        })
    } else if (err.response?.data?.error_code === 'PACKAGE_VALIDATION_FAILED') {
      showValidationErrorDialog(err.response.data)
    } else {
      $q.notify({
        type: 'negative',
        message: err.response?.data?.message || "Erreur lors de l'upload"
      })
    }
  } finally {
    uploadingBuild.value = false
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

function confirmDeleteApp(app) {
  $q.dialog({
    title: 'Archiver l’application',
    message: `Archiver "${app.name}" ? Elle sera retirée du Store ; ses builds et son historique sont conservés.`,
    cancel: { label: 'Annuler', flat: true },
    ok: { label: 'Archiver', color: 'negative' },
    persistent: true
  }).onOk(() => deleteApp(app))
}

async function deleteApp(app) {
  try {
    await api.delete(`/apps/${app.id}`)
    $q.notify({ type: 'positive', message: 'Application archivée.' })
    await fetchMyApps()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Erreur lors de la suppression'
    })
  }
}

function getVersionStatus(status) {
  const normalizedStatus = String(status || 'unknown').toLowerCase()
  const statuses = {
    approved: { label: 'APPROUVÉE', color: 'green-7' },
    published: { label: 'PUBLIÉE', color: 'green-7' },
    active: { label: 'ACTIVE', color: 'green-7' },
    pending: { label: 'EN ATTENTE', color: 'orange-7' },
    processing: { label: 'EN TRAITEMENT', color: 'blue-7' },
    draft: { label: 'BROUILLON', color: 'blue-grey-7' },
    rejected: { label: 'REJETÉE', color: 'red-7' },
    quarantined: { label: 'EN QUARANTAINE', color: 'red-7' },
    inactive: { label: 'INACTIVE', color: 'blue-grey-7' },
    unknown: { label: 'NON RENSEIGNÉ', color: 'blue-grey-7' }
  }

  return (
    statuses[normalizedStatus] || {
      label: normalizedStatus.replaceAll('_', ' ').toUpperCase(),
      color: 'blue-grey-7'
    }
  )
}

onMounted(() => {
  fetchMyApps()
})
</script>

<style scoped lang="scss">
.console-page {
  background: var(--page);
  color: var(--text);
  padding: 18px var(--ui-page-gutter) 28px;
}
.console-hero {
  gap: 14px;
  padding: 18px;
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 16px;
  box-shadow: var(--ui-shadow-sm);
}
.console-eyebrow {
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
.console-title {
  color: var(--text);
  font-size: clamp(22px, 2.4vw, 30px);
  font-weight: 800;
  margin: 0;
}
.console-subtitle {
  color: var(--muted);
  font-size: 13px;
  margin-top: 4px;
}
.app-console-card {
  background: var(--glass);
  border: 1px solid var(--outline);
  border-radius: 17px;
  padding: 16px;
  box-shadow: var(--ui-shadow-sm);
  transition:
    transform 0.25s var(--ui-ease),
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}
.app-console-card:hover {
  border-color: color-mix(in srgb, var(--primary) 26%, var(--outline));
  box-shadow: var(--ui-shadow-md);
  transform: translateY(-2px);
}
.console-page :deep(.text-white) {
  color: var(--text) !important;
}
.dialog-card :deep(.text-white) {
  color: var(--pwa-text) !important;
}
.console-page :deep(.text-blue-grey-200),
.console-page :deep(.text-blue-grey-300),
.console-page :deep(.text-blue-grey-400) {
  color: var(--muted) !important;
}
.console-page :deep(.q-list--dark) {
  color: var(--text);
}
.create-btn {
  min-height: 40px;
  padding: 0 16px;
  color: var(--pwa-on-primary);
  background: var(--primary);
  font-weight: 700;
  border-radius: 11px;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--primary) 22%, transparent);
  font-size: 12px;
}
.upload-btn {
  background: var(--surface-highest);
  color: var(--pwa-link);
  font-weight: 700;
  border-radius: 10px;
  font-size: 11px;
}
.delete-btn {
  color: var(--muted);
}
.delete-btn:hover {
  color: var(--q-negative);
}
.version-list {
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 12px;
}
.dialog-card {
  color: var(--pwa-text);
  background: var(--pwa-surface);
  border: 1px solid rgba(24, 24, 27, 0.12);
  border-radius: 18px;
}
.console-hero.q-mb-lg {
  margin-bottom: 16px;
}
@media (max-width: 700px) {
  .console-hero {
    align-items: flex-start;
    padding: 15px;
  }
  .console-hero .create-btn {
    width: 100%;
  }
  .app-console-card {
    padding: 15px;
  }
  .app-console-card > .row:first-child {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }
}

.app-title-clickable:hover .app-name-hover {
  color: var(--primary) !important;
  text-decoration: underline;
}
</style>
