<template>
  <q-page class="workspace-page">
    <header class="workspace-heading">
      <h1>{{ ui('Entreprises et individuels') }}</h1>
      <p>{{
        ui(
          'Créez une fiche éditeur et rattachez ses applications, sans compte développeur obligatoire.'
        )
      }}</p>
    </header>
    <AdminNav />
    <q-banner v-if="error" class="workspace-alert q-mb-md" role="alert">{{
      error
    }}</q-banner>
    <div class="row q-col-gutter-lg">
      <section class="col-12 col-md-5">
        <div class="workspace-card">
          <q-btn
            color="primary"
            no-caps
            icon="add"
            :disable="saving || linking"
            :label="ui('Nouvel éditeur')"
            @click="edit(null)"
          />
          <q-input
            v-model="search"
            outlined
            dense
            clearable
            debounce="300"
            class="q-mt-md"
            :label="ui('Rechercher un éditeur')"
            @update:model-value="reload"
          />
          <q-linear-progress v-if="loading" indeterminate class="q-mt-sm" />
          <q-list separator>
            <q-item
              v-for="publisher in publishers"
              :key="publisher.id"
              clickable
              :active="form.id === publisher.id"
              :disable="saving || linking"
              @click="edit(publisher)"
            >
              <q-item-section avatar
                ><q-icon
                  :name="
                    publisher.type === 'organization' ? 'business' : 'person'
                  "
              /></q-item-section>
              <q-item-section>
                <q-item-label>{{ publisher.public_name }}</q-item-label>
                <q-item-label caption
                  >{{ typeLabel(publisher.type) }} ·
                  {{ publisher.applications_count }}
                  {{ ui('applications rattachées') }}</q-item-label
                >
              </q-item-section>
            </q-item>
          </q-list>
          <p v-if="!loading && !publishers.length" class="text-muted">{{
            ui('Aucun éditeur trouvé.')
          }}</p>
          <q-pagination
            v-if="lastPage > 1"
            v-model="page"
            :max="lastPage"
            @update:model-value="load"
          />
        </div>
      </section>
      <section class="col-12 col-md-7">
        <div class="workspace-card">
          <h2>{{
            form.id ? ui('Modifier l’éditeur') : ui('Nouvel éditeur')
          }}</h2>
          <q-form class="q-gutter-md" @submit="save">
            <q-select
              v-model="form.type"
              :options="types"
              emit-value
              map-options
              outlined
              :label="ui('Type d’éditeur')"
            />
            <q-input
              v-model="form.public_name"
              outlined
              :label="ui('Nom public')"
              maxlength="160"
              :rules="[value => !!value?.trim() || ui('Champ obligatoire')]"
            />
            <q-input
              v-model="form.description"
              outlined
              type="textarea"
              :label="ui('Description')"
              maxlength="5000"
            />
            <q-input
              v-model="form.website"
              outlined
              type="url"
              :label="ui('Site web (HTTPS, facultatif)')"
              maxlength="2048"
            />
            <div class="row q-gutter-sm">
              <q-btn
                type="submit"
                color="primary"
                no-caps
                :loading="saving"
                :label="ui('Enregistrer')"
              />
              <q-btn
                v-if="form.id"
                flat
                no-caps
                :to="`/entities/${form.id}`"
                :label="ui('Voir la fiche publique')"
              />
            </div>
          </q-form>
        </div>
        <div v-if="form.id" class="workspace-card q-mt-md">
          <h2>{{ ui('Applications rattachées') }}</h2>
          <q-select
            v-model="application"
            :options="options"
            :option-label="applicationLabel"
            use-input
            clearable
            outlined
            input-debounce="300"
            :label="ui('Rechercher une application à rattacher')"
            @filter="findApplications"
          >
            <template #no-option
              ><q-item
                ><q-item-section>{{
                  ui('Aucune application trouvée.')
                }}</q-item-section></q-item
              ></template
            >
          </q-select>
          <p v-if="application?.publisher" class="text-muted"
            >{{ ui('Cette application sera déplacée depuis :') }}
            {{ application.publisher.public_name }}</p
          >
          <q-btn
            class="q-mt-sm"
            color="primary"
            no-caps
            :disable="!application"
            :loading="linking"
            :label="ui('Rattacher l’application')"
            @click="assign(application.id, form.id)"
          />
          <q-linear-progress
            v-if="loadingAssigned"
            indeterminate
            class="q-mt-sm"
          />
          <q-list separator>
            <q-item v-for="app in assigned" :key="app.id">
              <q-item-section
                ><q-item-label>{{ app.name }}</q-item-label
                ><q-item-label caption>{{
                  app.identifier
                }}</q-item-label></q-item-section
              >
              <q-item-section side
                ><q-btn
                  flat
                  no-caps
                  :disable="linking"
                  :label="ui('Détacher')"
                  @click="assign(app.id, null)"
              /></q-item-section>
            </q-item>
          </q-list>
          <p v-if="!loadingAssigned && !assigned.length" class="text-muted">{{
            ui('Aucune application rattachée.')
          }}</p>
          <q-pagination
            v-if="assignedLastPage > 1"
            v-model="assignedPage"
            :max="assignedLastPage"
            @update:model-value="loadAssigned"
          />
        </div>
      </section>
    </div>
  </q-page>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import AdminNav from '@/components/AdminNav.vue'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'
import { ui } from '@/i18n/text'

const $q = useQuasar()
const publishers = ref([]),
  search = ref(''),
  page = ref(1),
  lastPage = ref(1)
const loading = ref(false),
  saving = ref(false),
  linking = ref(false),
  error = ref('')
const assigned = ref([]),
  assignedPage = ref(1),
  assignedLastPage = ref(1),
  loadingAssigned = ref(false)
const application = ref(null),
  options = ref([])
const empty = () => ({
  id: null,
  type: 'organization',
  public_name: '',
  description: '',
  website: ''
})
const form = reactive(empty())
const typeLabel = type =>
  type === 'organization' ? ui('Entreprise') : ui('Individuel')
const types = computed(() =>
  ['organization', 'individual'].map(value => ({
    value,
    label: typeLabel(value)
  }))
)
const applicationLabel = app =>
  `${app.name} — ${app.identifier}${app.publisher ? ` · ${app.publisher.public_name}` : ''}`
let listRequest = 0,
  assignedRequest = 0,
  searchRequest = 0
async function load() {
  const request = ++listRequest
  loading.value = true
  try {
    const { data } = await adminApi.publishers({
      search: search.value || undefined,
      page: page.value
    })
    if (request !== listRequest) return
    publishers.value = data.data
    lastPage.value = data.last_page
  } catch (e) {
    if (request === listRequest) error.value = apiMessage(e)
  } finally {
    if (request === listRequest) loading.value = false
  }
}
function reload() {
  page.value = 1
  load()
}
function edit(publisher) {
  Object.assign(form, empty(), publisher || {})
  assigned.value = []
  assignedPage.value = 1
  application.value = null
  options.value = []
  error.value = ''
  ++assignedRequest
  ++searchRequest
  loadingAssigned.value = false
  if (form.id) loadAssigned()
}
async function save() {
  saving.value = true
  error.value = ''
  const editingId = form.id
  const payload = {
    type: form.type,
    public_name: form.public_name.trim(),
    description: form.description || null,
    website: form.website || null
  }
  try {
    const { data } = editingId
      ? await adminApi.updatePublisher(editingId, payload)
      : await adminApi.createPublisher(payload)
    // Keep the edited identity selected after creation.
    if (form.id === editingId) edit(data)
    await load()
    $q.notify({ type: 'positive', message: ui('Éditeur enregistré.') })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    saving.value = false
  }
}
async function loadAssigned() {
  const request = ++assignedRequest
  loadingAssigned.value = true
  try {
    const { data } = await adminApi.publisherApplications({
      publisher_id: form.id,
      page: assignedPage.value
    })
    if (request !== assignedRequest) return
    assigned.value = data.data
    assignedLastPage.value = data.last_page
  } catch (e) {
    if (request === assignedRequest) error.value = apiMessage(e)
  } finally {
    if (request === assignedRequest) loadingAssigned.value = false
  }
}
async function findApplications(value, update, abort) {
  const request = ++searchRequest
  try {
    const { data } = await adminApi.publisherApplications({
      search: value || undefined
    })
    if (request !== searchRequest) {
      abort()
      return
    }
    update(() => {
      options.value = data.data.filter(app => app.publisher_id !== form.id)
    })
  } catch (e) {
    if (request === searchRequest) error.value = apiMessage(e)
    abort()
  }
}
async function assign(id, publisherId) {
  linking.value = true
  error.value = ''
  try {
    await adminApi.assignPublisher(id, publisherId)
    application.value = null
    assignedPage.value = 1
    await Promise.all([loadAssigned(), load()])
    $q.notify({ type: 'positive', message: ui('Rattachement mis à jour.') })
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    linking.value = false
  }
}
onMounted(load)
</script>
<style scoped>
h2 {
  font-size: 20px;
  margin: 0 0 18px;
}
</style>
