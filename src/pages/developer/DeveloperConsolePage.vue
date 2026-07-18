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
        @click="showCreateAppDialog = true"
      />
    </div>

    <!-- Apps list -->
    <div v-if="loading" class="row justify-center q-my-xl" id="applications">
      <q-spinner-orbit color="indigo" size="48px" />
    </div>

    <div
      v-else-if="myApps.length === 0"
      class="text-center q-my-xl"
      id="applications"
    >
      <q-avatar size="64px" class="bg-indigo-900 q-mb-md">
        <q-icon name="code" color="indigo-200" size="36px" />
      </q-avatar>
      <div class="text-h6 text-indigo-200">Aucune application soumise</div>
      <div class="text-caption text-indigo-400 q-mb-md">
        Commencez par soumettre votre première application Web.
      </div>
      <q-btn
        unelevated
        no-caps
        label="Créer une application"
        class="create-btn"
        @click="showCreateAppDialog = true"
      />
    </div>

    <div v-else class="row q-col-gutter-md" id="applications">
      <div v-for="app in myApps" :key="app.id" class="col-12">
        <q-card class="glass-panel app-console-card">
          <div class="row justify-between items-start no-wrap q-mb-md">
            <div class="row items-center">
              <q-avatar
                size="44px"
                class="q-mr-md bg-indigo-900 border-indigo-sm rounded-borders"
              >
                <q-img
                  :src="
                    app.icon_url ||
                    'https://cdn-icons-png.flaticon.com/512/8422/8422116.png'
                  "
                />
              </q-avatar>
              <div>
                <div class="text-subtitle1 text-white text-weight-bold">{{
                  app.name
                }}</div>
                <div class="text-caption text-indigo-300 font-mono">{{
                  app.identifier
                }}</div>
              </div>
            </div>

            <div class="row items-center q-gutter-xs">
              <q-badge
                :color="getStatusColor(app.status)"
                class="q-py-xs q-px-sm text-weight-bold"
              >
                {{ app.status.toUpperCase() }}
              </q-badge>
              <q-btn
                unelevated
                no-caps
                icon="cloud_upload"
                label="Nouveau build (ZIP)"
                class="upload-btn"
                @click="openUploadDialog(app)"
              />
            </div>
          </div>

          <div class="text-caption text-indigo-200 q-mb-md">
            {{ app.description || 'Pas de description renseignée.' }}
          </div>

          <!-- Versions Table -->
          <div class="q-mt-md">
            <div class="text-subtitle2 text-indigo-300 q-mb-xs">
              Historique des versions (.zip)
            </div>
            <q-list dark separator class="version-list overflow-hidden">
              <q-item
                v-if="app.versions?.length === 0"
                class="text-indigo-400 italic text-caption"
              >
                <q-item-section
                  >Aucun build chargé. Veuillez téléverser un fichier
                  ZIP.</q-item-section
                >
              </q-item>

              <q-item v-for="ver in app.versions" :key="ver.id" class="q-py-sm">
                <q-item-section>
                  <div class="row items-center q-gutter-xs">
                    <span class="text-weight-bold text-white text-subtitle2"
                      >v{{ ver.version_number }}</span
                    >
                    <q-badge color="indigo-9" dense>
                      SHA256: {{ ver.hash_sha256.substring(0, 16) }}...
                    </q-badge>
                  </div>
                  <div class="text-caption text-indigo-400">
                    Permissions :
                    {{ ver.permissions_required?.join(', ') || 'aucune' }}
                  </div>
                </q-item-section>

                <q-item-section side>
                  <span class="text-caption text-indigo-400 font-mono">
                    {{ ver.signature_digital ? 'Signé' : 'Non signé' }}
                  </span>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card>
      </div>
    </div>

    <!-- Create App Dialog -->
    <q-dialog v-model="showCreateAppDialog" persistent>
      <q-card class="dialog-card q-pa-md" style="width: 500px; max-width: 90vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6 text-white text-weight-bold"
            >Créer une Application</div
          >
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="createApp" class="q-gutter-md">
            <q-input
              v-model="newApp.name"
              label="Nom de l'application"
              filled
              dark
              color="indigo-500"
              required
              :rules="[val => (val && val.length > 0) || 'Nom requis']"
            />

            <q-input
              v-model="newApp.identifier"
              label="Identifiant unique (ex: com.example.myapp)"
              filled
              dark
              color="indigo-500"
              required
              :rules="[val => (val && val.length > 0) || 'Identifiant requis']"
            />

            <q-select
              v-model="newApp.category"
              :options="['Jeux', 'Productivité', 'Social', 'Utilitaires']"
              label="Catégorie"
              filled
              dark
              color="indigo-500"
            />

            <q-input
              v-model="newApp.icon_url"
              label="URL de l'icône"
              filled
              dark
              color="indigo-500"
            />

            <q-input
              v-model="newApp.description"
              type="textarea"
              label="Description"
              filled
              dark
              color="indigo-500"
              rows="3"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn flat label="Annuler" v-close-popup />
              <q-btn
                label="Soumettre"
                type="submit"
                color="indigo-600"
                :loading="creatingApp"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

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
              dark
              color="indigo-500"
              required
              :rules="[val => (val && val.length > 0) || 'Numéro requis']"
            />

            <q-file
              v-model="newVersion.zip_file"
              label="Sélectionner le fichier ZIP (.oap)"
              filled
              dark
              color="indigo-500"
              accept=".zip"
              required
              :rules="[val => val || 'Fichier ZIP requis']"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>

            <div class="text-subtitle2 text-indigo-300"
              >Permissions requises par l'application :</div
            >
            <div class="row wrap q-gutter-sm">
              <q-checkbox
                v-for="perm in availablePermissions"
                :key="perm"
                v-model="newVersion.permissions_required"
                :val="perm"
                :label="perm"
                dark
                color="indigo"
              />
            </div>

            <q-input
              v-model="newVersion.domains_whitelist_raw"
              label="Domaines réseau autorisés (séparés par des virgules)"
              placeholder="ex: api.example.com, cdn.example.com"
              filled
              dark
              color="indigo-500"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn flat label="Annuler" v-close-popup />
              <q-btn
                label="Uploader & Signer"
                type="submit"
                color="indigo-600"
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
import { ref, onMounted } from 'vue'
import { api } from '@/boot/axios'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const myApps = ref([])
const loading = ref(true)

const showCreateAppDialog = ref(false)
const creatingApp = ref(false)
const newApp = ref({
  name: '',
  identifier: '',
  category: 'Productivité',
  icon_url: '',
  description: ''
})

const showUploadDialog = ref(false)
const uploadingBuild = ref(false)
const selectedAppForUpload = ref(null)
const newVersion = ref({
  version_number: '',
  zip_file: null,
  permissions_required: [],
  domains_whitelist_raw: ''
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

async function createApp() {
  creatingApp.value = true
  try {
    await api.post('/apps', newApp.value)
    $q.notify({
      type: 'positive',
      message: 'Application soumise avec succès. En attente de validation.'
    })
    showCreateAppDialog.value = false
    newApp.value = {
      name: '',
      identifier: '',
      category: 'Productivité',
      icon_url: '',
      description: ''
    }
    await fetchMyApps()
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Erreur lors de la création'
    })
  } finally {
    creatingApp.value = false
  }
}

function openUploadDialog(app) {
  selectedAppForUpload.value = app
  newVersion.value = {
    version_number: '',
    zip_file: null,
    permissions_required: [],
    domains_whitelist_raw: ''
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

    const domains = newVersion.value.domains_whitelist_raw
      .split(',')
      .map(d => d.trim())
      .filter(d => d.length > 0)

    domains.forEach((dom, index) => {
      formData.append(`domains_whitelist[${index}]`, dom)
    })

    await api.post('/versions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    $q.notify({
      type: 'positive',
      message: 'Nouveau build téléversé et signé avec succès par OneShield !'
    })
    showUploadDialog.value = false
    await fetchMyApps()
  } catch (err) {
    if (err.response?.data?.error_code === 'MISSING_PWA_FILES') {
      $q.dialog({
        title: 'Fichiers PWA manquants',
        message:
          'Votre archive ne contient pas de fichier "manifest.json" ou de "service-worker.js".\n\nVoulez-vous que OneInstall génère automatiquement ces fichiers pour rendre votre application installable en tant que PWA ?',
        cancel: {
          label: "Annuler l'upload",
          color: 'negative',
          flat: true
        },
        ok: {
          label: 'Oui, générer automatiquement',
          color: 'indigo'
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

onMounted(() => {
  fetchMyApps()
})
</script>

<style scoped lang="scss">
.console-page {
  background: var(--page);
  color: var(--text);
  padding: 28px clamp(18px, 3vw, 42px) 48px;
}
.console-hero {
  gap: 18px;
  padding: 26px;
  background:
    radial-gradient(
      circle at 85% 20%,
      color-mix(in srgb, var(--primary) 16%, transparent),
      transparent 28%
    ),
    linear-gradient(125deg, var(--surface-low), var(--surface));
  border: 1px solid var(--outline);
  border-radius: 20px;
  box-shadow: var(--ui-shadow-sm);
}
.console-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
  color: var(--primary);
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
  padding: 22px;
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
.console-page :deep(.text-white),
.dialog-card :deep(.text-white) {
  color: var(--text) !important;
}
.console-page :deep(.text-indigo-200),
.console-page :deep(.text-indigo-300),
.console-page :deep(.text-indigo-400) {
  color: var(--muted) !important;
}
.console-page :deep(.q-list--dark) {
  color: var(--text);
}
.create-btn {
  min-height: 44px;
  padding: 0 16px;
  color: #fff;
  background: linear-gradient(135deg, #6e69f1, #7740c0);
  font-weight: 700;
  border-radius: 11px;
  box-shadow: 0 10px 24px rgba(102, 87, 224, 0.22);
  font-size: 12px;
}
.upload-btn {
  background: var(--surface-highest);
  color: var(--primary);
  font-weight: 700;
  border-radius: 10px;
  font-size: 11px;
}
.version-list {
  background: var(--surface-low);
  border: 1px solid var(--outline);
  border-radius: 12px;
}
.dialog-card {
  background: var(--surface);
  border: 1px solid var(--outline);
  border-radius: 18px;
  color: var(--text);
}
@media (max-width: 700px) {
  .console-hero {
    align-items: flex-start;
    padding: 19px;
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
</style>
