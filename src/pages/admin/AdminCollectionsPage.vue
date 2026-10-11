<template>
  <q-page class="workspace-page">
    <header class="workspace-heading"
      ><span class="eyebrow">Administration</span><h1>Sélections éditoriales</h1
      ><p
        >Les sélections actives apparaissent sur l’accueil, dans l’ordre choisi.
        Seules les applications publiées y sont visibles.</p
      ></header
    >
    <AdminNav />
    <div class="workspace-actions q-mb-md">
      <q-btn
        color="primary"
        no-caps
        icon="add"
        label="Nouvelle sélection"
        @click="edit()"
      />
    </div>
    <q-banner v-if="error" class="workspace-alert q-mb-md" role="alert">{{
      error
    }}</q-banner>
    <q-linear-progress v-if="loading" indeterminate />
    <div class="workspace-grid">
      <q-card
        v-for="collection in collections"
        :key="collection.id"
        flat
        bordered
        class="workspace-card"
      >
        <div class="row items-center q-gutter-sm">
          <h2 class="col">{{ collection.title }}</h2>
          <q-badge :color="collection.is_active ? 'positive' : 'grey-7'">{{
            collection.is_active ? 'Active' : 'Masquée'
          }}</q-badge>
        </div>
        <p class="text-muted">{{ collection.description }}</p>
        <p
          >{{ collection.applications.length }} application(s) ·
          {{
            collection.applications.filter(a => a.status === 'published').length
          }}
          publiée(s)</p
        >
        <div class="workspace-actions">
          <q-btn outline no-caps label="Modifier" @click="edit(collection)" />
          <q-btn
            flat
            no-caps
            color="negative"
            label="Supprimer"
            :disable="busy"
            @click="remove(collection)"
          />
        </div>
      </q-card>
    </div>
    <p v-if="!loading && !collections.length" class="text-muted"
      >Aucune sélection pour le moment.</p
    >

    <q-dialog v-model="dialog" :maximized="$q.screen.lt.sm">
      <q-card class="form-card">
        <q-form @submit="save">
          <q-card-section
            ><h2>{{
              form.id ? 'Modifier la sélection' : 'Nouvelle sélection'
            }}</h2></q-card-section
          >
          <q-card-section class="workspace-form">
            <q-input
              v-model="form.title"
              outlined
              label="Titre"
              maxlength="120"
              :rules="[v => !!v?.trim() || 'Titre requis']"
            />
            <q-input
              v-model="form.description"
              outlined
              type="textarea"
              autogrow
              maxlength="500"
              label="Description (facultatif)"
            />
            <q-input
              v-model.number="form.order"
              outlined
              type="number"
              label="Ordre sur l’accueil"
            />
            <q-toggle v-model="form.is_active" label="Afficher sur l’accueil" />
            <q-select
              v-model="form.applications"
              outlined
              multiple
              use-chips
              use-input
              input-debounce="300"
              :options="options"
              option-value="id"
              option-label="name"
              label="Applications (dans l’ordre d’affichage)"
              hint="Recherchez parmi les applications publiées"
              @filter="searchApps"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat no-caps label="Annuler" v-close-popup />
            <q-btn
              type="submit"
              color="primary"
              no-caps
              label="Enregistrer"
              :loading="busy"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import AdminNav from '@/components/AdminNav.vue'
import { adminApi } from '@/services/admin'
import { apiMessage } from '@/services/account'

const $q = useQuasar()
const collections = ref([]),
  loading = ref(true),
  busy = ref(false),
  error = ref(''),
  dialog = ref(false),
  options = ref([])
const blank = {
  id: null,
  title: '',
  description: '',
  order: 0,
  is_active: true,
  applications: []
}
const form = reactive({ ...blank })

async function load() {
  loading.value = true
  error.value = ''
  try {
    collections.value = (await adminApi.collections()).data
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    loading.value = false
  }
}
function edit(collection) {
  Object.assign(form, blank, collection ? { ...collection } : {})
  form.applications = [...(collection?.applications || [])]
  dialog.value = true
}
async function searchApps(text, update) {
  try {
    const { data } = await adminApi.apps({
      status: 'published',
      search: text || undefined,
      per_page: 20
    })
    update(() => (options.value = data.data))
  } catch {
    update(() => (options.value = []))
  }
}
async function save() {
  busy.value = true
  error.value = ''
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      order: Number(form.order) || 0,
      is_active: form.is_active,
      application_ids: form.applications.map(a => a.id)
    }
    await (form.id
      ? adminApi.updateCollection(form.id, payload)
      : adminApi.createCollection(payload))
    dialog.value = false
    $q.notify({ type: 'positive', message: 'Sélection enregistrée.' })
    await load()
  } catch (e) {
    error.value = apiMessage(e)
  } finally {
    busy.value = false
  }
}
function remove(collection) {
  $q.dialog({
    title: `Supprimer « ${collection.title} » ?`,
    message: 'Les applications ne sont pas affectées.',
    cancel: true
  }).onOk(async () => {
    busy.value = true
    try {
      await adminApi.deleteCollection(collection.id)
      await load()
    } catch (e) {
      error.value = apiMessage(e)
    } finally {
      busy.value = false
    }
  })
}
onMounted(load)
</script>
<style scoped>
.form-card {
  width: min(620px, 100vw);
}
h2 {
  font-size: 18px;
  font-weight: 750;
  margin: 0;
}
</style>
