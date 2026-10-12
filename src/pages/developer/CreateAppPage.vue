<template>
  <q-page class="create-app-page">
    <div class="create-app-hero q-mb-md">
      <q-btn
        flat
        no-caps
        dense
        icon="arrow_back"
        label="Retour"
        class="back-btn q-mb-xs"
        to="/developer"
      />
      <span class="console-eyebrow"
        ><q-icon name="add_circle" /> Nouvelle fiche</span
      >
      <h1 class="console-title">Créer une application</h1>
      <div class="console-subtitle">
        Renseignez toutes les informations de la fiche, étape par étape. Vous
        pourrez ensuite téléverser un build (.zip) depuis votre console.
      </div>
    </div>

    <q-stepper
      :contracted="$q.screen.lt.sm"
      v-model="step"
      class="create-app-stepper glass-panel"
      flat
      color="primary"
      animated
      header-nav
    >
      <q-step
        :name="1"
        title="Identité"
        icon="badge"
        caption="Nom, catégorie, description"
        :done="step > 1"
      >
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-6">
            <q-input
              v-model="newApp.name"
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
              v-model="newApp.identifier"
              label="Identifiant unique (ex: com.example.myapp)"
              filled
              dense
              color="primary"
              required
              :rules="[val => (val && val.length > 0) || 'Identifiant requis']"
            >
              <template #prepend><q-icon name="fingerprint" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="newApp.category_id"
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
              v-model="newApp.subcategory"
              label="Sous-catégorie"
              filled
              dense
              color="primary"
            >
              <template #prepend><q-icon name="sell" /></template>
            </q-input>
          </div>
          <div class="col-12">
            <q-input
              v-model="newApp.short_description"
              label="Description courte"
              maxlength="280"
              counter
              filled
              dense
              color="primary"
            />
          </div>
          <div class="col-12"
            ><CountrySelect
              v-model="newApp.countries"
              multiple
              value-field="code"
              label="Pays de disponibilité (vide : tous les pays)"
          /></div>
          <div class="col-12">
            <q-input
              v-model="newApp.description"
              type="textarea"
              label="Description complète"
              rows="3"
              filled
              dense
              color="primary"
            />
          </div>
        </div>

        <q-stepper-navigation>
          <q-btn
            unelevated
            no-caps
            label="Continuer"
            class="create-btn"
            :disable="!canContinueIdentity"
            @click="step = 2"
          />
        </q-stepper-navigation>
      </q-step>

      <q-step
        :name="2"
        title="Média & liens"
        icon="link"
        caption="Icône et pages associées"
        :done="step > 2"
      >
        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-6">
            <q-input
              v-model="newApp.icon_url"
              label="URL de l'icône"
              filled
              dense
              color="primary"
            >
              <template #prepend><q-icon name="image" /></template>
            </q-input>
          </div>
          <div class="col-12 col-md-6">
            <q-input
              v-model="newApp.official_site_url"
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
              v-model="newApp.privacy_policy_url"
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
              v-model="newApp.support_url"
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

        <q-stepper-navigation>
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
        </q-stepper-navigation>
      </q-step>

      <q-step
        :name="3"
        title="Captures d'écran"
        icon="image"
        caption="Visuels mobile et tablette"
        :done="step > 3"
      >
        <p class="step-hint">
          Importez au moins une capture d'écran mobile. Ces visuels seront
          affichés sur la fiche publique de l'application.
        </p>

        <div class="screenshot-group-label">
          <q-icon name="smartphone" /> Captures mobile
        </div>
        <div class="screenshot-grid q-mb-sm">
          <div
            v-for="(shot, index) in newApp.screenshots_mobile"
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
            v-for="(shot, index) in newApp.screenshots_tablet"
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

        <q-stepper-navigation>
          <q-btn
            unelevated
            no-caps
            label="Continuer"
            class="create-btn"
            :disable="!canContinueScreenshots"
            @click="step = 4"
          />
          <q-btn
            flat
            no-caps
            label="Retour"
            class="q-ml-sm back-step-btn"
            @click="step = 2"
          />
        </q-stepper-navigation>
      </q-step>

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
              v-model="newApp.compatibility[option.value]"
              :label="option.label"
              dense
              color="primary"
            />
          </div>
        </div>

        <q-stepper-navigation>
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
        </q-stepper-navigation>
      </q-step>

      <q-step
        :name="5"
        title="Premier build"
        icon="cloud_upload"
        caption="Version initiale (.zip), optionnel"
      >
        <p class="step-hint">
          Vous pouvez importer un premier build maintenant, ou passer cette
          étape et téléverser une version plus tard depuis votre console.
        </p>

        <div class="row q-col-gutter-sm">
          <div class="col-12 col-md-6">
            <q-input
              v-model="newVersion.version_number"
              label="Numéro de version (ex: 1.0.0)"
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
              label="Fichier ZIP (.oap)"
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
              <q-icon name="shield" /> Permissions requises
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
            <p class="text-caption"
              >Les domaines et ressources externes seront détectés
              automatiquement à l’import du ZIP et transmis à l’équipe de
              validation. Aucune déclaration manuelle n’est nécessaire.</p
            >
          </div>
        </div>

        <q-stepper-navigation>
          <q-btn
            unelevated
            no-caps
            label="Créer l'application"
            class="create-btn"
            :loading="creatingApp"
            @click="createApp"
          />
          <q-btn
            flat
            no-caps
            label="Retour"
            class="q-ml-sm back-step-btn"
            @click="step = 4"
          />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
  </q-page>
</template>

<script setup>
import CountrySelect from '@/components/CountrySelect.vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from '@/boot/axios'

const router = useRouter()
const $q = useQuasar()

const step = ref(1)

const categoryOptions = ref([])
const categoriesList = ref([])

async function loadCategories() {
  try {
    const res = await api.get('/categories')
    categoriesList.value = res.data
    categoryOptions.value = res.data.map(c => ({
      label: c.name,
      value: c.id,
      icon: c.icon
    }))
    if (categoryOptions.value.length > 0 && !newApp.value.category_id) {
      newApp.value.category_id = categoryOptions.value[0].value
      newApp.value.category = categoryOptions.value[0].label
    }
  } catch (err) {
    console.error('Erreur chargement des catégories:', err)
  }
}

onMounted(() => {
  loadCategories()
})

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

const creatingApp = ref(false)
const newApp = ref({
  name: '',
  identifier: '',
  category_id: null,
  category: '',
  subcategory: '',
  short_description: '',
  countries: [],
  description: '',
  icon_url: '',
  official_site_url: '',
  privacy_policy_url: '',
  support_url: '',
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
  permissions_required: []
})

const canContinueIdentity = computed(
  () =>
    newApp.value.name.trim().length > 0 &&
    newApp.value.identifier.trim().length > 0 &&
    Boolean(newApp.value.category_id)
)

const canContinueScreenshots = computed(
  () => newApp.value.screenshots_mobile.length > 0
)

function addScreenshots(key, event) {
  const files = Array.from(event.target.files || [])
  files.forEach(file => {
    newApp.value[key].push({ file, url: URL.createObjectURL(file) })
  })
  event.target.value = ''
}

function removeScreenshot(key, index) {
  const [removed] = newApp.value[key].splice(index, 1)
  if (removed) URL.revokeObjectURL(removed.url)
}

onBeforeUnmount(() => {
  ;[
    ...newApp.value.screenshots_mobile,
    ...newApp.value.screenshots_tablet
  ].forEach(shot => URL.revokeObjectURL(shot.url))
})

async function createApp() {
  if (!canContinueIdentity.value) {
    step.value = 1
    $q.notify({ type: 'warning', message: 'Complétez les champs d’identité.' })
    return
  }
  if (!canContinueScreenshots.value) {
    step.value = 3
    $q.notify({
      type: 'warning',
      message: 'Ajoutez au moins une capture d’écran mobile.'
    })
    return
  }
  if (newVersion.value.zip_file && !newVersion.value.version_number.trim()) {
    step.value = 5
    $q.notify({
      type: 'warning',
      message: 'Indiquez le numéro de version du build importé.'
    })
    return
  }

  creatingApp.value = true
  try {
    const formData = new FormData()
    formData.append('name', newApp.value.name)
    formData.append('identifier', newApp.value.identifier)
    formData.append('category_id', newApp.value.category_id)
    const selectedCat = categoriesList.value.find(
      c => c.id === newApp.value.category_id
    )
    if (selectedCat) {
      formData.append('category', selectedCat.name)
    }
    if (newApp.value.subcategory) {
      formData.append('subcategory', newApp.value.subcategory)
    }
    formData.append('short_description', newApp.value.short_description)
    formData.append('description', newApp.value.description)
    if (newApp.value.countries?.length)
      newApp.value.countries.forEach(code =>
        formData.append('countries[]', code)
      )
    else formData.append('countries', '')
    if (newApp.value.icon_url) {
      formData.append('icon_url', newApp.value.icon_url)
    }
    if (newApp.value.official_site_url) {
      formData.append('official_site_url', newApp.value.official_site_url)
    }
    if (newApp.value.privacy_policy_url) {
      formData.append('privacy_policy_url', newApp.value.privacy_policy_url)
    }
    if (newApp.value.support_url) {
      formData.append('support_url', newApp.value.support_url)
    }

    Object.entries(newApp.value.compatibility)
      .filter(([, checked]) => checked)
      .forEach(([key]) => formData.append(`compatibility[${key}]`, 1))

    newApp.value.screenshots_mobile.forEach((shot, index) => {
      formData.append(`media[screenshots][mobile][${index}]`, shot.file)
    })
    newApp.value.screenshots_tablet.forEach((shot, index) => {
      formData.append(`media[screenshots][tablet][${index}]`, shot.file)
    })

    const response = await api.post('/apps', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    const appId = response.data?.id ?? response.data?.data?.id

    if (newVersion.value.zip_file && appId) {
      try {
        const version = await uploadInitialBuild(appId)
        const count = version?.detected_domains?.length || 0
        $q.notify({
          type: 'positive',
          message: count
            ? `Application et premier build créés. ${count} domaine(s) externe(s) détecté(s) automatiquement : ces informations seront transmises à l’équipe de validation.`
            : 'Application et premier build créés. Aucun domaine externe détecté.'
        })
      } catch (buildErr) {
        if (
          buildErr.response?.data?.error_code === 'PACKAGE_VALIDATION_FAILED'
        ) {
          $q.notify({
            type: 'warning',
            message:
              'Application créée, mais le build a été rejeté. Voir le détail.'
          })
          showValidationErrorDialog(buildErr.response.data)
        } else {
          $q.notify({
            type: 'warning',
            message:
              buildErr.response?.data?.message ||
              'Application créée, mais le build n’a pas pu être importé. Réessayez depuis la console.'
          })
        }
      }
    } else {
      $q.notify({
        type: 'positive',
        message: 'Application créée avec succès. En attente de validation.'
      })
    }
    router.push(`/developer/apps/${appId}/publication`)
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: err.response?.data?.message || 'Erreur lors de la création'
    })
  } finally {
    creatingApp.value = false
  }
}

async function uploadInitialBuild(appId) {
  const formData = new FormData()
  formData.append('application_id', appId)
  formData.append('version_number', newVersion.value.version_number)
  formData.append('zip_file', newVersion.value.zip_file)

  newVersion.value.permissions_required.forEach((perm, index) => {
    formData.append(`permissions_required[${index}]`, perm)
  })

  const { data } = await api.post('/versions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
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
</script>

<style scoped lang="scss">
.create-app-page {
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

/* ------------------------------------------------------------- */
/* STEPPER TABS (SINGLE LINE ENFORCED & COMPACT DESIGN)           */
/* ------------------------------------------------------------- */
.create-app-stepper {
  width: 100%;
  background: var(--glass);
  border: 1px solid var(--outline);
  border-radius: 14px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(16px);
  overflow: hidden;
}

// Keep contracted step icons centered inside their touch targets.
.create-app-stepper :deep(.q-stepper__header--contracted .q-stepper__tab) {
  min-width: 0;
  justify-content: center;
  padding: 12px 6px;
}
.create-app-stepper
  :deep(.q-stepper__header--contracted .q-stepper__tab .q-stepper__dot) {
  transform: none;
}

/* Keep the full desktop step labels on one scrollable line. */
.create-app-stepper :deep(.q-stepper__header) {
  display: flex !important;
  flex-wrap: nowrap !important;
  align-items: center;
  justify-content: space-between;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: none; /* Firefox */
  background: color-mix(in srgb, var(--surface-high) 45%, transparent);
  border-bottom: 1px solid var(--outline);
}

.create-app-stepper :deep(.q-stepper__header::-webkit-scrollbar) {
  display: none; /* Chrome/Safari */
}

.create-app-stepper :deep(.q-stepper__tab) {
  flex: 1 1 0%;
  min-width: max-content;
  white-space: nowrap;
  padding: 10px 14px;
  transition: all 0.2s ease;
  border-right: 1px solid color-mix(in srgb, var(--outline) 40%, transparent);

  &:last-child {
    border-right: none;
  }
}

.create-app-stepper :deep(.q-stepper__tab--active) {
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}

.create-app-stepper :deep(.q-stepper__dot) {
  width: 26px;
  height: 26px;
  font-size: 11px;
  font-weight: 800;
  border-radius: 8px;
  color: var(--muted);
  background: var(--surface-highest);
  transition: all 0.25s ease;
}

.create-app-stepper :deep(.q-stepper__tab--active .q-stepper__dot),
.create-app-stepper :deep(.q-stepper__tab--done .q-stepper__dot) {
  color: var(--pwa-on-primary);
  background: var(--primary);
  box-shadow: 0 3px 10px color-mix(in srgb, var(--primary) 40%, transparent);
}

.create-app-stepper :deep(.q-stepper__title) {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.create-app-stepper :deep(.q-stepper__caption) {
  font-size: 10px;
  color: var(--muted);
  opacity: 0.85;
}

/* ------------------------------------------------------------- */
/* STEP CONTENT & COMPACT FORM INPUTS DESIGN                      */
/* ------------------------------------------------------------- */
.create-app-stepper :deep(.q-stepper__step-inner) {
  color: var(--text);
  padding: 16px 20px 20px;
}

/* Polished Compact Form Inputs */
.create-app-stepper :deep(.q-field--filled .q-field__control) {
  border-radius: 10px;
  background: color-mix(in srgb, var(--surface-low) 85%, transparent);
  border: 1px solid var(--outline);
  padding: 0 12px;
  transition: all 0.2s ease;
}

.create-app-stepper :deep(.q-field--filled .q-field__control:before),
.create-app-stepper :deep(.q-field--filled .q-field__control:after) {
  display: none;
}

.create-app-stepper :deep(.q-field--focused .q-field__control) {
  border-color: var(--pwa-link);
  background: color-mix(in srgb, var(--surface-low) 98%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 22%, transparent);
}

.create-app-stepper :deep(.q-field__label) {
  font-weight: 600;
  font-size: 12px;
  color: var(--muted);
}

.create-app-stepper :deep(.q-field--float .q-field__label) {
  color: var(--pwa-link);
}

.create-app-stepper :deep(.q-field__native),
.create-app-stepper :deep(.q-field__input) {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
}

.create-app-stepper :deep(.q-field__prepend .q-icon) {
  color: var(--pwa-link);
  font-size: 18px;
}

/* ------------------------------------------------------------- */
/* CHECKBOXES & SCREENSHOTS CARDS                                 */
/* ------------------------------------------------------------- */
.checkbox-card {
  padding: 6px 12px;
  background: color-mix(in srgb, var(--surface-low) 60%, transparent);
  border: 1px solid var(--outline);
  border-radius: 8px;
  font-size: 12px;
  transition: border-color 0.2s ease;
  &:hover {
    border-color: color-mix(in srgb, var(--primary) 40%, var(--outline));
  }
}

.step-hint {
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.4;
}

.screenshot-group-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: var(--text);
  font-size: 12px;
  font-weight: 750;
}

.screenshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(95px, 1fr));
  gap: 8px;
}

.screenshot-thumb {
  position: relative;
  aspect-ratio: 9 / 16;
  overflow: hidden;
  border: 1px solid var(--outline);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.screenshot-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.screenshot-thumb-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  color: var(--pwa-on-primary);
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
}

.screenshot-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  aspect-ratio: 9 / 16;
  color: var(--muted);
  background: color-mix(in srgb, var(--surface-high) 55%, transparent);
  border: 1.5px dashed var(--outline);
  border-radius: 10px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.screenshot-dropzone:hover {
  color: var(--pwa-link);
  background: color-mix(in srgb, var(--primary) 8%, transparent);
  border-color: var(--pwa-link);
}

/* ------------------------------------------------------------- */
/* BUTTONS & NAVIGATION                                           */
/* ------------------------------------------------------------- */
.create-app-stepper :deep(.q-stepper__nav) {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid color-mix(in srgb, var(--outline) 60%, transparent);
  display: flex;
  align-items: center;
}

.create-btn {
  min-height: 36px;
  padding: 0 18px;
  color: var(--pwa-on-primary);
  background: var(--primary);
  font-weight: 750;
  border-radius: 9px;
  box-shadow: 0 6px 16px color-mix(in srgb, var(--primary) 28%, transparent);
  font-size: 12px;
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px color-mix(in srgb, var(--primary) 36%, transparent);
  }
}

.back-step-btn {
  min-height: 36px;
  padding: 0 14px;
  color: var(--muted);
  font-weight: 700;
  border-radius: 9px;
  font-size: 12px;
  &:hover {
    color: var(--text);
    background: var(--surface-high);
  }
}

/* Keep form controls readable in both native Quasar themes. */
.create-app-stepper :deep(.q-field) {
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

.create-app-stepper :deep(.checkbox-card) {
  background: var(--pwa-surface) !important;
  border: 1px solid var(--pwa-border) !important;
  border-radius: 10px;
  padding: 6px 12px;

  .q-checkbox__label {
    color: var(--pwa-text) !important;
    font-weight: 600 !important;
  }
}
</style>
